import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { addExpense, Expense, getSplitBills, saveSplitBills } from '../utils/storage';
import { parseExpenseText } from '../services/geminiService';
import { CheckCircle2, RotateCw, X, Mic, Users } from 'lucide-react';
import { sanitizeInput } from '../utils/helpers';

interface InputBarProps {
  onExpenseAdded: (expense: Expense) => void;
  onSetMood: (expenseId: string, mood: string) => void;
}

export default function InputBar({ onExpenseAdded, onSetMood }: InputBarProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [nudge, setNudge] = useState('');
  const [lastExpenseId, setLastExpenseId] = useState<string | null>(null);
  
  // Features toggles
  const [isSplitBill, setIsSplitBill] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Web Speech API
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'id-ID';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (e?: { preventDefault: () => void }) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    if (isSplitBill && !input.toLowerCase().includes('bagi')) {
       // if split bill turned on but no info on how many people, let's append default prompt
    }

    const sanitized = sanitizeInput(input);
    setIsProcessing(true);
    setIsError(false);
    setNudge('');
    setLastExpenseId(null);

    try {
      const promptText = isSplitBill ? `${sanitized} (jangan lupa, ini split bill, perhitungkan biaya buat gue aja, atau nanya mau bagi berapa orang, set splitBill fields)` : sanitized;
      const result = await parseExpenseText(promptText);
      
      let splitBillId = undefined;
      
      if (result.splitBill) {
         const bills = getSplitBills();
         splitBillId = Math.random().toString(36).substring(2, 9);
         
         const fractionAmount = Math.round((result.splitBill.totalAmount - result.splitBill.myShare) / Math.max(1, result.splitBill.friendNames.length));
         
         bills.unshift({
           id: splitBillId,
           text: result.text,
           date: new Date().toISOString(),
           originalAmount: result.splitBill.totalAmount,
           friends: result.splitBill.friendNames.map(name => ({
             name,
             amount: fractionAmount,
             paid: false
           }))
         });
         saveSplitBills(bills);
      }

      const newExp = addExpense({
        amount: result.amount,
        text: result.text,
        category: result.category,
        splitBillId
      });
      setNudge(result.nudge);
      setLastExpenseId(newExp.id);
      
      setIsProcessing(false);
      setIsSuccess(true);
      setInput('');
      setIsSplitBill(false);
      
      // Haptic feedback
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      
      onExpenseAdded(newExp);

      // We explicitly DO NOT auto-hide success immediately so user can select mood
      // They can dismiss it themselves or it will be replaced by new input

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setIsError(true);
    }
  };

  const handleMoodSelect = (mood: string) => {
    if (lastExpenseId) {
      onSetMood(lastExpenseId, mood);
      setIsSuccess(false);
    }
  };

  return (
    <div className="px-4 pb-6 pt-2 w-full mt-auto">
      <form onSubmit={handleSubmit} className="relative w-full">
        {/* Helper toggles */}
        <div className="flex gap-3 mb-2 justify-end px-1">
          <button 
            type="button" 
            onClick={() => setIsSplitBill(!isSplitBill)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full transition-colors ${isSplitBill ? 'bg-rk-gold text-white' : 'bg-rk-brown/5 text-rk-brown/50 hover:bg-rk-brown/10'}`}
          >
            <Users className="w-3.5 h-3.5" /> Split Bill?
          </button>
        </div>

        <div className="relative flex items-center shadow-[0_4px_20px_rgba(62,39,35,0.08)] bg-white rounded-2xl border border-rk-brown/5 overflow-hidden">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing || isSuccess}
            placeholder={isSplitBill ? "Ketik: 'nasi goreng 60rb bagi 3'" : "Ketik: 'nasi goreng 15rb'"}
            className="w-full bg-transparent pl-5 pr-20 py-4 text-rk-brown placeholder-rk-brown/40 focus:outline-none"
            maxLength={500}
          />
          <div className="absolute right-2 flex items-center gap-1">
            {recognitionRef.current && !input && !isProcessing && !isSuccess && (
              <button 
                type="button"
                onClick={toggleListen}
                className={`p-2 rounded-full transition-all ${isListening ? 'bg-rk-gold text-white animate-pulse' : 'text-rk-brown/40 hover:bg-rk-brown/5'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}

            <AnimatePresence mode="wait">
              {isProcessing && (
                <motion.div 
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-3 h-3 bg-rk-gold rounded-full animate-pulse mr-2"
                />
              )}
              {isSuccess && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.4 }}
                >
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-2" />
                </motion.div>
              )}
              {isError && (
                <motion.div 
                   key="error"
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.5 }}
                >
                  <X className="w-5 h-5 text-rk-red mr-2" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {(!isProcessing && !isSuccess && input) && (
               <button type="submit" className="bg-rk-brown text-rk-cream px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rk-brown-light active:scale-95 transition-transform mr-1">
                 Catat
               </button>
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {isSuccess && nudge && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 text-center"
            >
              <p className="text-sm italic font-serif text-rk-brown bg-rk-gold/10 inline-block px-4 py-2 rounded-full border border-rk-gold/20 mb-3 text-center shadow-sm">
                "{nudge}"
              </p>
              
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-rk-brown/60 font-medium">Gimana perasaan lo soal pengeluaran ini?</p>
                <div className="flex gap-3 justify-center">
                  {['😊', '🤔', '😐', '😟', '😤'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={(e) => { e.preventDefault(); handleMoodSelect(emoji); }}
                      className="text-2xl hover:scale-125 transition-transform active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {isError && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 flex items-center gap-2 text-sm text-rk-red px-2"
            >
              <span>Waduh, gagal nyatet nih. Coba lagi ya bro.</span>
              <button 
                type="button" 
                onClick={() => handleSubmit()} 
                className="bg-rk-red/10 px-2 py-1 rounded-md active:bg-rk-red/20 inline-flex items-center"
              >
                <RotateCw className="w-3 h-3 mr-1"/> Ulang
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
