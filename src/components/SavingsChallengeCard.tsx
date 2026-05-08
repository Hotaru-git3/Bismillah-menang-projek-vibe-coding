import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, SavingsChallenge } from '../utils/storage';
import { generateSavingsChallenge } from '../services/geminiService';
import { Target, Sparkles, Trophy } from 'lucide-react';
import { formatRupiah } from '../utils/helpers';
import { useFirebase } from './FirebaseProvider';
import { addChallengeToFirestore, updateChallengeInFirestore } from '../utils/firebaseUtils';

export default function SavingsChallengeCard({ expenses }: { expenses: Expense[] }) {
  const { savingsChallenges } = useFirebase();
  const challenge = savingsChallenges && savingsChallenges.length > 0 ? savingsChallenges[0] : null;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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
        progressAmount: 0
      };
      await addChallengeToFirestore(newCh);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const markCompleted = async () => {
    if (challenge) {
      const updated = { ...challenge, completed: true, progressAmount: challenge.targetAmount };
      await updateChallengeInFirestore(challenge.id, updated);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(62,39,35,0.04)] p-5 md:p-6 lg:p-7 relative overflow-hidden border border-rk-brown/5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
         <Target className="w-5 h-5 text-rk-gold shrink-0" />
         <h3 className="font-semibold text-rk-brown text-sm uppercase tracking-wide">Tantangan Hemat Minggu Ini</h3>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {isGenerating ? (
           <div className="flex items-center gap-2 text-sm text-rk-brown/60 animate-pulse py-4">
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
                   Lo berhasil! {formatRupiah(challenge.targetAmount)} itu lumayan banget buat tabungan!
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
                      <div className="bg-rk-gold h-full rounded-full" style={{ width: '10%' }} />
                   </div>
                </div>
                
                <button 
                  onClick={markCompleted}
                  className="cursor-pointer w-full py-2.5 bg-rk-brown/5 hover:bg-rk-brown/10 active:scale-95 transition-all text-rk-brown text-xs font-semibold rounded-xl"
                >
                  Tandain Selesai
                </button>
             </div>
          )
        ) : (
           <div className="py-2">
             <p className="text-sm text-rk-brown/60 mb-4">Tantang diri lo buat nyisihin uang minggu ini.</p>
             <button 
                onClick={handleGenerate}
                className="cursor-pointer bg-rk-gold text-white font-medium px-4 py-2.5 rounded-xl text-sm hover:bg-rk-gold-dark active:scale-95 transition-all w-full"
             >
                Minta Tantangan
             </button>
           </div>
        )}
      </div>
    </div>
  );
}