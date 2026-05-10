import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, TrendingUp, RefreshCw, Bookmark } from 'lucide-react';
import { Expense, UserProfile } from '../utils/storage';
import { detectRecurringExpense } from '../services/geminiService';
import { syncUserProfile } from '../utils/firebaseUtils';
import { useFirebase } from './FirebaseProvider';

interface Props {
  expenses: Expense[];
  profile: UserProfile;
  onShowToast: (msg: string) => void;
}

export default function RecurringCard({ expenses, profile, onShowToast }: Props) {
  const { refreshProfile } = useFirebase();
  const [recurring, setRecurring] = React.useState<{ detected: boolean, text: string, projection6Months: number, generatedAt?: string; } | null>(profile.latestRecurring || null);
  const [loading, setLoading] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  useEffect(() => {
    if (profile.latestRecurring && !recurring) {
      setRecurring(profile.latestRecurring);
    }
  }, [profile.latestRecurring]);

  const loadRecurring = async () => {
    if (expenses.length === 0) return;
    setLoading(true);
    try {
      const res = await detectRecurringExpense(expenses);
      const generatedAt = new Date().toISOString();
      const updatedRecurring = { ...res, generatedAt };
      
      setRecurring(updatedRecurring);
      setRetryCount(0);
      
      const newProfile = { ...profile, latestRecurring: updatedRecurring };
      await syncUserProfile(newProfile);
    } catch(err: any) {
      console.error(err);
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(loadRecurring, 1000);
      } else {
        onShowToast("AI lagi sibuk, coba nanti.");
      }
    } finally {
      if (retryCount >= 2) setLoading(false);
      else if (!loading) setLoading(false); // Only unset if not scheduling retry
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-rk-brown/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <Clock className="w-5 h-5 text-rk-brown/60" />
           <h3 className="font-medium text-rk-brown text-sm">Pola Berulang</h3>
        </div>
        {!recurring && !loading && expenses.length > 0 ? (
           <button onClick={loadRecurring} className="cursor-pointer text-xs text-rk-brown underline">Cek Pola</button>
        ) : (
          recurring && expenses.length > 0 && (
             <div className="flex items-center gap-3">
               <button 
                 onClick={async () => {
                   const isSaved = profile.savedRecurring?.some(s => s.generatedAt === recurring.generatedAt);
                   let newSaved = profile.savedRecurring ? [...profile.savedRecurring] : [];
                   if (isSaved) {
                     newSaved = newSaved.filter(s => s.generatedAt !== recurring.generatedAt);
                     onShowToast("Pola berulang dihapus dari arsip.");
                   } else {
                     newSaved.unshift({
                        id: Math.random().toString(36).substring(2, 9),
                        ...recurring,
                        generatedAt: recurring.generatedAt || new Date().toISOString()
                     });
                     onShowToast("Pola berulang disimpan ke arsip.");
                   }
                   const newProfile = { ...profile, savedRecurring: newSaved };
                   await syncUserProfile(newProfile);
                 }}
                 className="cursor-pointer text-rk-brown/40 hover:text-rk-brown transition-colors"
                 title="Simpan Pola"
               >
                 {profile.savedRecurring?.some(s => s.generatedAt === recurring.generatedAt) ? (
                    <Bookmark className="w-4 h-4 fill-black text-black" />
                 ) : (
                    <Bookmark className="w-4 h-4 text-black hover:fill-black text-opacity-40 hover:text-opacity-100" />
                 )}
               </button>
               <button onClick={loadRecurring} disabled={loading} className="cursor-pointer text-rk-brown/40 hover:text-rk-brown transition-colors disabled:opacity-50" title="Refresh">
                 <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
               </button>
             </div>
          )
        )}
      </div>
      {loading && !recurring ? (
        <p className="text-sm text-rk-brown/50 animate-pulse">Lagi nyari pola...</p>
      ) : recurring ? (
        recurring.detected ? (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">
            <p className="text-sm text-rk-brown leading-relaxed">"{recurring.text}"</p>
            <div className="bg-rk-brown/5 rounded-xl p-3 border border-rk-brown/10">
              <p className="text-[10px] uppercase tracking-widest text-rk-brown/60 mb-1 font-semibold">Proyeksi 6 Bulan</p>
              <p className="font-serif text-xl text-rk-brown">Rp {recurring.projection6Months.toLocaleString('id-ID')}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-rk-gold-dark font-medium">
                <TrendingUp className="w-3 h-3" /> Setara ~{(recurring.projection6Months / 1400000).toFixed(2)} gram Emas!
              </div>
            </div>
          </motion.div>
        ) : (
          <p className="text-sm text-rk-brown/60">Belum nemu pola pengeluaran yang jelas nih.</p>
        )
      ) : (
        <p className="text-xs text-rk-brown/40">Analisis pengeluaran yang sering diulang.</p>
      )}
    </div>
  );
}
