import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense } from '../utils/storage';
import { addSplitBillToFirestore } from '../utils/firebaseUtils';
import { parseExpenseText, parseReceiptImage } from '../services/geminiService';
import { CheckCircle2, RotateCw, X, Mic, Users, Camera } from 'lucide-react';
import { sanitizeInput, isPromptInjection } from '../utils/helpers';

interface InputBarProps {
  onExpenseAdded: (expense: Expense) => void;
  onSetMood: (expenseId: string, mood: string) => void;
}

export default function InputBar({ onExpenseAdded, onSetMood }: InputBarProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nudge, setNudge] = useState('');
  const [lastExpenseId, setLastExpenseId] = useState<string | null>(null);
  
  const [isSplitBill, setIsSplitBill] = useState(false);
  const [isListening, setIsListening] = useState(false);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setIsError(false);
    setErrorMessage('');
    setNudge('');
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<{ base64: string, mime: string }>((resolve, reject) => {
        reader.onload = () => {
           let encoded = reader.result as string;
           const prefix = `data:${file.type};base64,`;
           if (encoded.startsWith(prefix)) {
             encoded = encoded.substring(prefix.length);
           }
           resolve({ base64: encoded, mime: file.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { base64, mime } = await base64Promise;
      const resultText = await parseReceiptImage(base64, mime);
      
      if (typeof resultText === 'string' && !resultText.toLowerCase().includes('gagal')) {
         setInput(resultText);
      } else {
         throw new Error("Gagal baca struk");
      }
    } catch (err: any) {
      console.error(err);
        setIsError(true);
        setErrorMessage("Gagal baca struk, coba foto ulang ya.");
    } finally {
      setIsProcessing(false);
      // reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e?: { preventDefault: () => void }) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const sanitized = sanitizeInput(input);
    
    if (isPromptInjection(sanitized)) {
      setIsError(true);
      setErrorMessage("Input tidak valid. Coba lagi dengan format pengeluaran normal ya!");
      return;
    }

    setIsProcessing(true);
    setIsError(false);
    setErrorMessage('');
    setNudge('');
    setLastExpenseId(null);

    try {
      const promptText = isSplitBill ? `${sanitized} (jangan lupa, ini split bill, perhitungkan biaya buat gue aja, atau nanya mau bagi berapa orang, set splitBill fields)` : sanitized;
      const result = await parseExpenseText(promptText);
      
      if (result.amount < 1 || result.amount > 100000000) {
        throw new Error("AMOUNT_OUT_OF_RANGE");
      }
      
      let splitBillId = undefined;
      
      if (result.splitBill) {
         splitBillId = Math.random().toString(36).substring(2, 9);
         const fractionAmount = Math.round((result.splitBill.totalAmount - result.splitBill.myShare) / Math.max(1, result.splitBill.friendNames.length));
         
         // Pastikan secara eksplisit amount di-override jadi myShare, buat jaga-jaga API gagal meng-override
         result.amount = result.splitBill.myShare;
         
         await addSplitBillToFirestore({
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
      }

      const newExp: Expense = {
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        amount: result.amount,
        text: result.text,
        category: result.category as any,
        splitBillId
      };
      setNudge(result.nudge);
      setLastExpenseId(newExp.id);
      
      setIsProcessing(false);
      setIsSuccess(true);
      setInput('');
      setIsSplitBill(false);
      
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      
      onExpenseAdded(newExp);

    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setIsError(true);
      if (err.message === "AMOUNT_OUT_OF_RANGE") {
        setErrorMessage("Nominalnya nggak masuk akal bro. Pastiin antara Rp1 s/d Rp100.000.000 ya.");
      } else if (err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("AI-nya lagi sibuk, coba lagi sebentar ya 🙏");
      }
    }
  };

  const handleMoodSelect = (mood: string) => {
    if (lastExpenseId) {
      onSetMood(lastExpenseId, mood);
      setIsSuccess(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        {/* Helper toggles */}
        <div className="flex gap-3 mb-2 justify-end">
          <button 
            type="button" 
            onClick={() => setIsSplitBill(!isSplitBill)}
            className={`cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors ${isSplitBill ? 'bg-rk-gold text-white' : 'bg-rk-brown/5 text-rk-brown/50 hover:bg-rk-brown/10'}`}
          >
            <Users className="w-3.5 h-3.5" /> Split Bill?
          </button>
        </div>

        <div className="relative flex items-center shadow-[0_4px_20px_rgba(62,39,35,0.08)] bg-white rounded-2xl border border-rk-brown/5 overflow-hidden">
          <input
            id="expense-input"
            name="expenseInput"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing || isSuccess}
            placeholder={isSplitBill ? "Ketik: 'nasi goreng 60rb bagi 3'" : "Ketik: 'nasi goreng 15rb'"}
            className="w-full bg-transparent pl-5 pr-32 py-4 text-rk-brown placeholder-rk-brown/40 focus:outline-none text-sm md:text-base"
            maxLength={200}
          />
          <input 
            id="receipt-file-input"
            name="receiptFileInput"
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <div className="absolute right-2 flex items-center gap-1">
            {!input && !isProcessing && !isSuccess && (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer p-2 rounded-full transition-all text-rk-brown/40 hover:bg-rk-brown/5"
                title="Scan Struk"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
            
            {recognitionRef.current && !input && !isProcessing && !isSuccess && (
              <button 
                type="button"
                onClick={toggleListen}
                className={`cursor-pointer p-2 rounded-full transition-all ${isListening ? 'bg-rk-gold text-white animate-pulse' : 'text-rk-brown/40 hover:bg-rk-brown/5'}`}
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
               <button type="submit" className="cursor-pointer bg-rk-brown text-rk-cream px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-rk-brown-light active:scale-95 transition-transform mr-1">
                 Catat
               </button>
            )}
          </div>
        </div>
        
        {input.length >= 150 && (
          <div className="absolute right-2 px-2 pb-1 mt-1 text-[10px] text-rk-brown/50">
            {input.length}/200
          </div>
        )}
        
        <AnimatePresence>
          {isSuccess && nudge && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 text-center"
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
                      className="cursor-pointer text-2xl hover:scale-125 transition-transform active:scale-95"
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
              className="mt-3 flex items-center gap-2 text-sm text-rk-red bg-rk-red/5 p-3 rounded-xl border border-rk-red/10"
            >
              <div className="flex-1">
                <span>{errorMessage || "Waduh, gagal nyatet nih. Coba lagi ya."}</span>
              </div>
              <button 
                type="button" 
                onClick={() => handleSubmit()} 
                className="cursor-pointer bg-rk-red/10 px-3 py-1.5 rounded-lg active:bg-rk-red/20 inline-flex items-center text-xs font-semibold hover:bg-rk-red/20 transition-colors"
                disabled={isProcessing}
              >
                <RotateCw className="w-3.5 h-3.5 mr-1.5"/> Ulang
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}