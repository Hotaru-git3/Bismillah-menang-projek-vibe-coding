import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './FirebaseProvider';
import { X, User as UserIcon, Mail } from 'lucide-react';
import { syncUserProfile } from '../utils/firebaseUtils';
import { useState } from 'react';

export default function ProfileModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, profile, refreshProfile } = useFirebase();
  const [editName, setEditName] = useState(profile?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!user || !profile) return null;

  const initials = profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  const handleSave = async () => {
    if (!editName.trim() || editName === profile.name) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    await syncUserProfile({ ...profile, name: editName });
    await refreshProfile();
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 cursor-pointer"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[400px] max-w-[100vw] bg-white shadow-2xl z-50 flex flex-col p-6 rounded-l-3xl overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-serif text-rk-brown font-bold">Profil Akun</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-rk-brown/5 text-rk-brown/60 hover:bg-rk-brown/10 hover:text-rk-brown transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-10">
              <div className="w-24 h-24 rounded-full bg-rk-gold text-white flex items-center justify-center text-3xl font-semibold shadow-lg shadow-rk-gold/20 mb-4 border-4 border-white">
                {initials}
              </div>
              
              {!isEditing ? (
                <>
                  <h3 className="text-xl font-medium text-rk-brown">{profile.name}</h3>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-rk-gold hover:text-rk-amber font-medium mt-2 cursor-pointer transition-colors"
                  >
                    Edit Nama
                  </button>
                </>
              ) : (
                <div className="w-full max-w-[250px] flex items-center gap-2">
                  <input 
                    id="profile-name-input"
                    name="profileName"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-rk-brown text-center"
                    autoFocus
                  />
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-rk-brown text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rk-brown/90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? '...' : 'Simpan'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 mb-2 block">Informasi Personal</label>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nama Tampilan</p>
                      <p className="text-sm font-medium text-gray-800">{profile.name}</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-gray-200/50"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-800">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 mb-2 block">Statistik</label>
                <div className="bg-rk-brown text-white rounded-2xl p-5 shadow-lg shadow-rk-brown/10 relative overflow-hidden">
                  <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-rk-gold/20 rounded-full blur-xl"></div>
                  
                  <div className="relative z-10 flex flex-col gap-1">
                    <p className="text-white/70 text-xs">Total Anggaran Bulanan</p>
                    <p className="text-2xl font-serif font-bold">Rp {(profile.monthlyBudget || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
