import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense } from '../utils/storage';
import { AlertTriangle } from 'lucide-react';

interface BudgetWarningProps {
  expenses: Expense[];
  monthlyBudget: number;
  onGoToInsights?: () => void;
}

export default function BudgetWarning({ expenses, monthlyBudget, onGoToInsights }: BudgetWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  // Weekly budget is roughly total / 4
  const weeklyBudget = monthlyBudget / 4;
  
  // Get expenses for the last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const spentThisWeek = expenses
    .filter(e => new Date(e.date) >= sevenDaysAgo)
    .reduce((sum, e) => sum + e.amount, 0);

  const percent = spentThisWeek / weeklyBudget;
  
  if (dismissed || percent < 0.8) return null;

  const isCritical = percent >= 1;
  const bgColor = isCritical ? 'bg-rk-red' : 'bg-rk-amber';
  const textColor = isCritical ? 'text-rk-cream' : 'text-rk-brown';
  
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`mx-4 mb-6 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm ${bgColor} ${textColor}`}
        >
          <div className="flex items-center gap-3">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <p className="text-sm font-medium leading-tight">
               {isCritical 
                 ? "Budget mingguan lo udah abis (100%). Mau lihat-lihat yang bisa ditekan?" 
                 : `Hati-hati, sisa budget minggu ini tinggal ${Math.round((1 - percent) * 100)}%.`}
             </p>
          </div>
          {isCritical ? (
            <button 
              onClick={() => {
                setDismissed(true);
                onGoToInsights?.();
              }}
              className="shrink-0 ml-3 px-3 py-2 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-center"
            >
              Cek Insights
            </button>
          ) : (
            <button 
              onClick={() => setDismissed(true)}
              className="shrink-0 ml-3 px-3 py-1 text-xs font-semibold rounded-lg bg-black/10 hover:bg-black/20"
            >
              Dimengerti
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
