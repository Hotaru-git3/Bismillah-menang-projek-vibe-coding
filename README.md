# 🪙 RupiahKu — Your Friendly Financial Co-Pilot

> *"Dari 'duit gue abis ke mana?' jadi 'gue pegang kendali penuh' dalam 60 detik."*

Aplikasi web pelacak keuangan harian untuk mahasiswa Indonesia yang ingin sadar finansial tanpa ribet. Dibangun dengan **vibe coding** menggunakan Google AI Studio dan Gemini API.

---

## 🎯 Problem Statement

7+ juta mahasiswa Indonesia punya paradoks: 55% sudah jadi investor ritel aktif (OJK 2024), tapi 56% punya literasi keuangan terendah secara nasional. Mereka investasi emas digital dan reksadana, tapi gak tau ke mana Rp100.000 mereka hilang setiap hari. **RupiahKu hadir buat nutup blind spot ini.**

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|------------|
| 🧠 **AI Expense Logging** | Input pakai bahasa natural/slang Indonesia: `"nasi goreng 15rb"`, `"top-up emas 50k"` — Gemini auto-kategorisasi ke Kebutuhan/Investasi/Keinginan + kasih nudge kontekstual. |
| ⚠️ **Smart Budget Warning** | Pantau burn rate harian. Dapatkan peringatan inline halus saat spending udah 80% budget mingguan. |
| 🛬 **Money Runway Dashboard** | Lihat sekilas: total pengeluaran, burn rate, runway (hari tersisa), & donut chart. |
| 📝 **AI Weekly Summary** | Ringkasan mingguan dalam Bahasa Indonesia santai, lengkap dengan top 3 kategori & tips actionable. |
| 💰 **Simulasi Hemat** | Tantangan mingguan yang dipersonalisasi Gemini + progress bar. Berhasil? Ada confetti gold! |
| 👥 **Split Bill Mode** | Catat patungan makan/travel, simpen data temen yang masih ngutang, dan copy teks tagihan siap kirim ke WhatsApp. |
| 🔮 **Proyeksi "Latte Factor"** | Lihat pengeluaran receh lo dalam setahun ke depan & konversinya ke gram emas digital. |
| ⏳ **Mesin Waktu Investasi** | Timeline 5 tahun proyeksi nilai investasi lo dengan asumsi kenaikan 10%/tahun. |
| 🎙️ **Voice to Expense** | Input pengeluaran tinggal ngomong pake Web Speech API. |
| 🔒 **Privacy First** | Semua data disimpan di localStorage. Tidak ada data mentah yang dikirim ke server eksternal selain proxy kategorisasi LLM. |

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **AI:** Gemini API (gemini-2.0-flash)
- **Build Tool:** Vite
- **Deployment:** Google Cloud Run via AI Studio
- **Fonts:** Playfair Display (headings) + Inter (body)
- **Design System:** Skeuomorphic-minimalist, leather-ledger vibe, warm earth tones

---

## 🚀 Quick Start

### 1. Clone repository
```bash
git clone https://github.com/[username]/[repo-name].git
cd [repo-name]
2. Install dependencies
bash
npm install
3. Setup environment variables
bash
cp .env.example .env
Isi GEMINI_API_KEY di file .env dengan API key Gemini lo.

4. Jalankan development server
bash
npm run dev
5. Buka di browser
Buka http://localhost:5173 dan mulai catat pengeluaran lo!

📦 Build & Deploy
bash
npm run build
Hasil build ada di folder dist/. Deploy ke Google Cloud Run via AI Studio dengan klik "Publish".

🏆 Submission Info
Aplikasi ini dibuat untuk #JuaraVibeCoding — program Google untuk developer Indonesia membangun solusi dengan AI.

Live URL: soon
Video Demo: soon

📄 License
MIT © Zidane Solahudin
