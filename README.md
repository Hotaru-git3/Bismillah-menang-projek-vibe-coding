# RupiahKu - AI-Powered Personal Finance Tracker

**RupiahKu** adalah aplikasi pelacak pengeluaran pribadi (*personal finance tracker*) modern berbasis web yang dirancang untuk anak muda. Berbeda dengan aplikasi keuangan tradisional yang membosankan dan kaku, RupiahKu hadir seperti teman tongkrongan yang pintar ngatur duit; ia mencatat, menganalisis, membimbing, dan bahkan me-*roast* kebiasaan finansial buruk kamu. 

Dibangun dengan antarmuka yang bersih (*earth-toned aesthetic*), RupiahKu ditenagai oleh kecerdasan buatan dari Google Gemini dan berjalan di atas infrastruktur real-time Firebase.

---

## 🚀 Fitur Utama & Penjelasan Inti Singkat

### 1. 🔐 Autentikasi Mudah & Aman (Firebase Auth)
**Intinya:** Login gampang pakai akun Google tanpa ribet bikin password baru, data dijamin aman karena terikat sama UID masing-masing.
- Terintegrasi langsung dengan Firebase Authentication.
- Alur *Onboarding* interaktif buat nentuin target *budget* dan *pain points* keuangan kamu.

### 2. 📝 Input Pintar (Natural Language & Receipt Scanner)
**Intinya:** Tinggal ketik "nasi goreng 15rb" atau foto struk jajan, AI yang otomatis mikir ini masuk kategori apa dan berapa nominalnya. Nggak perlu isi form manual panjang lebar!
- **Kategorisasi Otomatis:** Gemini AI membedah teks/struk untuk menentukan nominal dan kategori.
- **Mood Tracking:** Lacak emosi saat transaksi (Senang, Biasa Aja, Nyesel).
- **Split Bill:** Gampang nyatet patungan bareng temen biar hutang nggak kelupaan. Terintegrasi dengan fitur penghapusan parsial yang aman.

### 3. 📊 Dashboard & Peringatan Anggaran (Budget Warning)
**Intinya:** Pantau sisa "napas" dompet kamu bulan ini. Kalau boros, aplikasi bakal langsung ngingetin!
- Menampilkan sisa *budget* dan pengeluaran hobi/kebutuhan/investasi.
- Visualisasi sisa hari (*runway*) dibandingkan dengan sisa uang.

### 4. 🤖 AI Insights & Analisis Cerdas
**Intinya:** Punya asisten keuangan pribadi yang rajin ngasih laporan, nebak masa depan, dan ngomelin kalau kamu boros.
- **Ringkasan Mingguan:** AI merangkum pola pengeluaran mingguanmu & ngasih tips praktis.
- **The Latte Factor & Proyeksi:** AI mendeteksi pengeluaran bocor halus (kayak sering ngopi) dan ngasih tahu hilangnya potensi uang kamu kalau nggak diirit.
- **Fitur AI Roast:** Di-*roast* langsung sama AI gara-gara kebiasaan beli barang ga penting.

### 5. 💰 Edukasi Finansial (Micro-Lessons) & Tantangan Nabung
**Intinya:** Dibantu pinter ngatur duit lewat bacaan singkat dan kuis, serta didorong buat nabung tiap minggu.
- **Tantangan Mingguan:** AI ngasih target nabung mingguan berdasarkan sisa uangmu.
- **Micro-Lessons:** Belajar literasi finansial cuma butuh 1 menit lewat kuis interaktif berhadiah profil *badge*.

### 6. 📈 Visualisasi Emosi & Pengeluaran (Double Pie Chart)
**Intinya:** Liat grafik keranjang mana yang paling sering bikin kamu "Nyesel" atau "Seneng". Kesadaran emosional dalam mengeluarkan uang.
- Chart interaktif 2 lapis buat melihat relasi antara Pengeluaran dan *Mood*, membantu ngerem *emotional spending*.

### 7. 🛡️ Keamanan & Privasi (Security & Privacy)
**Intinya:** Data milik lo, dan aman dari celah serangan siber.
- **Anti Prompt Injection:** AI punya *guardrail* supaya input teks nggak bisa di-*hack* lewat instruksi gelap.
- **Input Sanitization:** Membersihkan input pengguna dari elemen HTML/scripting (*Anti-XSS*).
- **Rate Limiting:** Proteksi pemanggilan Gemini API biar nggak kelebihan batas.
- **Firestore Security Rules & Backend Validation:** Data keuangan tak akan pernah bocor antar pengguna dan selalu mencocokkan kepemilikan data sebelum dibaca/ditulis.
- **Data Export:** Bebas di-download jadi `.csv` kapan aja.

---

## 🛠️ Stack Teknologi

- **Frontend:** React 18+, TypeScript, Vite, Tailwind CSS, Material UI X-Charts, Framer Motion
- **Backend & Database:** Firebase Authentication & Cloud Firestore (Enterprise-grade security)
- **AI Services:** Google GenAI SDK (Gemini 1.5 Flash untuk asisten parsing data).
- **Arsitektur:** Serverless Firestore, Mobile-first Design Paradigm, Secure Context.

## 🗃️ Pengelolaan Data
Semua data dienkripsi dan diamankan menggunakan **Firestore Security Rules** yang ketat dengan pendekatan *Zero-Trust*. Setiap *read/write/delete* hanya diperbolehkan jika UID pengguna sama dengan UID yang ada di data.

## 🎨 Desain UI/UX
Mengutamakan warna *Earthy/Coffee Tones* dipadu interaksi mikro (banyak transisi `framer-motion` dan elemen *hover* interaktif) membuat RupiahKu terasa elegan layaknya aplikasi *finance premium* namun hangat menyapa pengguna.
