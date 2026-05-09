import { Expense } from "../utils/storage";
import { ParsedExpense } from "./geminiServiceTypes";

async function callGeminiApi(action: string, payload: any) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Gagal menghubungi server");
  }
  return data.result;
}

export async function parseReceiptImage(fileBase64: string, mimeType: string): Promise<string> {
    return callGeminiApi("parseReceiptImage", { fileBase64, mimeType });
}

export async function parseExpenseText(rawText: string): Promise<ParsedExpense> {
    try {
        return await callGeminiApi("parseExpenseText", { rawText });
    } catch (error) {
        console.warn("API Error, using fallback parser:", error);
        
        let normalizedText = (rawText || '').toLowerCase()
            .replace(/\b(gw|gue|aku|ana|ogut)\b/g, 'saya')
            .replace(/\b(abis|abisan|baru aja|udah|dah|wasted)\b/g, 'sudah')
            .replace(/\b(laper|lapar banget|mules)\b/g, 'lapar')
            .replace(/\b(borgol)\b/g, 'bonceng')
            .replace(/\b(buat|buat bayar|buat beli)\b/g, '')
            .replace(/\b(nih|tuh|dong|sih|deh|kan|ges|bestie|bro|sis|gengs|temen-temen)\b/g, '')
            .replace(/\b(yaudah|yasudah|udahlah)\b/g, '')
            .replace(/\b(btw|fyi|cmiiw|wkwk|lol|😭😭|🥲)\b/g, '');

        let amount = 0;
        
        // Convert Gen-Z numbers (gocap, ceban, goceng, cepek, gopek)
        if (/\bgocap\b/i.test(normalizedText)) amount = 50000;
        else if (/\bceban\b/i.test(normalizedText)) amount = 10000;
        else if (/\bgoceng\b/i.test(normalizedText)) amount = 5000;
        else if (/\bcepek\b/i.test(normalizedText)) amount = 100000;
        else if (/\bgopek\b/i.test(normalizedText)) amount = 500000;
        else if (/\bseceng\b/i.test(normalizedText)) amount = 1000;
        else if (/\bceng\b/i.test(normalizedText)) amount = 1000000;
        else {
            const numRegex = /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?\b/g;
            const numMatch = normalizedText.match(numRegex);
            
            if (numMatch) {
                const numbers = numMatch.map(n => {
                    let cleanN = n;
                    if (/^\d{1,3}([.,]\d{3})+$/.test(n)) {
                        cleanN = n.replace(/[.,]/g, '');
                    } else {
                        cleanN = n.replace(/,/g, '.');
                    }
                    return parseFloat(cleanN);
                });
                amount = Math.max(...numbers.filter(n => !isNaN(n)));
                
                if (/\b(?:rb|ribu|k)\b/i.test(normalizedText) && amount <= 5000) {
                    amount *= 1000;
                } else if (/\b(?:jt|juta|m)\b/i.test(normalizedText) && amount <= 1000) {
                    amount *= 1000000;
                } else if (/\b100k\b/i.test(normalizedText)) {
                    amount = 100000;
                }
            }
        }

        let category: ParsedExpense['category'] = 'Lainnya';
        
        const isMakan = ['mie', 'ayam', 'geprek', 'bakso', 'soto', 'nasi', 'kopi', 'es', 'boba', 'susu', 'teh', 'jajan', 'gorengan', 'chitato', 'indomie', 'warteg', 'padang', 'cheesecake', 'martabak', 'moge', 'starbucks', 'kopken', 'jiwa', 'chatime', 'mixue', 'seblak', 'cimol', 'cilok', 'pentol', 'sosis', 'somay', 'dimsum', 'siomay', 'batagor', 'burger', 'pizza', 'kfc', 'mcd', 'hokben', 'wendy', 'ricis', 'nasgor', 'roti', 'waffle', 'croissant', 'salad', 'jus', 'krim', 'dessert', 'catering', 'makan', 'food', 'lapar', 'breakfast', 'lunch', 'dinner', 'brunch', 'ngafe', 'cafe', 'wfc', 'nongkrong', 'mukbang', 'lawson', 'familymart'].some(kw => normalizedText.includes(kw));
        const isTransport = ['bensin', 'pertamax', 'pertalite', 'bbm', 'gojek', 'goride', 'gocar', 'grab', 'grabbike', 'grabtaxi', 'maxim', 'indrive', 'ojek', 'uber', 'taxi', 'krl', 'commuter', 'mrt', 'lrt', 'busway', 'transjakarta', 'tj', 'bis', 'angkot', 'travel', 'pesawat', 'tiket', 'parkir', 'tol', 'e-toll', 'bluebird', 'cititrans', 'damri', 'ojol', 'bonceng', 'stasiun', 'terminal', 'bandara', 'shell', 'bp', 'vivo', 'spbu'].some(kw => normalizedText.includes(kw));
        const isHiburan = ['netflix', 'spotify', 'disney', 'hotstar', 'prime', 'youtube', 'hbo', 'vidio', 'iqiyi', 'viu', 'wetv', 'game', 'ml', 'legend', 'valorant', 'pubg', 'genshin', 'freefire', 'steam', 'gacha', 'skin', 'diamond', 'uc', 'voucher', 'konser', 'musik', 'bioskop', 'xx1', 'cgv', 'cinepolis', 'nonton', 'streaming', 'karaoke', 'happy puppy', 'inul', 'timezone', 'arcade', 'bowling', 'billiard', 'dufan', 'ancol', 'playdate', 'healing', 'liburan', 'staycation', 'museum', 'pameran', 'photobox'].some(kw => normalizedText.includes(kw)) || (normalizedText.includes('topup') && !['gopay', 'ovo', 'dana', 'shopeepay', 'linkaja', 'emoney', 'e-money'].some(kw => normalizedText.includes(kw))) || (normalizedText.includes('nge-game'));
        const isBelanja = ['baju', 'celana', 'hoodie', 'jaket', 'sepatu', 'sandal', 'topi', 'tas', 'dompet', 'jam', 'parfum', 'skincare', 'serum', 'sunscreen', 'moisturizer', 'lipstik', 'cushion', 'bedak', 'makeup', 'thrift', 'preloved', 'toko', 'distro', 'uniqlo', 'h&m', 'pull&bear', 'bershka', 'strap', 'casing', 'hp', 'aksesoris', 'shopee', 'tokopedia', 'lazada', 'tiktok', 'zalora', 'sociolla', 'sephora', 'beauty', 'check out', 'cod', 'belanja', 'miniso', 'ikea', 'diy', 'mr diy'].some(kw => normalizedText.includes(kw) && !normalizedText.includes('topup'));
        const isInvestasi = ['nabung', 'tabungan', 'invest', 'reksadana', 'saham', 'crypto', 'bitcoin', 'ethereum', 'solana', 'bareksa', 'bibit', 'ajaib', 'gotrade', 'deposito', 'emas', 'antam', 'pajak', 'zakat', 'infaq', 'sedekah', 'donasi', 'kitabisa', 'utang', 'hutang', 'bayar utang'].some(kw => normalizedText.includes(kw));
        const isKesehatanPendidikan = ['dokter', 'berobat', 'klinik', 'sakit', 'puskesmas', 'bpjs', 'obat', 'apotek', 'vitamin', 'masker', 'sabun', 'sampo', 'odol', 'gigi', 'deterjen', 'galon', 'aqua', 'kos', 'kost', 'kontrakan', 'kucing', 'cat', 'vaksin', 'laundry', 'nyuci'].some(kw => normalizedText.includes(kw));
        const isPendidikan = ['buku', 'fotokopi', 'print', 'jilid', 'tugas', 'spp', 'ukt', 'kuliah', 'bulanan', 'ebook', 'kursus', 'webinar', 'skillshare', 'udemy', 'ruang', 'zenius', 'bimbel', 'atk', 'pulpen', 'binder', 'catatan', 'seminar', 'workshop', 'bootcamp', 'sertifikasi', 'toefl', 'ielts'].some(kw => normalizedText.includes(kw));
        const isOlahraga = ['gym', 'fitness', 'ngefit', 'workout', 'yoga', 'pilates', 'zumba', 'muay thai', 'boxing', 'crossfit', 'protein', 'whey', 'creatine', 'supplement', 'bcaa', 'pre-workout', 'magnesium', 'angkat beban', 'cardio', 'treadmill', 'sepeda statis', 'sport wear', 'legging', 'sepatu lari', 'nge-gym'].some(kw => normalizedText.includes(kw)) && !(normalizedText.includes('ayam') || normalizedText.includes('tahu') || normalizedText.includes('tempe'));
        const isTagihan = ['pulsa', 'paketan', 'kuota', 'token', 'listrik', 'pln', 'wifi', 'indihome', 'biznet', 'myrepublic', 'tagihan', 'topup gopay', 'isi ovo', 'isi dana', 'topup dana', 'shopeepay', 'linkaja', 'e-money', 'e-toll', 'bayar netflix', 'bayar spotify', 'bayar disney', 'bayar iuran', 'qris', 'transfer', 'tarik', 'admin', 'm-banking', 'atm'].some(kw => normalizedText.includes(kw)) || (normalizedText.includes('topup') && !isHiburan);

        if (isOlahraga) category = 'Olahraga & Kebugaran';
        else if (isTagihan) category = 'Pulsa, Tagihan & Topup Digital';
        else if (isMakan && !normalizedText.includes('protein')) category = 'Makanan & Minuman';
        else if (isTransport) category = 'Transportasi';
        else if (isHiburan) category = 'Hiburan';
        else if (isBelanja) category = 'Belanja & Fashion';
        else if (isInvestasi) category = 'Keuangan & Investasi';
        else if (isPendidikan) category = 'Pendidikan';
        else if (isKesehatanPendidikan) category = 'Kesehatan & Kebutuhan Pokok';
        
        let nudge = "Wah, ngeluarin duit ya? Tetap catat biar aman.";
        const date = new Date();
        const isFriday = date.getDay() === 5;
        const hour = date.getHours();

        if (amount === 0) {
            const noNominalFeedbacks = [
                "Nominalnya belum nih. Kecepetan pencet enter ya?",
                "Waduh, nominalnya ketelen. Coba edit lagi ya, bestie!",
                "Bro, angkanya mana? Masa bayar pake doa 😅"
            ];
            nudge = noNominalFeedbacks[Math.floor(Math.random() * noNominalFeedbacks.length)];
        } else if (category === 'Olahraga & Kebugaran') {
            const fb = [
                "Otomatis sehat, otomatis glowing. Tapi otomatis dompet nangis juga 😭",
                "Nge-gym mulu. Nanti jadiin influencer fitness aja deh!",
                "Badan sehat, mental kuat, tugas numpuk? Sikat! 💪"
            ];
            nudge = fb[Math.floor(Math.random() * fb.length)];
        } else if (category === 'Hiburan' && normalizedText.includes('topup')) {
             const fb = [
                "Gacha mulu. Kapan dapet rate off? Semoga hoki ya bestie! 🍀",
                "Topup terus, rank naik dikit. Worth it? Worth it lah ya..",
                "Demi Raiden, apapun dilakukan. Dedikasi tinggi! ⚡"
            ];
            nudge = fb[Math.floor(Math.random() * fb.length)];
        } else if (category === 'Kesehatan & Kebutuhan Pokok' && (normalizedText.includes('laundry') || normalizedText.includes('nyuci'))) {
            const fb = [
                "Laundry mulu. Kapan beli mesin cuci sendiri? 😂",
                "Baju bersih, hati tenang. Meskipun uang melayang~",
                "Nyuci baju adalah self care juga kan ya?"
            ];
            nudge = fb[Math.floor(Math.random() * fb.length)];
        } else if (category === 'Keuangan & Investasi' && (normalizedText.includes('kirim') || normalizedText.includes('transfer'))) {
            const fb = [
                "Kirim-kirim duit. Semoga berkah dan balik modal ya! 💸",
                "Duit lo udah di tangan yang tepat (semoga).",
                "Ngitung pengeluaran sambil berdoa yang dikirim cepet sukses. Amin!"
            ];
            nudge = fb[Math.floor(Math.random() * fb.length)];
        } else if (isFriday && Math.random() > 0.5) {
             const fb = [
                "Happy Friday! Jajan mulu ya hari ini 😂",
                 "Jumat = Jajan Mumpung Ada Uang. Relate? 🫠",
                "Hari Jumat berkah! Tapi dompet lo kurang berkah kayaknya.",
                "Weekend mood on, saving mode off."
            ];
            nudge = fb[Math.floor(Math.random() * fb.length)];
        } else if (hour < 10 && category === 'Makanan & Minuman') {
             nudge = "Sarapan dulu sebelum dunia makin keras. Setuju! ☕";
        } else if (hour > 20 && category === 'Makanan & Minuman') {
             nudge = "Nugas sampe malem emang butuh asupan. Lanjutkan perjuanganmu! 💪";
        } else if (amount > 0 && amount % 50000 === 0 && Math.random() > 0.5) {
             nudge = "Nominal genep gini enak diliatnya. Rapih! ✨";
        } else if (amount > 100000) {
            const highFeedbacks = [
                "Wadaw! Boros nih. Ya udah lah ya, yang penting happy! 🥲",
                "Boncos parah. Ingat cicilan ya ges!",
                "Gapapa, self reward dulu. Besok puasa! 😂",
            ];
            nudge = highFeedbacks[Math.floor(Math.random() * highFeedbacks.length)];
        } else if (amount <= 20000) {
            const lowFeedbacks = [
                "Murah banget! Tiap hari gini dong belanjanya.",
                "Hemat raja! Irit tapi berkah. 😇",
                "Receh amat. Tapi lama-lama jadi bukit lho, bestie."
            ];
            nudge = lowFeedbacks[Math.floor(Math.random() * lowFeedbacks.length)];
        } else {
             if (category === 'Makanan & Minuman') {
                nudge = "Lapar sih emang musuh utama dompet.";
            } else if (category === 'Transportasi') {
                nudge = "Pergi-pergi mulu nih. Sukses selalu ya hustle-nya!";
            } else if (category === 'Hiburan') {
                nudge = "Mental health is important. Tapi jangan lupa nabung! ✨";
            } else if (category === 'Belanja & Fashion') {
                nudge = "New items unlocked! Jangan nambah keranjang lagi ya hari ini.";
            } else if (category === 'Keuangan & Investasi') {
                nudge = "Bagus bro! Masa depan cerah menanti 🚀";
            } else if (category === 'Kesehatan & Kebutuhan Pokok') {
                nudge = "Pengeluaran wajib nih, yang penting aman sejahtera.";
            } else {
                nudge = "Tercatat! Jangan lupa cek-cek budget bulanan ya.";
            }
        }

        const isNotaLevel = ["tadi beli", "dari supermarket", "belanja bulanan", "nota", "struk", "borong"].some(w => normalizedText.includes(w)) || normalizedText.length > 50;
        if (isNotaLevel && Math.random() > 0.5) {
            nudge = "Panjang bener daftarnya! Borong nih ceritanya? 🛒";
        }

        // Clean up title
        let titleParts = rawText.replace(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?\b/g, '')
                                .replace(/\b(gocap|ceban|goceng|cepek|gopek|seceng|ceng|rb|ribu|juta|jt|k|rp)\b/ig, '')
                                .replace(/[.,]/g, '')
                                .trim().split(/\s+/);
        let title = titleParts.filter(part => part.length >= 2).join(' ');
        if (!title || title.length < 2) {
             title = category; 
        }
        title = title.substring(0, 40); // limit length
        title = title.charAt(0).toUpperCase() + title.slice(1);

        return {
            amount: amount,
            category: category,
            text: title,
            nudge: nudge,
        };
    }
}

