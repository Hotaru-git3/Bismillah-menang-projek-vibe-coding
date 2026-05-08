import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Wallet, AlertCircle } from 'lucide-react';
import { UserProfile } from '../utils/storage';
import { sanitizeInput } from '../utils/helpers';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('1500000');
  const [concern, setConcern] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setError('Kenalan dulu, nama lo siapa?');
        return;
      }
      if (name.length > 50) {
         setError('Nama kepanjangan, max 50 karakter.'); return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      const budgetNum = parseInt(budget);
      if (isNaN(budgetNum) || budgetNum <= 0) {
        setError('Budget harus angka yang lebih dari 0.');
        return;
      }
      if (budgetNum > 100000000) {
         setError('Wow sultan, tapi limit kita Rp100.000.000 max.');
         return;
      }
      setError('');
      setStep(3);
    } else if (step === 3) {
      if (concern.length > 200) {
        setError('Teks kepanjangan, max 200 karakter.');
        return;
      }
      const profile: UserProfile = {
        name: sanitizeInput(name),
        monthlyBudget: parseInt(budget),
        concern: sanitizeInput(concern) || 'Pengeluaran harian',
      };
      onComplete(profile);
    }
  };

  const currentTitle = 
    step === 1 ? "Kenalan dulu, nama lo siapa?" : 
    step === 2 ? "Berapa budget bulanan lo?" : 
    "Apa kekhawatiran terbesar lo soal duit?";

  return (
    <div className="min-h-screen bg-rk-cream sm:bg-[#DED5C9] sm:py-8 flex justify-center items-center p-4">
      <div className="flex flex-col min-h-[100dvh] sm:min-h-[550px] sm:h-auto w-full max-w-[440px] bg-rk-cream sm:rounded-[2.5rem] sm:shadow-2xl overflow-hidden ring-1 ring-rk-brown/5 relative p-6 justify-center">
      <div className="w-full relative pt-12 pb-12 sm:pb-20">
        
        {/* Tasbih progress indicator */}
        <div className="flex gap-2 justify-center mb-12">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${step >= i ? 'bg-rk-gold' : 'bg-rk-cream-dark border border-rk-brown-light/20'}`}
            />
          ))}
        </div>

        <h2 className="text-3xl font-serif text-rk-brown mb-8 text-center flex flex-col items-center gap-4">
          {step === 1 && <User className="w-12 h-12 text-rk-gold" />}
          {step === 2 && <Wallet className="w-12 h-12 text-rk-gold" />}
          {step === 3 && <AlertCircle className="w-12 h-12 text-rk-gold" />}
          {currentTitle}
        </h2>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col gap-4"
          >
            {step === 1 && (
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                placeholder="Panggil gue..."
                className="w-full text-center text-xl bg-transparent border-b border-rk-brown/30 pb-2 focus:outline-none focus:border-rk-gold text-rk-brown placeholder-rk-brown/40"
                autoFocus
                maxLength={50}
              />
            )}
            
            {step === 2 && (
              <div className="relative flex items-center justify-center">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rk-brown/60 text-xl font-serif">Rp</span>
                <input 
                  type="number" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  placeholder="1500000"
                  className="w-full text-center text-2xl font-serif bg-transparent border-b border-rk-brown/30 pb-2 pl-12 focus:outline-none focus:border-rk-gold text-rk-brown placeholder-rk-brown/40 appearance-none"
                  autoFocus
                />
              </div>
            )}

            {step === 3 && (
              <textarea 
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                placeholder="Suka bocor buat jajan / Ongkos kegedean / Gak bisa nabung"
                className="w-full bg-rk-cream-dark/50 rounded-xl p-4 text-center focus:outline-none focus:ring-1 focus:ring-rk-gold border border-rk-brown/10 text-rk-brown placeholder-rk-brown/40 resize-none h-28"
                autoFocus
                maxLength={200}
              />
            )}

            {error && <p className="text-rk-red text-sm text-center tracking-wide">{error}</p>}
            
            <button 
              onClick={handleNext}
              className="mt-6 w-full bg-rk-brown text-rk-cream font-medium py-3 rounded-xl shadow-md cursor-pointer hover:bg-rk-brown-light active:scale-97 transition-all duration-200"
            >
              {step === 3 ? "Mulai Sekarang" : "Lanjut"}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
