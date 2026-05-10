import React from 'react';
import { X, Bookmark, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../utils/storage';
import { syncUserProfile } from '../utils/firebaseUtils';
import { useFirebase } from './FirebaseProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export default function SavedItemsSidebar({ isOpen, onClose, profile }: Props) {
  const { refreshProfile } = useFirebase();
  const hasItems = (profile.savedSummaries && profile.savedSummaries.length > 0) || 
                   (profile.savedRecurring && profile.savedRecurring.length > 0) ||
                   (profile.savedProjections && profile.savedProjections.length > 0) ||
                   (profile.savedRoasts && profile.savedRoasts.length > 0);

  const handleDeleteSummary = async (id: string) => {
     if (!profile.savedSummaries) return;
     const newSaved = profile.savedSummaries.filter(s => s.id !== id);
     await syncUserProfile({ ...profile, savedSummaries: newSaved });
  };

  const handleDeleteRecurring = async (id: string) => {
     if (!profile.savedRecurring) return;
     const newSaved = profile.savedRecurring.filter(s => s.id !== id);
     await syncUserProfile({ ...profile, savedRecurring: newSaved });
  };

  const handleDeleteProjection = async (id: string) => {
     if (!profile.savedProjections) return;
     const newSaved = profile.savedProjections.filter(s => s.id !== id);
     await syncUserProfile({ ...profile, savedProjections: newSaved });
  };

  const handleDeleteRoast = async (id: string) => {
     if (!profile.savedRoasts) return;
     const newSaved = profile.savedRoasts.filter(s => s.id !== id);
     await syncUserProfile({ ...profile, savedRoasts: newSaved });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="cursor-pointer fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[320px] bg-[#FFFDF8] shadow-2xl z-50 flex flex-col border-l border-rk-brown/10 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-rk-brown/10 shrink-0">
              <div className="flex items-center gap-2 text-rk-brown">
                <Bookmark className="w-5 h-5" />
                <h2 className="font-serif text-xl font-bold">Arsip AI</h2>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer p-2 -mr-2 text-rk-brown/50 hover:text-rk-brown hover:bg-rk-brown/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scroll-smooth">
              {!hasItems ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Bookmark className="w-10 h-10 text-rk-brown/20 mb-3" />
                  <p className="text-rk-brown/50 text-sm">Belum ada arsip.<br/>Simpan insight AI disini.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {profile.savedSummaries && profile.savedSummaries.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-rk-brown/40 uppercase tracking-widest pl-1">Weekly Summary</h3>
                      {profile.savedSummaries.map((summary) => (
                         <div key={summary.id} className="bg-white rounded-xl p-4 shadow-sm border border-rk-brown/5 relative group">
                            <button onClick={() => handleDeleteSummary(summary.id)} className="cursor-pointer absolute top-3 right-3 text-rk-brown/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Trash2 className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-rk-brown/50 mb-2">{new Date(summary.generatedAt).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}</p>
                            <p className="text-sm font-hand text-rk-brown/90 leading-relaxed mb-3 pr-4">{summary.summary}</p>
                            <p className="text-xs font-semibold text-rk-brown/80 mb-1">Top Spending:</p>
                            <ul className="list-disc pl-4 text-xs font-hand text-rk-brown/80 mb-3">
                              {summary.topCategories.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                            <p className="text-xs text-rk-brown/90"><span className="font-bold">Tip:</span> {summary.tip}</p>
                         </div>
                      ))}
                    </div>
                  )}

                  {profile.savedRecurring && profile.savedRecurring.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-rk-brown/40 uppercase tracking-widest pl-1">Pola Berulang</h3>
                      {profile.savedRecurring.map((rec) => (
                        <div key={rec.id} className="bg-white rounded-xl p-4 shadow-sm border border-rk-brown/5 relative group">
                           <button onClick={() => handleDeleteRecurring(rec.id)} className="cursor-pointer absolute top-3 right-3 text-rk-brown/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                           </button>
                           <p className="text-[10px] text-rk-brown/50 mb-2">{new Date(rec.generatedAt).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}</p>
                           <p className="text-sm text-rk-brown leading-relaxed mb-3 pr-4">"{rec.text}"</p>
                           <div className="bg-rk-brown/5 rounded-lg p-2 border border-rk-brown/10">
                              <p className="text-[9px] uppercase tracking-widest text-rk-brown/60 mb-1">Proyeksi 6 Bulan</p>
                              <p className="font-serif justify-start text-sm font-bold text-rk-brown">Rp {rec.projection6Months.toLocaleString('id-ID')}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {profile.savedProjections && profile.savedProjections.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-rk-brown/40 uppercase tracking-widest pl-1">Proyeksi</h3>
                      {profile.savedProjections.map((proj) => (
                        <div key={proj.id} className="bg-white rounded-xl p-4 shadow-sm border border-rk-brown/5 relative group">
                           <button onClick={() => handleDeleteProjection(proj.id)} className="cursor-pointer absolute top-3 right-3 text-rk-brown/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                           </button>
                           <p className="text-[10px] text-rk-brown/50 mb-2">{new Date(proj.generatedAt).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}</p>
                           <h4 className="text-xs font-bold text-rk-brown uppercase mb-1">Latte Factor</h4>
                           <p className="text-sm text-rk-brown mb-2">{proj.latteFactor.items.join(', ')}</p>
                           <div className="bg-rk-brown/5 rounded-lg p-2 border border-rk-brown/10">
                              <p className="text-[9px] uppercase tracking-widest text-rk-brown/60 mb-1">1 Tahun Hangus</p>
                              <p className="font-serif justify-start text-sm font-bold text-rk-red">Rp {proj.latteFactor.yearlyCost.toLocaleString('id-ID')}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {profile.savedRoasts && profile.savedRoasts.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-rk-brown/40 uppercase tracking-widest pl-1">Aura Roast</h3>
                      {profile.savedRoasts.map((roast) => (
                        <div key={roast.id} className="bg-white rounded-xl p-4 shadow-sm border border-rk-brown/5 relative group">
                           <button onClick={() => handleDeleteRoast(roast.id)} className="cursor-pointer absolute top-3 right-3 text-rk-brown/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                           </button>
                           <p className="text-[10px] text-rk-brown/50 mb-2">{new Date(roast.generatedAt).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}</p>
                           <h4 className="text-lg font-black italic text-rk-brown mb-1">"{roast.aura}"</h4>
                           <p className="text-xs font-semibold text-rk-brown/80 mb-2">🏆 {roast.characterTitle}</p>
                           <p className="text-sm text-rk-brown italic line-clamp-3">"{roast.roast}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
