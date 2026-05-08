import { useState, useRef, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { User as UserIcon, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfileDropdown({ onNavigate, onOpenProfile }: { onNavigate: (tab: 'dashboard' | 'log' | 'insights' | 'settings') => void, onOpenProfile: () => void }) {
  const { user, profile, signOutGoogle } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  let timeoutId: NodeJS.Timeout;

  const handleMouseEnter = () => {
    clearTimeout(timeoutId);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutId = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutId);
  }, []);

  if (!user || !profile) return null;

  const initials = profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <div 
      className="relative z-50 cursor-pointer" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 focus:outline-none cursor-pointer group"
      >
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-rk-gold text-white flex items-center justify-center font-semibold text-sm shadow-sm border-2 border-white group-hover:scale-105 transition-transform">
          {initials}
        </div>
        <ChevronDown className={`w-4 h-4 text-rk-brown/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-rk-brown/5 overflow-hidden z-50 cursor-default"
          >
            <div className="p-4 border-b border-rk-brown/5 flex items-center gap-3 bg-rk-cream/30">
              <div className="w-10 h-10 rounded-full bg-rk-gold text-white flex flex-shrink-0 items-center justify-center font-semibold text-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-rk-brown text-sm truncate">{profile.name}</p>
                <p className="text-xs text-rk-brown/60 truncate">{user.email}</p>
              </div>
            </div>
            <div className="p-2">
              <button 
                onClick={() => { setIsOpen(false); onOpenProfile(); }}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-rk-brown hover:bg-rk-brown/10 active:bg-rk-brown/10 rounded-xl transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-rk-brown/60" /> Profile
              </button>
              <button 
                onClick={() => { setIsOpen(false); onNavigate('settings'); }}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-rk-brown hover:bg-rk-brown/10 active:bg-rk-brown/10 rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-rk-brown/60" /> Pengaturan
              </button>
              <div className="h-px bg-rk-brown/5 my-1" />
              <button 
                onClick={async () => { setIsOpen(false); await signOutGoogle(); }}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-rk-red hover:bg-rk-red/10 active:bg-rk-red/10 rounded-xl transition-colors font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
