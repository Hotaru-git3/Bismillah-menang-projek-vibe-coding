import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, Wallet, Sparkles } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

export default function AuthForm() {
  const { signInWithEmail, signUpWithEmail, signIn, signInAsGuest } = useFirebase();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') setAuthError('Email atau password salah');
      else if (err.code === 'auth/email-already-in-use') setAuthError('Email sudah terdaftar');
      else if (err.code === 'auth/weak-password') setAuthError('Password minimal 6 karakter');
      else setAuthError(err.message || 'Gagal masuk');
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="relative w-full max-w-[420px]"
    >
      {/* Decorative floating elements */}
      <motion.div 
        animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute -top-10 -left-10 w-24 h-24 bg-rk-gold/20 rounded-full blur-[20px] -z-10"
      />
      <motion.div 
        animate={{ y: [10, -15, 10], rotate: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        className="absolute -bottom-12 -right-12 w-32 h-32 bg-rk-brown/10 rounded-full blur-[24px] -z-10"
      />

      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-center relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 transform -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-14 h-14 bg-gradient-to-b from-rk-brown to-rk-brown/90 rounded-[16px] flex items-center justify-center mb-4 shadow-lg shadow-rk-brown/20 relative"
        >
           <Wallet className="w-7 h-7 text-rk-gold drop-shadow-md" />
           <motion.div 
             animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
             transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
             className="absolute -top-1 -right-1"
           >
             <Sparkles className="w-3 h-3 text-rk-gold" />
           </motion.div>
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 tracking-tight">RupiahKu<span className="text-rk-gold">.</span></h1>
        <p className="text-[14px] sm:text-[15px] text-gray-500 mb-5 px-2 text-center leading-relaxed">Kelola duit jajan dengan elegan tanpa pusing.</p>

        <div className="w-full flex bg-gray-50/80 p-1 rounded-2xl mb-5 border border-gray-100">
           <button 
             onClick={() => { setAuthMode('login'); setAuthError(''); }} 
             className={`flex-1 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-semibold rounded-xl transition-all duration-300 cursor-pointer ${authMode === 'login' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-gray-900 scale-100' : 'text-gray-400 hover:text-gray-700 scale-95'}`}
           >
             Masuk
           </button>
           <button 
             onClick={() => { setAuthMode('register'); setAuthError(''); }} 
             className={`flex-1 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-semibold rounded-xl transition-all duration-300 cursor-pointer ${authMode === 'register' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-gray-900 scale-100' : 'text-gray-400 hover:text-gray-700 scale-95'}`}
           >
             Daftar Baru
           </button>
        </div>
        
        <form className="w-full space-y-3 mb-2 relative z-10" onSubmit={handleSubmit}>
           <div className="relative group">
              <Mail className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rk-brown transition-colors" />
              <input 
                id="auth-email-input"
                name="email"
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200/80 rounded-2xl py-3 pl-12 pr-4 text-[14px] sm:text-[15px] text-gray-700 outline-none focus:bg-white focus:border-rk-brown/50 focus:ring-4 focus:ring-rk-brown/5 transition-all" 
                required
              />
           </div>
           <div className="relative group">
              <Lock className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rk-brown transition-colors" />
              <input 
                id="auth-password-input"
                name="password"
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200/80 rounded-2xl py-3 pl-12 pr-4 text-[14px] sm:text-[15px] text-gray-700 outline-none focus:bg-white focus:border-rk-brown/50 focus:ring-4 focus:ring-rk-brown/5 transition-all" 
                required
              />
           </div>
           
           <AnimatePresence>
             {authError && (
               <motion.p 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="text-red-500 text-[12px] sm:text-[13px] text-left font-medium rounded-lg"
                 style={{marginTop: '4px'}}
               >
                 {authError}
               </motion.p>
             )}
           </AnimatePresence>
           
           <button 
             type="submit"
             disabled={isAuthLoading}
             className="w-full bg-rk-brown text-white flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-2xl font-semibold mt-5 mb-4 shadow-lg shadow-rk-brown/25 hover:shadow-xl hover:shadow-rk-brown/30 hover:-translate-y-0.5 active:translate-y-0 transition-all text-[14px] sm:text-[15px] disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
           >
              {isAuthLoading ? (
                <span className="flex items-center justify-center">
                  <motion.span animate={{rotate:360}} transition={{repeat:Infinity, duration:1, ease:'linear'}} className="mr-2 inline-block">
                    <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  </motion.span> 
                  Memproses...
                </span>
              ) : (
                <>{authMode === 'login' ? 'Masuk Sekarang' : 'Buat Akun'}</>
              )}
           </button>
        </form>
        
        {authMode === 'login' && <button className="text-[13px] sm:text-[14px] text-rk-brown/60 font-medium mb-5 hover:text-rk-brown transition-colors cursor-pointer">Lupa password?</button>}

        <div className="w-full flex items-center gap-4 mb-5 select-none">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-gray-200"></div>
          <span className="text-[11px] sm:text-[12px] font-medium text-gray-400 uppercase tracking-widest px-2">Atau</span>
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-gray-200"></div>
        </div>

        <button 
          onClick={signIn}
          className="w-full mb-3 flex items-center justify-center gap-3 bg-white border border-gray-200/80 text-gray-700 py-3 sm:py-3.5 rounded-2xl font-medium shadow-sm hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all text-[13px] sm:text-[14px] group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/0 via-gray-50/80 to-gray-50/0 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
          <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] group-hover:scale-110 transition-transform duration-300 relative z-10">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="relative z-10">Lanjutkan dengan Google</span>
        </button>

        <button 
          onClick={signInAsGuest}
          className="w-full flex items-center justify-center gap-2.5 text-rk-brown/80 bg-rk-brown/5 border border-rk-brown/10 py-3 sm:py-3.5 rounded-2xl font-medium hover:bg-rk-brown/10 active:scale-[0.98] transition-all text-[13px] sm:text-[14px] cursor-pointer"
        >
          <span className="text-lg leading-none">👀</span> Intip Mode Guest
        </button>
      </div>
    </motion.div>
  );
}
