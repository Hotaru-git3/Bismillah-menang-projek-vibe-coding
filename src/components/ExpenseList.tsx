import { useState } from 'react';
import { formatRupiah } from '../utils/helpers';
import { Expense } from '../utils/storage';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, TrendingDown, ShoppingBag, RotateCcw, Edit2, Trash2, Check, X, Search } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  lastAddedId?: string | null;
  onUndo?: () => void;
  onDeleteExpense?: (id: string) => void;
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => void;
}

export default function ExpenseList({ expenses, lastAddedId, onUndo, onDeleteExpense, onUpdateExpense }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = expenses.filter(expense => 
    expense.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center text-rk-brown/60">
        <div className="w-24 h-24 mb-4 opacity-50 relative">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-rk-brown">
             <path d="M20 80 L80 20 M20 20 L20 80 L80 80" />
             <circle cx="50" cy="50" r="10" strokeDasharray="2 4"/>
             <path d="M40 30 Q50 10 70 30" />
          </svg>
        </div>
        <p className="font-serif italic text-lg mb-2">Belum ada catatan nih, bro.</p>
        <p className="text-sm">Mulai catat pengeluaran pertama lo di tab Log!</p>
      </div>
    );
  }

  const getIcon = (category: string) => {
    switch (category) {
      case 'Investasi': return <TrendingDown className="w-5 h-5 text-rk-gold" />;
      case 'Keinginan': return <Coffee className="w-5 h-5 text-rk-red" />;
      default: return <ShoppingBag className="w-5 h-5 text-rk-brown" />;
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingId(expense.id);
    setEditAmount(expense.amount.toString());
    setEditText(expense.text);
  };

  const handleSaveEdit = (id: string) => {
    if (onUpdateExpense) {
      onUpdateExpense(id, {
        amount: parseInt(editAmount) || 0,
        text: editText || 'Tanpa Nama'
      });
    }
    setEditingId(null);
  };

  return (
    <div className="px-4 md:px-0 pb-24 md:pb-4">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h3 className="text-sm font-semibold tracking-wide text-rk-brown/80 uppercase">Terbaru</h3>
        <div className="relative w-48 md:w-56 lg:w-64">
          <Search className="w-4 h-4 text-rk-brown/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-rk-brown/10 rounded-full py-2 pl-9 pr-4 text-xs text-rk-brown focus:outline-none focus:border-rk-gold focus:ring-1 focus:ring-rk-gold/20 transition-all shadow-[0_2px_8px_rgba(62,39,35,0.02)] placeholder:text-rk-brown/30"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 md:mt-2">
        {filteredExpenses.length === 0 && searchQuery && (
           <div className="text-center py-8 text-rk-brown/50 text-sm">
             Nggak nemu pengeluaran buat "{searchQuery}"
           </div>
        )}
        <AnimatePresence>
          {filteredExpenses.map((expense, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              key={expense.id} 
              className="flex flex-col p-4 bg-white rounded-2xl shadow-[0_2px_10px_rgba(62,39,35,0.04)] hover:shadow-[0_4px_16px_rgba(62,39,35,0.06)] relative transition-shadow duration-200"
            >
              {editingId === expense.id ? (
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    value={editText} 
                    onChange={e => setEditText(e.target.value)} 
                    className="w-full text-sm font-medium text-rk-brown border-b border-rk-brown/20 focus:border-rk-gold outline-none pb-1 bg-transparent"
                    placeholder="Nama pengeluaran"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-rk-brown/60">Rp</span>
                    <input 
                      type="number" 
                      value={editAmount} 
                      onChange={e => setEditAmount(e.target.value)} 
                      className="flex-1 text-sm font-semibold text-rk-brown border-b border-rk-brown/20 focus:border-rk-gold outline-none pb-1 bg-transparent"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-rk-brown/40 hover:bg-rk-brown/5 rounded-md"><X className="w-4 h-4" /></button>
                    <button onClick={() => handleSaveEdit(expense.id)} className="p-1.5 text-rk-green hover:bg-rk-green/10 rounded-md"><Check className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-rk-cream-dark p-2 rounded-xl relative">
                       {getIcon(expense.category)}
                       {expense.mood && (
                         <span className="absolute -bottom-1 -right-1 text-xs">{expense.mood}</span>
                       )}
                    </div>
                    <div>
                      <p className="font-medium text-rk-brown text-[15px]">{expense.text}</p>
                      <p className="text-xs text-rk-brown/60 mt-0.5">{expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-semibold text-rk-brown">{formatRupiah(expense.amount)}</p>
                    
                    {lastAddedId === expense.id && onUndo ? (
                      <button 
                        onClick={onUndo}
                        className="flex items-center gap-1 text-[10px] font-medium text-rk-amber mt-1 bg-rk-amber/10 px-2 py-0.5 rounded-full hover:bg-rk-amber/20 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Batalkan
                      </button>
                    ) : (
                      <p className="text-[10px] text-rk-brown/40 mt-1">
                        {new Date(expense.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Actions row: reveal slightly on hover or click */}
              {editingId !== expense.id && (
                <div className="flex justify-end gap-3 mt-3 border-t border-rk-brown/5 pt-3">
                   <button onClick={() => handleEditClick(expense)} className="text-[11px] font-medium flex items-center gap-1 text-rk-brown/50 hover:text-rk-gold transition-colors">
                     <Edit2 className="w-3 h-3" /> Edit
                   </button>
                   <button onClick={() => onDeleteExpense && window.confirm('Beneran mau hapus pengeluaran ini?') && onDeleteExpense(expense.id)} className="text-[11px] font-medium flex items-center gap-1 text-rk-brown/50 hover:text-rk-red transition-colors">
                     <Trash2 className="w-3 h-3" /> Hapus
                   </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
