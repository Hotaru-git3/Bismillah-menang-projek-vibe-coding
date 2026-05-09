import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nvidiaClient } from '../src/services/nvidiaClient.js';
import { fallbackParseExpense } from '../src/services/fallbackParser.js';
import { SecurityUtils } from '../src/utils/security.js';
import type { ParsedExpense, WeeklySummary, SavingsChallenge, RecurringExpense, MicroLesson, AuraRoast, Proyeksi } from '../src/types/api.js';

function isVercelAIError(error: any): boolean {
  const msg = error?.message || '';
  return [
    'VERCEL_AI_DOWN',
    'VERCEL_MAX_RETRIES',
    'VERCEL_HTML_RESPONSE',
    'VERCEL_ERROR_RESPONSE',
    'VERCEL_NOT_JSON',
    'VERCEL_JSON_PARSE_ERROR'
  ].some(code => msg.includes(code));
}

const ipStore = new Map<string, { count: number, resetTime: number }>();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate Limiting (OWASP Top 10)
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const rateLimitWindow = 60 * 1000; // 1 minute
  const maxRequests = 20;

  const ipData = ipStore.get(ip) || { count: 0, resetTime: now + rateLimitWindow };
  if (now > ipData.resetTime) {
    ipData.count = 1;
    ipData.resetTime = now + rateLimitWindow;
  } else {
    ipData.count++;
  }
  ipStore.set(ip, ipData);

  if (ipData.count > maxRequests) {
    return res.status(429).json({ error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' });
  }

  // Payload size check (OWASP Top 10)
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length'], 10);
    if (contentLength > 5 * 1024 * 1024) { // 5MB limit
      return res.status(413).json({ error: 'Payload Too Large', code: 'PAYLOAD_TOO_LARGE' });
    }
  }

  const { action, payload } = req.body || {};

  try {
    switch (action) {
      case 'parseReceiptImage': {
        const fileBase64 = payload?.fileBase64;
        const mimeType = payload?.mimeType;

        if (!fileBase64 || typeof fileBase64 !== 'string' || !mimeType || typeof mimeType !== 'string') {
          return res.status(400).json({ error: 'Invalid input data' });
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(mimeType)) {
          return res.status(400).json({ error: 'Invalid MIME type' });
        }
        
        try {
          const content = [
            { type: "text", text: "You are a receipt analyzer. Please analyze this receipt image and extract a concise, single-line text summary of what it is and the total price. E.g., 'makan siang di warteg 35000' or 'belanja bulanan di minimarket 125000'. Do not include any other text besides this summary string. If it's not a receipt or you can't read the price, just reply 'gagal'." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64.substring(0, 4000000)}` } }
          ];
          
          const resultText = await nvidiaClient.chat([{ role: 'user', content: content as any }]);
          return res.status(200).json({ result: SecurityUtils.sanitizeInput(resultText.trim()) });
        } catch (err: any) {
          console.error("Image parsing error", err?.response?.data || err);
          return res.status(200).json({ result: "gagal: Model tidak mendukung gambar" });
        }
      }

      case 'parseExpenseText': {
        const rawText = SecurityUtils.sanitizeInput(payload?.rawText || '');
        
        try {
          const result = await nvidiaClient.chatJSON<ParsedExpense>([
            {
              role: 'system',
              content: `Kamu parser keuangan Gen-Z Indonesia. Ekstrak input jadi JSON.
{
  "amount": number (dalam Rupiah),
  "category": "Makanan & Minuman|Transportasi|Hiburan|Belanja & Fashion|Olahraga & Kebugaran|Kesehatan & Kebutuhan Pokok|Keuangan & Investasi|Pendidikan|Pulsa, Tagihan & Topup Digital|Lainnya",
  "text": "deskripsi singkat max 40 char",
  "nudge": "1 kalimat Gen-Z santai (max 10 kata)",
  "splitBill"?: { "totalAmount": number, "myShare": number, "friendNames": string[] }
}
Rules: "rb/ribu/k"=×1000, "jt/juta/M"=×1000000. "nge-gym"=Olahraga. "laundry"=Kebutuhan.`
            },
            { role: 'user', content: rawText }
          ]);

          // Validasi output Integrity check
          if (!SecurityUtils.validateAmount(result.amount)) result.amount = 0;
          if (!SecurityUtils.validateCategory(result.category)) result.category = 'Lainnya';
          if (result.text) result.text = SecurityUtils.sanitizeInput(result.text).substring(0, 100);
          if (result.nudge) result.nudge = SecurityUtils.sanitizeInput(result.nudge).substring(0, 100);

          return res.status(200).json({ result });
        } catch (apiError: any) {
          if (isVercelAIError(apiError) || apiError?.message === 'AI response bukan JSON valid') {
            console.warn('⚠️ Vercel AI error, fallback ke local parser');
            const fallbackResult = fallbackParseExpense(rawText);
            return res.status(200).json({ result: fallbackResult });
          }
          throw apiError;
        }
      }

      case 'generateWeeklySummary': {
        const expenses = SecurityUtils.validateExpenses(payload?.expenses).slice(0, 30);
        const json = JSON.stringify(expenses.map((e: any) => ({
          item: e.text, amount: e.amount, category: e.category, date: e.date
        })));

        try {
          const result = await Promise.race([
            nvidiaClient.chatJSON<WeeklySummary>([
              {
                role: 'system',
                content: `Analisis pengeluaran mingguan Gen-Z Indonesia.
Output JSON:
{
  "summary": "3-4 kalimat ringkasan Bahasa Indonesia gaul",
  "topCategories": ["3 kategori terbesar"],
  "tip": "1 tips actionable"
}`
              },
              { role: 'user', content: json }
            ]),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('VERCEL_TIMEOUT')), 8000))
          ]);
          return res.status(200).json({ result });
        } catch (error: any) {
          console.warn('⚠️ Vercel timeout/error:', error.message);
          return res.status(200).json({
            result: {
              summary: 'Minggu ini lo lumayan hemat! Pertahankan.',
              topCategories: ['Lainnya'],
              tip: 'Jangan lupa nabung buat masa depan.'
            }
          });
        }
      }

      case 'generateAuraRoast': {
        const expenses = SecurityUtils.validateExpenses(payload?.expenses).slice(0, 40);
        const json = JSON.stringify(expenses.map((e: any) => ({
          item: e.text, amount: e.amount, category: e.category, mood: e.mood
        })));

        try {
          const result = await Promise.race([
            nvidiaClient.chatJSON<AuraRoast>([
              {
                role: 'system',
                content: `Roasting pengeluaran Gen-Z Indonesia. Pedas lucu, jangan SARA.
Output JSON:
{
  "aura": "warna aura keuangan (Merah Menyala|Ijo Stabil|Abu-abu Suram|Kuning Optimis)",
  "characterTitle": "julukan lucu (Si Raja GoFood|Investor FOMO|Kang Kopi Senja|Sultan Palsu)",
  "roast": "2-3 kalimat roast Bahasa gaul Jakarta, akhiri tips positif"
}`
              },
              { role: 'user', content: json }
            ]),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('VERCEL_TIMEOUT')), 8000))
          ]);
          return res.status(200).json({ result });
        } catch (error: any) {
          return res.status(200).json({
            result: {
              aura: 'Ijo Stabil',
              characterTitle: 'Pengamat Keuangan',
              roast: 'Lagi aman nih dompet lo, pertahankan yes!'
            }
          });
        }
      }

      case 'generateProyeksi': {
        const expenses = SecurityUtils.validateExpenses(payload?.expenses);
        const json = JSON.stringify(expenses.map((e: any) => ({
          item: e.text, amount: e.amount, category: e.category, date: e.date
        })));

        try {
          const result = await Promise.race([
            nvidiaClient.chatJSON<Proyeksi>([
              {
                role: 'system',
                content: `Proyeksi keuangan Gen-Z.
Output JSON:
{
  "latteFactor": {
    "items": ["3 pengeluaran kecil berulang"],
    "yearlyCost": number,
    "equivalentText": "setara X gram emas (Rp 1.400.000/g) atau Y bulan kos (Rp 1.500.000/bln)"
  },
  "investmentMachine": {
    "currentMonthly": number,
    "projected1Y": number (asumsi 10% return/tahun),
    "projected3Y": number,
    "projected5Y": number,
    "encouragement": "kalimat penyemangat Gen-Z"
  }
}`
              },
              { role: 'user', content: json }
            ]),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('VERCEL_TIMEOUT')), 8000))
          ]);
          return res.status(200).json({ result });
        } catch (error: any) {
          return res.status(200).json({
            result: {
              latteFactor: { items: [], yearlyCost: 0, equivalentText: 'Data belum cukup' },
              investmentMachine: { currentMonthly: 0, projected1Y: 0, projected3Y: 0, projected5Y: 0, encouragement: 'Gas nabung dari sekarang!' }
            }
          });
        }
      }

      case 'detectRecurringExpense': {
        const expenses = SecurityUtils.validateExpenses(payload?.expenses).slice(0, 50);
        const json = JSON.stringify(expenses.map((e: any) => ({
          item: e.text, amount: e.amount, date: e.date
        })));

        try {
          const result = await Promise.race([
            nvidiaClient.chatJSON<RecurringExpense>([
              {
                role: 'system',
                content: `Deteksi pola pengeluaran berulang.
Output JSON:
{
  "detected": boolean,
  "text": "deskripsi pola (Bahasa Indonesia gaul)",
  "projection6Months": number
}`
              },
              { role: 'user', content: json }
            ]),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('VERCEL_TIMEOUT')), 8000))
          ]);
          return res.status(200).json({ result });
        } catch (error: any) {
          return res.status(200).json({
            result: { detected: false, text: 'AI lagi sibuk, coba lagi nanti ya', projection6Months: 0 }
          });
        }
      }

      case 'generateMicroLesson': {
        const expenses = SecurityUtils.validateExpenses(payload?.expenses).slice(0, 30);
        const json = JSON.stringify(expenses.map((e: any) => ({
          item: e.text, amount: e.amount, category: e.category
        })));

        try {
          const result = await Promise.race([
            nvidiaClient.chatJSON<MicroLesson>([
              {
                role: 'system',
                content: `Mini-course financial literacy Gen-Z Indonesia.
Output JSON:
{
  "title": "judul materi",
  "content": "isi 2-3 paragraf Bahasa Indonesia santai",
  "question": "1 pertanyaan quiz",
  "correctAnswer": "jawaban benar",
  "options": ["4 pilihan jawaban"]
}`
              },
              { role: 'user', content: json }
            ]),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('VERCEL_TIMEOUT')), 8000))
          ]);
          return res.status(200).json({ result });
        } catch (error: any) {
          return res.status(200).json({
            result: { title: 'Belajar Keuangan', content: 'Coba refresh atau tunggu sebentar ya.', question: '-', correctAnswer: '-', options: ["-", "-", "-", "-"] }
          });
        }
      }

      case 'generateSavingsChallenge': {
        const expenses = SecurityUtils.validateExpenses(payload?.expenses).slice(0, 30);
        const json = JSON.stringify(expenses.map((e: any) => ({
          item: e.text, amount: e.amount, category: e.category
        })));

        try {
          const result = await Promise.race([
            nvidiaClient.chatJSON<SavingsChallenge>([
              {
                role: 'system',
                content: `Tantangan hemat mingguan Gen-Z.
Output JSON:
{
  "text": "tantangan mingguan (Bahasa Indonesia gaul)",
  "targetAmount": number (estimasi hemat dalam Rupiah)
}`
              },
              { role: 'user', content: json }
            ]),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('VERCEL_TIMEOUT')), 8000))
          ]);
          return res.status(200).json({ result });
        } catch (error: any) {
           return res.status(200).json({
             result: { text: 'Coba hemat minggu ini ya!', targetAmount: 0 }
           });
        }
      }

      default:
        return res.status(400).json({ error: 'Unknown action', code: 'UNKNOWN_ACTION' });
    }

  } catch (error: any) {
    console.error('❌ API Error:', error.message);

    if (error.message === 'INVALID_INPUT') {
      return res.status(400).json({
        error: 'Input tidak valid. Coba lagi dengan format pengeluaran normal ya!',
        code: 'INVALID_INPUT'
      });
    }

    return res.status(500).json({
      error: 'AI-nya lagi sibuk. Coba lagi sebentar ya 🙏',
      code: 'AI_UNAVAILABLE'
    });
  }
}
