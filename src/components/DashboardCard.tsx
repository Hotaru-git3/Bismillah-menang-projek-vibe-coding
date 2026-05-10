import { motion } from 'motion/react';
import { Expense } from '../utils/storage';
import { formatRupiah, calculateRunway } from '../utils/helpers';
import { getCategoryColor } from '../utils/colors';

interface DashboardProps {
  expenses: Expense[];
  monthlyBudget: number;
}

export default function DashboardCard({ expenses, monthlyBudget }: DashboardProps) {
  // Calculate totals
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = today.getDate();

  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyBurnRate = currentDay > 0 ? totalSpent / currentDay : 0;
  const runway = calculateRunway(monthlyBudget, totalSpent, daysInMonth);

  // Group by category for the donut chart
  const byCategory = thisMonthExpenses.reduce((acc, e) => {
    const category = e.category || 'Lainnya';
    acc[category] = (acc[category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // Donut chart calculations
  const totalCategory = totalSpent || 1; // prevent div by zero
  
  // Sort categories by amount desc
  const sortedCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, amount]) => amount > 0);

  let currentOffset = 25; // CSS trick offset start
  const c = 100; // circumference
  
  const segments = sortedCategories.map(([label, amount], i) => {
    const p = (amount / totalCategory) * 100;
    const dash = `${p} ${c - p}`;
    const offset = currentOffset;
    currentOffset = currentOffset - p;
    return { label, p, dash, offset, color: getCategoryColor(label), delay: i * 0.1 };
  });

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(62,39,35,0.06)] p-5 md:p-6 lg:p-7 mb-0 relative overflow-hidden flex flex-col gap-5 md:gap-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-5">
        <div className="flex-1">
          <p className="text-sm text-rk-brown/60 uppercase tracking-widest font-semibold mb-1">Bulan Ini</p>
          <h2 className="text-3xl md:text-4xl font-serif text-rk-brown font-medium tracking-tight">
            {formatRupiah(totalSpent)}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-rk-cream-dark text-rk-brown px-2 py-0.5 rounded-full whitespace-nowrap">
              Bakar Rp {Math.round(dailyBurnRate).toLocaleString('id-ID')}/hari
            </span>
          </div>
        </div>
        
        {/* Donut Chart - bigger on desktop */}
        <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 mx-auto sm:mx-0">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#f5e6d3" strokeWidth="3.5" />
            
            {/* Segments */}
            {segments.map((segment, i) => (
              <motion.circle key={i} cx="18" cy="18" r="15.9155" fill="transparent" stroke={segment.color} strokeWidth="3.5"
                strokeDasharray={segment.dash} strokeDashoffset={segment.offset}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: segment.delay }}
              />
            ))}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-[11px] md:text-xs leading-tight font-medium text-rk-brown text-center">
              Sisa<br/><span className="text-lg md:text-xl font-bold">{runway}</span><br/>hr
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-end mb-2">
           <span className="text-xs font-semibold uppercase tracking-widest text-rk-brown/60">Runway</span>
           <span className="font-medium text-rk-brown text-sm">{Math.min(runway, daysInMonth)} / {daysInMonth} Hari</span>
        </div>
        <div className="w-full bg-rk-cream-dark h-2.5 rounded-full overflow-hidden border border-rk-brown/10">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${Math.min(100, Math.max(0, (runway / daysInMonth) * 100))}%` }}
             transition={{ duration: 1, ease: 'easeOut' }}
             className={`h-full rounded-full ${(runway / daysInMonth) > 0.5 ? 'bg-rk-green' : (runway / daysInMonth) > 0.2 ? 'bg-rk-gold-dark' : 'bg-rk-red'}`}
           />
        </div>
      </div>

      <div className="flex gap-4 md:gap-6 border-t border-rk-brown/10 pt-4 flex-wrap">
        {segments.slice(0, 4).map((s, i) => (
           <div key={i} className="flex items-center gap-1.5 text-xs text-rk-brown/80">
             <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
             <span className="whitespace-nowrap">{s.label} {Math.round(s.p)}%</span>
           </div>
        ))}
        {segments.length > 4 && (
           <div className="flex items-center gap-1.5 text-xs text-rk-brown/80 opacity-60">
             <span>+ {segments.length - 4} lainnya</span>
           </div>
        )}
      </div>
      
    </div>
  );
}