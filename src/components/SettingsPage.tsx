import React, { useState } from 'react';
import { Upload, LogOut, Wallet, Mail, Lock, Instagram, Linkedin, Github } from 'lucide-react';
import { UserProfile, Expense } from '../utils/storage';
import { useFirebase } from './FirebaseProvider';
import { syncUserProfile } from '../utils/firebaseUtils';

interface SettingsProps {
  profile: UserProfile;
  expenses: Expense[];
}

export default function SettingsPage({ profile, expenses }: SettingsProps) {
  const { signOutGoogle, refreshProfile } = useFirebase();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(profile.monthlyBudget.toString());

  const handleExportData = async () => {
    const csvContent = "Tanggal,Nominal,Kategori,Deskripsi\n" + 
      expenses.map(e => `${e.date},${e.amount},${e.category},"${e.text}"`).join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `laporan_rupiahku_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveBudget = async () => {
    const newBudget = parseInt(budgetInput) || profile.monthlyBudget;
    const newProfile = { ...profile, monthlyBudget: newBudget };
    await syncUserProfile(newProfile);
    await refreshProfile();
    setIsEditingBudget(false);
  };

  return (
    <div className="pt-2 pb-24 md:pb-6">
      <h2 className="text-2xl font-serif text-rk-brown mb-6 md:hidden">Pengaturan</h2>
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col gap-6 max-w-[600px] mx-auto md:mt-4">
        {/* Profil & Budget */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
            <div className="w-14 h-14 bg-rk-brown text-rk-cream rounded-full flex items-center justify-center text-xl font-bold shadow-sm">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Profil</p>
              <p className="text-xl font-medium text-gray-900">{profile.name}</p>
            </div>
          </div>
          
          <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <Wallet className="w-24 h-24" />
             </div>
             
             <div className="relative z-10">
               <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                     <Wallet className="w-4 h-4" />
                   </div>
                   <p className="text-xs font-bold uppercase text-gray-600 tracking-wider">Limit Bulanan</p>
                 </div>
                 {!isEditingBudget && (
                   <button onClick={() => { setIsEditingBudget(true); setBudgetInput(profile.monthlyBudget.toString()); }} className="cursor-pointer text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors px-3 py-1.5 rounded-full hover:bg-orange-100">Ubah Limit</button>
                 )}
               </div>
               
               {!isEditingBudget ? (
                 <p className="text-3xl font-serif text-gray-900">Rp {profile.monthlyBudget.toLocaleString('id-ID')}</p>
               ) : (
                 <div className="flex items-center gap-3 mt-2">
                   <span className="text-xl font-serif text-gray-900">Rp</span>
                   <input
                     id="settings-budget-input"
                     name="settingsBudget"
                     type="number"
                     value={budgetInput}
                     onChange={e => setBudgetInput(e.target.value)}
                     className="flex-1 bg-white border border-orange-200 rounded-xl px-4 py-2.5 text-lg font-serif text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all font-medium"
                     autoFocus
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') handleSaveBudget();
                       if (e.key === 'Escape') setIsEditingBudget(false);
                     }}
                   />
                   <button onClick={handleSaveBudget} className="cursor-pointer bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-orange-600 transition-colors shadow-sm">Simpan</button>
                 </div>
               )}
             </div>
          </div>
        </div>
        
        {/* Aksi & Data */}
        <div className="flex flex-col gap-3 pt-2">
          <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-2 pl-1">Data & Ekspor</p>
          
          <button 
            onClick={handleExportData}
            className="cursor-pointer group w-full flex items-center justify-between px-5 text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-100 py-4 rounded-xl font-medium transition-all text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4 text-gray-600" /> 
              </div>
              <span>Ekspor Data (CSV)</span>
            </div>
          </button>
          
          <button 
            onClick={() => alert('Fitur Hapus Semua Data sedang dalam perbaikan.')}
            className="cursor-pointer group w-full flex items-center justify-between px-5 text-gray-700 bg-gray-50 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-gray-100 py-4 rounded-xl font-medium transition-all text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                <Lock className="w-4 h-4 text-gray-600 group-hover:text-red-500" /> 
              </div>
              <span>Hapus Semua Catatan</span>
            </div>
          </button>
        </div>
        
        {/* Akun */}
        <div className="flex flex-col gap-3 pt-2">
          <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-2 pl-1">Akun</p>

          <button 
            onClick={async () => {
              if (window.confirm('Keluar dari RupiahKu?')) {
                await signOutGoogle();
              }
            }}
            className="cursor-pointer group w-full flex items-center justify-between px-5 text-red-600 bg-red-50/50 hover:bg-red-50 border border-red-100/50 py-4 rounded-xl font-medium transition-all text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-red-100 group-hover:scale-105 transition-transform">
                <LogOut className="w-4 h-4 text-red-500" /> 
              </div>
              <span>Keluar Akun</span>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-rk-brown/40 text-xs font-medium pb-8 flex flex-col items-center gap-4">
        <div className="space-y-1">
          <p className="uppercase tracking-widest text-[9px]">RupiahKu v1.0</p>
          <p className="font-serif italic text-rk-brown/60 text-sm">"Dompet lo, kendali lo."</p>
        </div>
        
        <div className="flex items-center gap-4 text-rk-brown/40">
          <a href="https://instagram.com/zdansln" target="_blank" rel="noopener noreferrer" className="hover:text-rk-brown transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="https://linkedin.com/in/zidane-solahudin-573933345" target="_blank" rel="noopener noreferrer" className="hover:text-rk-brown transition-colors">
            <Linkedin className="w-5 h-5" />
          </a>
          <a href="https://github.com/Hotaru-git3" target="_blank" rel="noopener noreferrer" className="hover:text-rk-brown transition-colors">
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
