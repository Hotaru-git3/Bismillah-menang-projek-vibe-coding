import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, Wallet } from 'lucide-react';
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
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="max-w-[400px] w-full bg-white rounded-[24px] p-6 sm:p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center"
    >
      <div className="w-14 h-14 bg-rk-brown rounded-2xl flex items-center justify-center mb-5 shadow-sm">
         <Wallet className="w-7 h-7 text-rk-gold" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">RupiahKu.</h1>
      <p className="text-sm text-gray-500 mb-8 px-2 text-center">Masuk atau daftar untuk melanjutkan pencatatan pengeluaran</p>

      <div className="w-full flex bg-gray-100/80 p-1 rounded-xl mb-6">
         <button 
           onClick={() => { setAuthMode('login'); setAuthError(''); }} 
           className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-colors cursor-pointer ${authMode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
         >
           Login
         </button>
         <button 
           onClick={() => { setAuthMode('register'); setAuthError(''); }} 
           className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-colors cursor-pointer ${authMode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
         >
           Daftar
         </button>
      </div>
      
      <form className="w-full space-y-4 mb-2" onSubmit={handleSubmit}>
         <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              id="auth-email-input"
              name="email"
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-700 outline-none focus:border-rk-brown transition-all" 
              required
            />
         </div>
         <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              id="auth-password-input"
              name="password"
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-700 outline-none focus:border-rk-brown transition-all" 
              required
            />
         </div>
         {authError && <p className="text-red-500 text-xs text-left" style={{marginTop: '8px'}}>{authError}</p>}
         
         <button 
           type="submit"
           disabled={isAuthLoading}
           className="w-full bg-rk-brown text-white flex items-center justify-center gap-2 py-3 rounded-xl font-medium mt-6 mb-4 hover:bg-rk-brown/90 transition-all active:scale-95 text-sm disabled:opacity-70 cursor-pointer"
         >
            {isAuthLoading ? (
              <span className="flex items-center justify-center"><motion.span animate={{rotate:360}} transition={{repeat:Infinity, duration:1, ease:'linear'}} className="mr-2 inline-block"><LogIn className="w-4 h-4"/></motion.span> Memproses...</span>
            ) : (
              <><LogIn className="w-4 h-4" /> {authMode === 'login' ? 'Login' : 'Daftar'}</>
            )}
         </button>
      </form>
      
      {authMode === 'login' && <button className="text-[13px] text-rk-brown/80 font-medium mb-6 hover:underline cursor-pointer">Lupa password?</button>}

      <div className="w-full flex items-center gap-4 mb-6">
        <div className="flex-1 h-[1px] bg-gray-100"></div>
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest px-1">atau</span>
        <div className="flex-1 h-[1px] bg-gray-100"></div>
      </div>

      <button 
        onClick={signIn}
        className="w-full mb-3 flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-sm group cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:scale-110 transition-transform">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Lanjut dengan Google
      </button>

      <button 
        onClick={signInAsGuest}
        className="w-full flex items-center justify-center gap-2 text-rk-brown/70 bg-rk-brown/5 py-3 rounded-xl font-medium shadow-sm hover:bg-rk-brown/10 active:scale-95 transition-all text-sm cursor-pointer"
      >
        <span>👀</span> Coba Tanpa Login
      </button>
    </motion.div>
  );
}
