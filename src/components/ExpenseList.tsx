import { useState } from 'react';
import { formatRupiah } from '../utils/helpers';
import { Expense } from '../utils/storage';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, TrendingDown, ShoppingBag, RotateCcw, Edit2, Trash2, Check, X, Search, Car, Utensils, Mic2, Tv, CreditCard, Zap, Heart, BookOpen, GraduationCap, Plane, Home, Smartphone, HelpCircle, Dumbbell, Tag, Wallet, Banknote } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  lastAddedId?: string | null;
  onUndo?: () => void;
  onDeleteExpense?: (id: string) => void;
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => void;
}

export default function ExpenseList({ expenses, lastAddedId, onUndo, onDeleteExpense, onUpdateExpense }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = expenses.filter(expense => 
    (expense.text || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (expense.category || '').toLowerCase().includes(searchQuery.toLowerCase())
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
        <p className="font-serif italic text-lg mb-2">Belum ada catatan nih, mulai catat yuk.</p>
        <p className="text-sm">Mulai catat pengeluaran pertama lo di tab Log!</p>
      </div>
    );
  }

  const getIcon = (category: string, text: string) => {
    const lowerText = (text || '').toLowerCase();
    const lowerCategory = (category || '').toLowerCase();

    // Text-based overrides
    if (lowerText.includes('makan') || lowerText.includes('nasi') || lowerText.includes('ayam') || lowerText.includes('kopi') || lowerText.includes('minum')) return <Utensils className="w-5 h-5 text-orange-500" />;
    if (lowerText.includes('bensin') || lowerText.includes('gojek') || lowerText.includes('grab') || lowerText.includes('parkir') || lowerText.includes('tiket') || lowerCategory.includes('transport')) return <Car className="w-5 h-5 text-blue-500" />;
    if (lowerText.includes('konser') || lowerText.includes('musik') || lowerText.includes('nonton') || lowerText.includes('bioskop') || lowerText.includes('mic')) return <Mic2 className="w-5 h-5 text-purple-500" />;
    if (lowerText.includes('netflix') || lowerText.includes('youtube') || lowerText.includes('spotify') || lowerText.includes('langganan') || lowerText.includes('sub')) return <Tv className="w-5 h-5 text-red-500" />;
    if (lowerText.includes('pulsa') || lowerText.includes('kuota') || lowerText.includes('internet') || lowerText.includes('hp')) return <Smartphone className="w-5 h-5 text-cyan-500" />;
    if (lowerText.includes('listrik') || lowerText.includes('air') || lowerText.includes('token')) return <Zap className="w-5 h-5 text-yellow-500" />;
    if (lowerText.includes('kos') || lowerText.includes('rumah') || lowerText.includes('belanja bulanan')) return <Home className="w-5 h-5 text-emerald-500" />;
    if (lowerText.includes('obat') || lowerText.includes('rs') || lowerText.includes('dokter') || lowerText.includes('sehat')) return <Heart className="w-5 h-5 text-rose-500" />;
    if (lowerText.includes('buku') || lowerText.includes('kuliah') || lowerText.includes('sekolah') || lowerText.includes('kursus')) return <GraduationCap className="w-5 h-5 text-indigo-500" />;
    if (lowerText.includes('jalan') || lowerText.includes('trip') || lowerText.includes('liburan') || lowerText.includes('pesawat')) return <Plane className="w-5 h-5 text-teal-500" />;
    if (lowerText.includes('gym') || lowerText.includes('fitness') || lowerText.includes('workout')) return <Dumbbell className="w-5 h-5 text-neutral-500" />;
    if (lowerText.includes('baju') || lowerText.includes('belanja') || lowerText.includes('tas')) return <Tag className="w-5 h-5 text-pink-500" />;
    if (lowerText.includes('emas') || lowerText.includes('saham') || lowerText.includes('invest') || lowerText.includes('transfer')) return <Wallet className="w-5 h-5 text-green-600" />;

    // Category fallbacks
    switch (category) {
      case 'Makanan & Minuman': return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'Transportasi': return <Car className="w-5 h-5 text-blue-500" />;
      case 'Hiburan': return <Mic2 className="w-5 h-5 text-purple-500" />;
      case 'Belanja & Fashion': return <Tag className="w-5 h-5 text-pink-500" />;
      case 'Kesehatan & Kebutuhan Pokok': return <Heart className="w-5 h-5 text-rose-500" />;
      case 'Keuangan & Investasi': return <Wallet className="w-5 h-5 text-green-600" />;
      case 'Pendidikan': return <GraduationCap className="w-5 h-5 text-indigo-500" />;
      case 'Olahraga & Kebugaran': return <Dumbbell className="w-5 h-5 text-neutral-500" />;
      case 'Pulsa, Tagihan & Topup Digital': return <Smartphone className="w-5 h-5 text-cyan-500" />;
      
      // old categories fallback
      case 'Investasi': return <TrendingDown className="w-5 h-5 text-rk-gold" />;
      case 'Makanan': return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'Transport': return <Car className="w-5 h-5 text-blue-500" />;
      case 'Keinginan': return <Coffee className="w-5 h-5 text-rk-red" />;
      case 'Kebutuhan': return <ShoppingBag className="w-5 h-5 text-rk-brown" />;
      default: return <HelpCircle className="w-5 h-5 text-rk-brown/40" />;
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
            id="expense-search-input"
            name="expenseSearch"
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
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5, delay: i * 0.03 }}
              key={expense.id} 
              className="flex flex-col h-full p-4 bg-white rounded-2xl shadow-[0_2px_10px_rgba(62,39,35,0.04)] hover:shadow-[0_4px_16px_rgba(62,39,35,0.06)] relative transition-shadow duration-200"
            >
              {editingId === expense.id ? (
                <div className="flex flex-col gap-3">
                  <input 
                    id={`expense-edit-name-input-${expense.id}`}
                    name="expenseEditName"
                    type="text" 
                    value={editText} 
                    onChange={e => setEditText(e.target.value)} 
                    className="w-full text-sm font-medium text-rk-brown border-b border-rk-brown/20 focus:border-rk-gold outline-none pb-1 bg-transparent"
                    placeholder="Nama pengeluaran"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-rk-brown/60">Rp</span>
                    <input 
                      id={`expense-edit-amount-input-${expense.id}`}
                      name="expenseEditAmount"
                      type="number" 
                      value={editAmount} 
                      onChange={e => setEditAmount(e.target.value)} 
                      className="flex-1 text-sm font-semibold text-rk-brown border-b border-rk-brown/20 focus:border-rk-gold outline-none pb-1 bg-transparent"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <button onClick={() => setEditingId(null)} className="cursor-pointer p-1.5 text-rk-brown/40 hover:bg-rk-brown/5 rounded-md"><X className="w-4 h-4" /></button>
                    <button onClick={() => handleSaveEdit(expense.id)} className="cursor-pointer p-1.5 text-rk-green hover:bg-rk-green/10 rounded-md"><Check className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : confirmDeleteId === expense.id ? (
                <div className="flex flex-col items-center justify-center gap-3 py-3">
                   <p className="text-sm font-medium text-rk-brown/80 mb-2">Yakin mau hapus pengeluaran ini?</p>
                   <div className="flex items-center gap-3 w-full">
                     <button onClick={() => setConfirmDeleteId(null)} className="cursor-pointer flex-1 py-2 rounded-xl text-xs font-semibold text-rk-brown/60 hover:bg-rk-brown/5 border border-rk-brown/10 transition-colors">
                       Batal
                     </button>
                     <button onClick={() => { setConfirmDeleteId(null); onDeleteExpense && onDeleteExpense(expense.id); }} className="cursor-pointer flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-rk-red hover:bg-rk-red/90 shadow-sm transition-colors">
                       Ya, Hapus
                     </button>
                   </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2 flex-1 mb-3">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="bg-rk-cream-dark p-2 rounded-xl relative shrink-0">
                       {getIcon(expense.category, expense.text)}
                       {expense.mood && (
                         <span className="absolute -bottom-1 -right-1 text-xs">{expense.mood}</span>
                       )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                         <p className="font-medium text-rk-brown text-[15px] truncate">{expense.text}</p>
                         {expense.splitBillId && (
                           <span className="text-[9px] bg-rk-gold text-white px-1.5 py-0.5 rounded-sm font-semibold tracking-wide uppercase shrink-0">
                             Patungan
                           </span>
                         )}
                      </div>
                      <p className="text-xs text-rk-brown/60 mt-0.5 truncate">{expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <p className="font-semibold text-rk-brown">{formatRupiah(expense.amount)}</p>
                    
                    {lastAddedId === expense.id && onUndo ? (
                      <button 
                        onClick={onUndo}
                        className="cursor-pointer flex items-center gap-1 text-[10px] font-medium text-rk-amber mt-1 bg-rk-amber/10 px-2 py-0.5 rounded-full hover:bg-rk-amber/20 transition-colors"
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
              {editingId !== expense.id && confirmDeleteId !== expense.id && (
                <div className="flex justify-end gap-3 mt-auto border-t border-rk-brown/5 pt-3">
                   <button onClick={() => handleEditClick(expense)} className="cursor-pointer text-[11px] font-medium flex items-center gap-1 text-rk-brown/50 hover:text-rk-gold transition-colors">
                     <Edit2 className="w-3 h-3" /> Edit
                   </button>
                   <button onClick={() => setConfirmDeleteId(expense.id)} className="cursor-pointer text-[11px] font-medium flex items-center gap-1 text-rk-brown/50 hover:text-rk-red transition-colors">
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
