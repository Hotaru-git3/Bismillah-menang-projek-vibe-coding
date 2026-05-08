import { Home, PlusCircle, PieChart, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'dashboard' | 'log' | 'insights' | 'settings';
  onChange: (tab: 'dashboard' | 'log' | 'insights' | 'settings') => void;
}

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'log', icon: PlusCircle, label: 'Log' },
    { id: 'insights', icon: PieChart, label: 'Insights' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ] as const;

  return (
    <div className="relative z-40 bg-white/95 backdrop-blur border-t border-rk-brown/5 px-4 py-1.5 pb-safe shadow-[0_-4px_20px_rgba(62,39,35,0.03)]">
      <div className="flex justify-between items-center w-full max-w-lg mx-auto">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="cursor-pointer flex flex-col items-center justify-center w-14 h-14 relative"
            >
              <t.icon 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'text-rk-gold-dark' : 'text-rk-brown/40'}`} 
              />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-rk-brown' : 'text-rk-brown/40'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}