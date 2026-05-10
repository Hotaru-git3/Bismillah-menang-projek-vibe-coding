import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, Bookmark } from 'lucide-react';
import { Expense, UserProfile } from '../utils/storage';
import { generateWeeklySummary } from '../services/geminiService';
import { syncUserProfile } from '../utils/firebaseUtils';
import { useFirebase } from './FirebaseProvider';

interface Props {
  expenses: Expense[];
  profile: UserProfile;
  onShowToast: (msg: string) => void;
}

export default function WeeklySummaryCard({ expenses, profile, onShowToast }: Props) {
  const { refreshProfile } = useFirebase();
  const [summary, setSummary] = React.useState<{ summary: string, topCategories: string[], tip: string, generatedAt?: string; } | null>(profile.latestSummary || null);
  const [loading, setLoading] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  useEffect(() => {
    if (profile.latestSummary && !summary) {
      setSummary(profile.latestSummary);
    }
  }, [profile.latestSummary]);

  const loadSummary = async () => {
    if (expenses.length === 0) return;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentExpenses = expenses.filter(e => new Date(e.date) >= sevenDaysAgo);

    setLoading(true);
    try {
      const res = await generateWeeklySummary(recentExpenses.length > 0 ? recentExpenses : expenses.slice(0, 5));
      const generatedAt = new Date().toISOString();
      const updatedSummary = { ...res, generatedAt };
      
      setSummary(updatedSummary);
      setRetryCount(0);
      
      const newProfile = { ...profile, latestSummary: updatedSummary };
      await syncUserProfile(newProfile);
    } catch(err: any) {
      console.error(err);
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(loadSummary, 1000);
      } else {
        onShowToast("AI lagi sibuk, coba nanti.");
      }
    } finally {
      if (retryCount >= 2) setLoading(false);
      else if (!loading) setLoading(false);
    }
  };

  return (
    <div 
      className="bg-[#FFFDF8] border border-[#E2D5C3] rounded-sm p-5 md:p-6 pl-10 shadow-[2px_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden"
      style={{
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(226, 213, 195, 0.5) 28px)',
        backgroundAttachment: 'local'
      }}
    >
      <div className="absolute top-0 bottom-0 left-6 w-[2px] bg-red-400/30" />
      <div className="absolute top-0 right-0 w-8 h-8 shadow-sm" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)', background: '#ebdcc5' }} />
      <div className="relative z-10 pt-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-rk-brown">
            <Sparkles className="w-5 h-5 text-rk-amber" />
            <h3 className="font-hand text-xl md:text-2xl font-bold tracking-wide">Weekly AI Summary</h3>
          </div>
          {summary && (
            <div className="flex items-center gap-3">
              <button 
                onClick={async () => {
                   const isSaved = profile.savedSummaries?.some(s => s.generatedAt === summary.generatedAt);
                   let newSaved = profile.savedSummaries ? [...profile.savedSummaries] : [];
                   if (isSaved) {
                     newSaved = newSaved.filter(s => s.generatedAt !== summary.generatedAt);
                     onShowToast("Ringkasan dihapus dari arsip.");
                   } else {
                     newSaved.unshift({
                        id: Math.random().toString(36).substring(2, 9),
                        ...summary,
                        generatedAt: summary.generatedAt || new Date().toISOString()
                     });
                     onShowToast("Ringkasan disimpan ke arsip.");
                   }
                   const newProfile = { ...profile, savedSummaries: newSaved };
                   await syncUserProfile(newProfile);
                }}
                className="cursor-pointer text-rk-brown/40 hover:text-rk-brown transition-colors"
                title="Simpan Ringkasan"
              >
                {profile.savedSummaries?.some(s => s.generatedAt === summary.generatedAt) ? (
                   <Bookmark className="w-4 h-4 fill-black text-black" />
                ) : (
                   <Bookmark className="w-4 h-4 text-black hover:fill-black text-opacity-40 hover:text-opacity-100" />
                )}
              </button>
              <button onClick={loadSummary} disabled={loading} className="cursor-pointer text-rk-brown/40 hover:text-rk-brown transition-colors disabled:opacity-50" title="Refresh Summary">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {summary ? (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
            <p className="font-hand text-[17px] text-rk-brown/90" style={{ lineHeight: '28px' }}>
              {summary.summary}
            </p>
            <div className="mt-4 pt-2 border-t border-rk-brown/10 border-dashed">
              <p className="font-semibold text-rk-brown/80 uppercase tracking-widest text-[10px] mb-2" style={{ lineHeight: 'normal' }}>Top Spending:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4 font-hand" style={{ lineHeight: '28px' }}>
                {summary.topCategories.map((c, i) => (
                  <li key={i} className="text-[17px] text-rk-brown/80">{c}</li>
                ))}
              </ul>
            </div>
            <div className="mt-2 font-hand text-[17px] text-rk-brown/90" style={{ lineHeight: '28px' }}>
              <span className="font-bold">Tip:</span> {summary.tip}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-6 mt-4 relative z-10">
            <button 
              onClick={loadSummary} 
              disabled={loading || expenses.length === 0}
              className="cursor-pointer bg-rk-brown text-rk-cream px-5 py-2.5 rounded-sm shadow-md text-base font-medium hover:bg-rk-brown-light transition-all disabled:opacity-50 transform -rotate-1 hover:rotate-0 font-hand"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <motion.span animate={{rotate:360}} transition={{repeat:Infinity, duration:1, ease:'linear'}} className="mr-2 inline-block">
                    <Sparkles className="w-4 h-4"/>
                  </motion.span> Menulis catatan...
                </span>
              ) : expenses.length === 0 ? "Belum ada catatan" : "Tulis Catatan Minggu Ini"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