export async function generateWeeklySummary(expenses: Expense[]): Promise<{ summary: string, topCategories: string[], tip: string }> {
    return callGeminiApi("generateWeeklySummary", { expenses });
}

export async function generateSavingsChallenge(expenses: Expense[]): Promise<{ text: string, targetAmount: number }> {
    return callGeminiApi("generateSavingsChallenge", { expenses });
}

export async function detectRecurringExpense(expenses: Expense[]): Promise<{ detected: boolean, text: string, projection6Months: number } | null> {
    return callGeminiApi("detectRecurringExpense", { expenses });
}

export async function generateMicroLesson(expenses: Expense[]): Promise<{ title: string, content: string, question: string, correctAnswer: string, options: string[] }> {
    return callGeminiApi("generateMicroLesson", { expenses });
}

export async function generateAuraRoast(expenses: Expense[]): Promise<{ aura: string, characterTitle: string, roast: string }> {
    return callGeminiApi("generateAuraRoast", { expenses });
}

export async function generateProyeksi(expenses: Expense[]): Promise<{
    latteFactor: { items: string[]; yearlyCost: number; equivalentText: string; },
    investmentMachine: { currentMonthly: number; projected1Y: number; projected3Y: number; projected5Y: number; encouragement: string; }
}> {
    return callGeminiApi("generateProyeksi", { expenses });
}
