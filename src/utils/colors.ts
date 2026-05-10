export const DYNAMIC_PALETTE = [
  "#E8B86D", // rk-amber
  "#60a5fa", // blue-400
  "#c084fc", // purple-400
  "#f472b6", // pink-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#a78bfa", // violet-400
  "#6ee7b7", // emerald-300
  "#fb923c", // orange-400
  "#38bdf8", // sky-400
  "#f87171", // red-400
  "#a3e635", // lime-400
  "#D4AF37", // rk-gold-dark
  "#8B3A3A", // rk-red
  "#3E2723", // rk-brown
];

export const categoryColors: Record<string, string> = {
  "Makanan & Minuman": "#E8B86D", // rk-amber
  "Transportasi": "#38bdf8", // sky-400
  "Belanja & Fashion": "#c084fc", // purple-400
  "Hiburan": "#f472b6", // pink-400 // same as before
  "Olahraga & Kebugaran": "#34d399", // emerald-400
  "Kesehatan & Kebutuhan Pokok": "#3E2723", // rk-brown
  "Keuangan & Investasi": "#D4AF37", // rk-gold-dark
  "Pendidikan": "#a78bfa", // violet-400
  "Pulsa, Tagihan & Topup Digital": "#f87171", // red-400
  "Lainnya": "#9ca3af", // gray
  // Provide fallbacks just in case
  "Makanan": "#E8B86D",
  "Transport": "#38bdf8",
  "Belanja": "#c084fc",
  "Kebutuhan": "#3E2723",
  "Investasi": "#D4AF37",
  "Keinginan": "#8B3A3A"
};

export const getCategoryColor = (label: string) => {
  if (categoryColors[label]) return categoryColors[label];
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DYNAMIC_PALETTE[Math.abs(hash) % DYNAMIC_PALETTE.length];
};

export const moodColors: Record<string, string> = {
  "Seneng": "#FDE047", 
  "Biasa Aja": "#D1D5DB", 
  "Nyesel": "#FCA5A5", 
  "Berbunga": "#F9A8D4", 
  "Kacau": "#9CA3AF"
};

export const getMoodColor = (label: string) => {
  if (moodColors[label]) return moodColors[label];
  return "#9ca3af";
};

export const LEGACY_MOOD_MAP: Record<string, string> = {
  "😊": "Seneng",
  "🤔": "Biasa Aja",
  "😐": "Biasa Aja",
  "😟": "Nyesel",
  "😤": "Kacau"
};
