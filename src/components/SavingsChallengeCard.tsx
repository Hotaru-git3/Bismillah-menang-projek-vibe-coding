import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, getSavingsChallenge, saveSavingsChallenge, SavingsChallenge } from '../utils/storage';
import { generateSavingsChallenge } from '../services/geminiService';
import { Target, Sparkles, Trophy } from 'lucide-react';
import { formatRupiah } from '../utils/helpers';

export default function SavingsChallengeCard({ expenses }: { expenses: Expense[] }) {
  const [challenge, setChallenge] = useState<SavingsChallenge | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Basic load
    const ch = getSavingsChallenge();
    // In a real app we'd check if `dateAssigned` is within this week.
    // Let's assume it doesn't expire until completed or re-generated.
    if (ch) {
      setChallenge(ch);
    }
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateSavingsChallenge(expenses);
      const newCh: SavingsChallenge = {
        id: Math.random().toString(36).substring(2,9),
        text: res.text,
        dateAssigned: new Date().toISOString(),
        completed: false,
        targetAmount: res.targetAmount,
        progressAmount: 0 // Mock progress
      };
      saveSavingsChallenge(newCh);
      setChallenge(newCh);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const markCompleted = () => {
    if (challenge) {
      const updated = { ...challenge, completed: true, progressAmount: challenge.targetAmount };
      saveSavingsChallenge(updated);
      setChallenge(updated);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  return (
    <div className="mx-4 mb-6 bg-white rounded-3xl shadow-[0_4px_24px_rgba(62,39,35,0.04)] p-5 relative overflow-hidden border border-rk-brown/5">
      <div className="flex items-center gap-2 mb-3">
         <Target className="w-5 h-5 text-rk-gold" />
         <h3 className="font-semibold text-rk-brown text-sm uppercase tracking-wide">Tantangan Hemat Minggu Ini</h3>
      </div>

      {isGenerating ? (
         <div className="flex items-center gap-2 text-sm text-rk-brown/60 animate-pulse py-2">
           <Sparkles className="w-4 h-4"/> Ngeracik tantangan buat lo...
         </div>
      ) : challenge ? (
        challenge.completed ? (
           <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-rk-gold/10 p-4 rounded-2xl border border-rk-gold/20 flex gap-3 relative overflow-hidden">
             {showConfetti && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <motion.div animate={{scale:[0,2], opacity:[1,0]}} transition={{duration:1}} className="w-40 h-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTUgMEw2LjUgMy41TDEwIDVMNi41IDYuNUw1IDEwTDMuNSA2LjVMMCA1TDMuNSAzLjVaIiBmaWxsPSIjRDhCMzQyIi8+PC9zdmc+')] bg-repeat opacity-50" />
                </div>
             )}
             <Trophy className="w-6 h-6 text-rk-gold-dark shrink-0 mt-0.5" />
             <div>
               <p className="text-sm font-medium text-rk-brown leading-snug">
                 Lo berhasil, bro. {formatRupiah(challenge.targetAmount)} itu cukup buat investasi emas minggu depan!
               </p>
             </div>
           </motion.div>
        ) : (
           <div className="space-y-4">
              <p className="text-sm text-rk-brown/90 leading-relaxed font-serif italic">
                "{challenge.text}"
              </p>
              
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] uppercase font-semibold text-rk-brown/50">
                    <span>Progres ({formatRupiah(challenge.progressAmount)})</span>
                    <span>Target ({formatRupiah(challenge.targetAmount)})</span>
                 </div>
                 <div className="w-full bg-rk-cream-dark h-2 rounded-full overflow-hidden">
                    <div className="bg-rk-gold h-full" style={{ width: '10%' }} /> {/* Mock progress */}
                 </div>
              </div>
              
              <button 
                onClick={markCompleted}
                className="w-full py-2 bg-rk-brown/5 hover:bg-rk-brown/10 active:scale-95 transition-all text-rk-brown text-xs font-semibold rounded-xl"
              >
                Tandain Selesai
              </button>
           </div>
        )
      ) : (
         <div>
           <p className="text-sm text-rk-brown/60 mb-3">Tantang diri lo buat nyisihin uang minggu ini.</p>
           <button 
              onClick={handleGenerate}
              className="bg-rk-gold text-white font-medium px-4 py-2 rounded-xl text-sm hover:bg-rk-gold-dark active:scale-95 transition-all w-full"
           >
              Minta Tantangan
           </button>
         </div>
      )}
    </div>
  );
}
