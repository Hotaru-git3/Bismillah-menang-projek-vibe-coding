import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Rocket, Bookmark } from 'lucide-react';
import { Expense, UserProfile } from '../utils/storage';
import { generateProyeksi } from '../services/geminiService';
import { syncUserProfile } from '../utils/firebaseUtils';

interface Props {
  expenses: Expense[];
  profile: UserProfile;
  onShowToast: (msg: string) => void;
}

export default function ProjectionCard({ expenses, profile, onShowToast }: Props) {
  const [proyeksi, setProyeksi] = React.useState<any>(profile?.latestProjection || null);
  const [loading, setLoading] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  useEffect(() => {
    if (profile?.latestProjection && !proyeksi) {
      setProyeksi(profile.latestProjection);
    }
  }, [profile?.latestProjection]);

  const loadProyeksi = async () => {
    if (expenses.length === 0) return;
    setLoading(true);
    try {
      const res = await generateProyeksi(expenses);
      const generatedAt = new Date().toISOString();
      const updatedProyeksi = { ...res, generatedAt };
      
      setProyeksi(updatedProyeksi);
      setRetryCount(0);
      
      const newProfile = { ...profile, latestProjection: updatedProyeksi };
      await syncUserProfile(newProfile);
    } catch (e: any) {
      console.error(e);
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(loadProyeksi, 1000);
      } else {
        onShowToast("AI lagi sibuk, coba nanti.");
      }
    } finally {
      if (retryCount >= 2) setLoading(false);
      else if (!loading) setLoading(false);
    }
  };

  if (!proyeksi) {
    return (
      <div className="text-center py-10 md:py-16">
        <Rocket className="w-12 h-12 text-rk-brown/20 mx-auto mb-4" />
        <h3 className="font-serif text-xl md:text-2xl text-rk-brown mb-2">Lihat Masa Depan Lo</h3>
        <p className="text-sm text-rk-brown/60 mb-6">AI bakal hitung efek jangka panjang dari pengeluaran lo.</p>
        <button 
          onClick={loadProyeksi}
          disabled={loading || expenses.length === 0}
          className="cursor-pointer bg-rk-brown text-rk-cream px-6 py-3 rounded-xl font-medium shadow-md active:bg-rk-brown-light transition-all disabled:opacity-50"
        >
           {loading ? (
             <span className="flex items-center justify-center animate-pulse">Menghitung...</span>
           ) : (
             "Mulai Proyeksi AI"
           )}
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
      {/* Latte Factor Card */}
      <div className="bg-[#FAF8F5] border border-rk-brown/10 rounded-xl p-5 md:p-6 shadow-[4px_4px_0_0_rgba(62,39,35,0.05)] relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-rk-brown/5 rounded-full" />
        <h3 className="font-serif text-xl text-rk-brown mb-2 text-center mt-2">☕ The Latte Factor</h3>
        
        {proyeksi.latteFactor.items.length > 0 ? (
          <p className="text-center text-sm text-rk-brown/70 mb-4">Lo keseringan jajan: <span className="font-medium text-rk-brown">{proyeksi.latteFactor.items.join(', ')}</span></p>
        ) : (
          <p className="text-center text-sm text-rk-brown/70 mb-4">Pengeluaran kecil aman, santai aja.</p>
        )}
        
        <div className="text-center my-6">
           <p className="text-[10px] font-bold uppercase tracking-widest text-rk-brown/50 mb-1">Kalo Diterusin, Setahun Abis</p>
           <p className="text-2xl md:text-3xl font-serif text-rk-red font-bold">Rp {proyeksi.latteFactor.yearlyCost.toLocaleString('id-ID')}</p>
        </div>
        
        <div className="bg-rk-gold/10 p-3 rounded-lg text-center border border-rk-gold/20">
          <p className="text-xs text-rk-gold-dark font-medium italic">"{proyeksi.latteFactor.equivalentText}"</p>
        </div>
      </div>
      {/* Time Machine Card */}
      <div className="bg-[#FDFBF7] border-2 border-dashed border-rk-brown/20 rounded-xl p-5 md:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMzRTI3MjMiLz48L3N2Zz4=')]"></div>
        
        <div className="relative z-10">
            <h3 className="font-serif text-xl text-rk-brown mb-6 text-center">🚀 Mesin Waktu Investasi</h3>
            
            <div className="relative flex justify-between items-center mb-10 px-0">
               <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-rk-brown/20 -translate-y-1/2 z-0" />
               
               <div className="z-10 flex flex-col items-center bg-[#Fdfbf7] p-1">
                  <div className="w-3 h-3 rounded-full bg-rk-brown border-2 border-[#Fdfbf7]" />
                  <p className="text-[9px] font-bold uppercase mt-2 text-rk-brown">Hari Ini</p>
                  <p className="text-[11px] font-medium text-rk-brown/70 text-center whitespace-nowrap">Rp {(proyeksi.investmentMachine.currentMonthly / 1000).toLocaleString('id-ID')}K</p>
               </div>
               
               <div className="z-10 flex flex-col items-center bg-[#Fdfbf7] p-1">
                  <div className="w-3 h-3 rounded-full bg-rk-gold border-2 border-[#Fdfbf7]" />
                  <p className="text-[9px] font-bold uppercase mt-2 text-rk-brown">1 Thn</p>
                  <p className="text-[11px] font-medium text-rk-brown/70 text-center whitespace-nowrap">Rp {(proyeksi.investmentMachine.projected1Y / 1000000).toFixed(1)}Jt</p>
               </div>

               <div className="z-10 flex flex-col items-center bg-[#Fdfbf7] p-1">
                  <div className="w-4 h-4 rounded-full bg-rk-green border-2 border-[#Fdfbf7] shadow-sm animate-pulse" />
                  <p className="text-[9px] font-bold uppercase mt-2 text-rk-green">5 Thn</p>
                  <p className="text-[12px] font-bold text-rk-green text-center whitespace-nowrap">Rp {(proyeksi.investmentMachine.projected5Y / 1000000).toFixed(1)}Jt</p>
               </div>
            </div>
            
            <p className="text-center text-sm font-hand text-rk-brown/90 leading-relaxed text-[17px]">
               "{proyeksi.investmentMachine.encouragement}"
            </p>
        </div>
      </div>
      <div className="lg:col-span-2 flex items-center justify-center gap-6 pt-2">
        <button onClick={loadProyeksi} className="cursor-pointer text-xs text-rk-brown/40 hover:text-rk-brown underline transition-colors">
          Hitung Ulang Proyeksi
        </button>
        <button 
           onClick={async () => {
                 const isSaved = profile.savedProjections?.some(s => s.generatedAt === proyeksi.generatedAt);
                 let newSaved = profile.savedProjections ? [...profile.savedProjections] : [];
                 if (isSaved) {
                   newSaved = newSaved.filter(s => s.generatedAt !== proyeksi.generatedAt);
                   onShowToast("Proyeksi dihapus dari arsip.");
                 } else {
                   newSaved.unshift({
                      id: Math.random().toString(36).substring(2, 9),
                      ...proyeksi,
                      generatedAt: proyeksi.generatedAt || new Date().toISOString()
                   });
                   onShowToast("Proyeksi disimpan ke arsip.");
                 }
                 const newProfile = { ...profile, savedProjections: newSaved };
                 await syncUserProfile(newProfile);
           }}
           className="cursor-pointer text-rk-brown/40 hover:text-rk-brown transition-colors flex items-center gap-1 text-xs font-semibold"
           title="Simpan Proyeksi"
         >
           {profile.savedProjections?.some(s => s.generatedAt === proyeksi.generatedAt) ? (
              <><Bookmark className="w-3.5 h-3.5 fill-black text-black" /> <span className="text-black">Tersimpan</span></>
           ) : (
              <><Bookmark className="w-3.5 h-3.5" /> Simpan ke Arsip</>
           )}
         </button>
      </div>
    </motion.div>
  );
}
