import type { ParsedExpense, CategoryType } from '../types/api.js';

export function fallbackParseExpense(rawText: string): ParsedExpense {
  const normalized = rawText.toLowerCase().trim();

  // 1. Deteksi nominal
  const amount = detectAmount(normalized);

  // 2. Deteksi kategori
  const category = detectCategory(normalized);

  // 3. Generate nudge
  const nudge = generateNudge(amount, category, normalized);

  // 4. Bersihin judul
  const text = cleanTitle(rawText);

  // 5. Deteksi split bill
  const splitBill = detectSplitBill(normalized, amount);

  const finalAmount = splitBill ? splitBill.myShare : amount;

  return { amount: finalAmount, category, text, nudge, ...(splitBill && { splitBill }) };
}

function detectAmount(text: string): number {
  // Slang numbers
  const slangMap: Record<string, number> = {
    'gocap': 50000, 'ceban': 10000, 'goceng': 5000,
    'cepek': 100000, 'gopek': 500000, 'seceng': 1000, 'ceng': 1000000
  };

  for (const [slang, value] of Object.entries(slangMap)) {
    if (text.includes(slang)) return value;
  }

  // Regex nominal
  const patterns = [
    /(\d+)\s*(?:rb|ribu|k)\b/i,        // 15rb
    /(\d+[.,]\d+)\s*(?:jt|juta|m)\b/i,  // 1.5jt
    /(\d+)\s*(?:jt|juta|m)\b/i,         // 1jt
    /(\d[\d.,]*\d)/                      // 15000
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let num = parseFloat(match[1].replace(/[.,]/g, match[1].includes(',') ? '.' : ''));
      if (/rb|ribu|k/i.test(text)) num *= 1000;
      if (/jt|juta|m/i.test(text)) num *= 1000000;
      return num;
    }
  }

  return 0;
}

function detectCategory(text: string): CategoryType {
  const keywordMap: Record<CategoryType, string[]> = {
    'Olahraga & Kebugaran': ['gym', 'fitness', 'ngefit', 'nge-gym', 'workout', 'yoga', 'pilates', 'protein', 'whey', 'creatine'],
    'Makanan & Minuman': ['mie', 'ayam', 'geprek', 'bakso', 'nasi', 'kopi', 'boba', 'seblak', 'gofood', 'grabfood', 'makan', 'sarapan'],
    'Transportasi': ['gojek', 'grab', 'bensin', 'ojol', 'krl', 'busway', 'parkir', 'bonceng', 'borgol'],
    'Hiburan': ['netflix', 'spotify', 'genshin', 'game', 'konser', 'nonton', 'topup', 'nge-game', 'mabar'],
    'Belanja & Fashion': ['shopee', 'tokopedia', 'baju', 'sepatu', 'skincare', 'parfum', 'belanja', 'haul'],
    'Keuangan & Investasi': ['nabung', 'invest', 'saham', 'crypto', 'emas', 'transfer', 'bayar utang'],
    'Pendidikan': ['buku', 'fotokopi', 'print', 'kursus', 'bimbel', 'spp', 'ukt'],
    'Kesehatan & Kebutuhan Pokok': ['dokter', 'obat', 'laundry', 'wifi', 'pulsa', 'listrik', 'galon', 'kos'],
    'Pulsa, Tagihan & Topup Digital': ['topup gopay', 'isi ovo', 'isi dana', 'token listrik', 'bayar wifi'],
    'Lainnya': []
  };

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(k => text.includes(k))) {
      return category as CategoryType;
    }
  }

  return 'Lainnya';
}

function generateNudge(amount: number, category: CategoryType, text: string): string {
  const nudges: Record<string, string[]> = {
    'Olahraga & Kebugaran': ['Sehat itu mahal, tapi worth it! 💪', 'Badan sehat mental kuat!'],
    'Makanan & Minuman': ['Lapar emang musuh dompet 😤', 'Enak sih kayaknya!'],
    'Transportasi': ['Mobilitas tinggi nih! 🚀', 'Semoga lancar selalu!'],
    'Hiburan': ['Mental health is important! ✨', 'Self reward gapapa kok!'],
    'Keuangan & Investasi': ['Mindset kaya! 🔥', 'Future lo cerah nih!'],
    'Lainnya': ['Tercatat! Aman ya.', 'Duit keluar lagi nih~']
  };

  const pool = nudges[category] || nudges['Lainnya'];

  if (amount === 0) return 'Nominalnya belum nih. Edit lagi ya!';
  if (amount > 100000) return 'Wadaw boros! Tapi happy kan? 🥲';
  if (amount <= 20000) return 'Irit banget! Jagoan nih! ✨';

  return pool[Math.floor(Math.random() * pool.length)];
}

function cleanTitle(rawText: string): string {
  return rawText
    .replace(/\d[\d.,]*\s*(rb|ribu|jt|juta|k|m|rp)?/gi, '')
    .replace(/[.,]/g, '')
    .trim()
    .substring(0, 40);
}

function detectSplitBill(text: string, amount: number): { totalAmount: number; myShare: number; friendNames: string[] } | null {
  const splitMatch = text.match(/(?:bagi|split|patungan)\s*(?:ber)?(\d+)/i);
  if (!splitMatch) return null;

  const totalPeople = parseInt(splitMatch[1]);
  if (totalPeople <= 1 || isNaN(totalPeople)) return null;

  return {
    totalAmount: amount,
    myShare: Math.round(amount / totalPeople),
    friendNames: Array.from({ length: totalPeople - 1 }, (_, i) => `Teman ${i + 1}`)
  };
}
