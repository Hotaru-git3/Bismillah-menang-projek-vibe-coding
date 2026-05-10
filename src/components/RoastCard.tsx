import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, Bookmark } from 'lucide-react';
import { Expense, UserProfile } from '../utils/storage';
import { generateAuraRoast } from '../services/geminiService';
import { syncUserProfile } from '../utils/firebaseUtils';

interface Props {
  expenses: Expense[];
  profile: UserProfile;
  onShowToast: (msg: string) => void;
}

export default function RoastCard({ expenses, profile, onShowToast }: Props) {
  const [roastData, setRoastData] = React.useState<{ aura: string, characterTitle: string, roast: string, generatedAt: string } | null>(profile?.latestRoast || null);
  const [loading, setLoading] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  useEffect(() => {
    if (profile?.latestRoast && !roastData) {
      setRoastData(profile.latestRoast);
    }
  }, [profile?.latestRoast]);

  const loadRoast = async () => {
    if (expenses.length === 0) return;
    setLoading(true);
    try {
        const res = await generateAuraRoast(expenses);
        const generatedAt = new Date().toISOString();
        const updatedRoast = { ...res, generatedAt };
        
        setRoastData(updatedRoast);
        setRetryCount(0);
        
        const newProfile = { ...profile, latestRoast: updatedRoast };
        await syncUserProfile(newProfile);
    } catch (e: any) {
        console.error(e);
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setTimeout(loadRoast, 1000);
        } else {
          onShowToast("AI lagi sibuk, coba nanti.");
        }
    } finally {
        if (retryCount >= 2) setLoading(false);
        else if (!loading) setLoading(false);
    }
  };

  if (!roastData) {
    return (
      <div className="text-center py-10 md:py-16 bg-white border border-gray-100 rounded-3xl shadow-sm">
        <Flame className="w-16 h-16 text-red-400 mx-auto mb-4 animate-bounce" />
        <h3 className="font-serif text-2xl text-gray-900 mb-2">Cek Aura Dompet Lo</h3>
        <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">AI kita bakal nganalisis pengeluaran lo dan kasih tau gelar dan warna aura dompet lo saat ini. Siap diroast?</p>
        <button 
          onClick={loadRoast}
          disabled={loading || expenses.length === 0}
          className="cursor-pointer bg-black text-white px-8 py-3 rounded-full font-medium shadow-[0_4px_14px_0_rgb(0,0,0,0.39)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:bg-[rgba(0,0,0,0.9)] transition-all disabled:opacity-50"
        >
           {loading ? (
             <span className="flex items-center justify-center gap-2"><Flame className="w-4 h-4 animate-pulse" /> Scanning Aura...</span>
           ) : (
             "🔥 Roast Akun Gue"
           )}
        </button>
      </div>
    );
  }

  const auraStr = (roastData.aura || '').toLowerCase();
  
  return (
    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-[#111] text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Background decorative aura */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] blur-[100px] rounded-full mix-blend-screen opacity-50" 
        style={{ backgroundColor: auraStr.includes('merah') ? '#ef4444' : auraStr.includes('ijo') ? '#22c55e' : auraStr.includes('biru') ? '#3b82f6' : '#a855f7' }}
      />
      <div className="relative z-10 flex flex-col items-center text-center">
         <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2 mt-4">Aura Dompet Lo</p>
         <h2 className="text-4xl md:text-5xl font-black italic mb-8 drop-shadow-lg"
            style={{ color: auraStr.includes('merah') ? '#fca5a5' : auraStr.includes('ijo') ? '#bbf7d0' : auraStr.includes('biru') ? '#bfdbfe' : '#e9d5ff' }}
         >
           "{roastData.aura}"
         </h2>
         
         <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-6">
            <p className="text-sm font-semibold tracking-wide">🏆 {roastData.characterTitle}</p>
         </div>
         
         <p className="text-lg md:text-xl font-medium leading-relaxed max-w-md mb-10 text-white/90">
           "{roastData.roast}"
         </p>
         
         <div className="flex items-center gap-6 mt-4">
            <button onClick={loadRoast} className="cursor-pointer text-white/40 hover:text-white text-xs underline transition-colors">
              Roast Ulang (Kalo Berani)
            </button>
            <button 
               onClick={async () => {
                     const isSaved = profile.savedRoasts?.some(s => s.generatedAt === roastData.generatedAt);
                     let newSaved = profile.savedRoasts ? [...profile.savedRoasts] : [];
                     if (isSaved) {
                       newSaved = newSaved.filter(s => s.generatedAt !== roastData.generatedAt);
                       onShowToast("Roast dihapus dari arsip.");
                     } else {
                       newSaved.unshift({
                          id: Math.random().toString(36).substring(2, 9),
                          ...roastData,
                          generatedAt: roastData.generatedAt || new Date().toISOString()
                       });
                       onShowToast("Roast disimpan ke arsip.");
                     }
                     const newProfile = { ...profile, savedRoasts: newSaved };
                     await syncUserProfile(newProfile);
               }}
               className="cursor-pointer text-white/40 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
               title="Simpan Roast"
             >
               {profile.savedRoasts?.some(s => s.generatedAt === roastData.generatedAt) ? (
                  <><Bookmark className="w-3.5 h-3.5 fill-white text-white" /> Tersimpan</>
               ) : (
                  <><Bookmark className="w-3.5 h-3.5" /> Simpan ke Arsip</>
               )}
             </button>
         </div>
      </div>
    </motion.div>
  );
}
