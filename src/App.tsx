import { useState, useEffect } from 'react';
import { UserProfile, Expense, getProfile, saveProfile, getExpenses, updateExpense, deleteExpense } from './utils/storage';
import OnboardingFlow from './components/OnboardingFlow';
import DashboardCard from './components/DashboardCard';
import BudgetWarning from './components/BudgetWarning';
import ExpenseList from './components/ExpenseList';
import BottomNav from './components/BottomNav';
import InputBar from './components/InputBar';
import InsightsPage from './components/InsightsPage';
import SavingsChallengeCard from './components/SavingsChallengeCard';
import { Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type Tab = 'dashboard' | 'log' | 'insights' | 'settings';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  const [lastAddedExpenseId, setLastAddedExpenseId] = useState<string | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  useEffect(() => {
    const loadedProfile = getProfile();
    if (loadedProfile) setProfile(loadedProfile);
    
    setExpenses(getExpenses());
    setIsLoading(false);
  }, []);

  const handleExpenseAdded = (expense: Expense) => {
    setExpenses(getExpenses());
    setLastAddedExpenseId(expense.id);
    
    setTimeout(() => {
      setLastAddedExpenseId(null);
    }, 5000);
  };

  const handleSetMood = (expenseId: string, mood: string) => {
    updateExpense(expenseId, { mood });
    setExpenses(getExpenses());
  };
  
  const handleUndo = () => {
    if (lastAddedExpenseId) {
      deleteExpense(lastAddedExpenseId);
      setExpenses(getExpenses());
      setLastAddedExpenseId(null);
      setShowUndoToast(true);
      setTimeout(() => setShowUndoToast(false), 2000);
    }
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    setExpenses(getExpenses());
  };

  const handleUpdateExpense = (id: string, updates: Partial<Expense>) => {
    updateExpense(id, updates);
    setExpenses(getExpenses());
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setActiveTab('dashboard');
  };

  const handleExportData = async () => {
    const reportText = `Laporan RupiahKu - ${profile?.name}\n\n` +
      expenses.map(e => `${new Date(e.date).toLocaleDateString('id-ID')} - ${e.text}: Rp ${e.amount.toLocaleString('id-ID')} (${e.category})`).join('\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Laporan Pengeluaran RupiahKu',
          text: reportText,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(reportText);
      alert('Laporan udah siap di-copy, bro!');
    }
  };

  if (isLoading) return null; 

  if (!profile) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="h-screen bg-rk-cream flex overflow-hidden">
      {/* SIDEBAR DESKTOP */}
      <div className="hidden md:flex flex-col w-64 lg:w-72 bg-[#FFFDF8] border-r border-rk-brown/5 p-5 lg:p-6 justify-between shrink-0">
        <div>
          <div className="mb-10 flex items-center gap-2 text-rk-brown">
            <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight">RupiahKu.</h1>
          </div>
          <nav className="flex flex-col gap-1">
             {(['dashboard', 'log', 'insights', 'settings'] as Tab[]).map((tab) => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${activeTab === tab ? 'bg-rk-brown text-rk-cream shadow-md' : 'text-rk-brown/60 hover:bg-rk-brown/5 hover:text-rk-brown'}`}
               >
                 <span className="capitalize text-sm lg:text-[15px]">{tab}</span>
               </button>
             ))}
          </nav>
        </div>
        <div>
          <div className="p-4 bg-white rounded-2xl border border-rk-brown/10 shadow-sm">
             <p className="text-[10px] font-bold text-rk-brown/40 uppercase tracking-widest mb-1">Limit Bulanan</p>
             <p className="font-bold text-rk-brown text-lg">Rp {(profile.monthlyBudget / 1000).toLocaleString('id-ID')}k</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden px-5 py-5 pt-8 sticky top-0 z-10 bg-rk-cream/90 backdrop-blur-md flex justify-between items-center w-full shrink-0">
          <h1 className="text-2xl font-serif text-rk-brown">Halo, {profile.name}.</h1>
        </div>

        <AnimatePresence>
          {showUndoToast && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="absolute top-20 md:top-6 left-1/2 z-[100] bg-rk-amber text-rk-brown px-4 py-2 rounded-full font-medium text-sm shadow-md border border-rk-gold whitespace-nowrap"
            >
              Entri tadi udah dihapus, bro.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth w-full" id="scroll-container">
          <div className="w-full max-w-6xl mx-auto px-4 md:px-8 lg:px-10 pb-20 md:pb-8">
            {/* Desktop Header */}
            <div className="hidden md:flex py-6 lg:py-8 justify-between items-end w-full">
               <div>
                  <h1 className="text-2xl lg:text-3xl font-serif text-rk-brown">Halo, {profile.name}.</h1>
                  <p className="text-rk-brown/60 text-sm mt-1">Gimana dompet hari ini?</p>
               </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full pt-2"
                >
                <BudgetWarning 
                  expenses={expenses} 
                  monthlyBudget={profile.monthlyBudget} 
                  onGoToInsights={() => setActiveTab('insights')}
                />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                  <div className="xl:col-span-2">
                    <DashboardCard expenses={expenses} monthlyBudget={profile.monthlyBudget} />
                  </div>
                  <div className="xl:col-span-1">
                    <SavingsChallengeCard expenses={expenses} />
                  </div>
                </div>
                <ExpenseList 
                  expenses={expenses} 
                  lastAddedId={lastAddedExpenseId}
                  onUndo={handleUndo}
                  onDeleteExpense={handleDeleteExpense}
                  onUpdateExpense={handleUpdateExpense}
                />
              </motion.div>
            )}

            {activeTab === 'log' && (
              <motion.div 
                key="log"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col pt-2 h-full"
              >
                <div className="flex-1 flex flex-col justify-center max-w-[600px] w-full mx-auto md:mt-4">
                  <div className="w-full h-40 md:h-56 bg-white/50 rounded-3xl mb-6 flex flex-col items-center justify-center border border-white">
                     <img src="https://api.dicebear.com/7.x/notionists/svg?seed=wallet&backgroundColor=transparent" alt="wallet" className="w-24 md:w-32 h-24 md:h-32 opacity-80 mix-blend-multiply mb-2" />
                     <h2 className="text-xl md:text-2xl font-serif text-rk-brown text-center">Catat dulu bro</h2>
                  </div>
                  <div className="md:bg-white md:p-6 lg:p-8 md:rounded-3xl md:shadow-[0_4px_24px_rgba(62,39,35,0.04)] md:border md:border-rk-brown/5 flex flex-col">
                    <InputBar 
                       onExpenseAdded={handleExpenseAdded} 
                       onSetMood={handleSetMood}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'insights' && (
              <motion.div 
                key="insights"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <InsightsPage expenses={expenses} profile={profile} onBadgesUpdate={(badges) => {
                  const newProfile = { ...profile, badges };
                  setProfile(newProfile);
                }} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="pt-2 h-full"
              >
                <h2 className="text-2xl font-serif text-rk-brown mb-6 md:hidden">Pengaturan</h2>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-rk-brown/5 flex flex-col gap-4 max-w-[600px] mx-auto md:mt-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-rk-brown/50 tracking-wider">Profil</p>
                    <p className="text-lg font-medium text-rk-brown">{profile.name}</p>
                  </div>
                  <div>
                     <div className="flex justify-between items-center">
                       <p className="text-xs font-semibold uppercase text-rk-brown/50 tracking-wider">Limit Bulanan</p>
                       {!isEditingBudget ? (
                         <button onClick={() => { setIsEditingBudget(true); setBudgetInput(profile.monthlyBudget.toString()); }} className="text-xs font-medium text-rk-amber hover:text-rk-amber-light underline">Edit</button>
                       ) : (
                         <button onClick={() => {
                           const newBudget = parseInt(budgetInput) || profile.monthlyBudget;
                           const newProfile = { ...profile, monthlyBudget: newBudget };
                           saveProfile(newProfile);
                           setProfile(newProfile);
                           setIsEditingBudget(false);
                         }} className="text-xs font-medium text-rk-gold underline">Simpan</button>
                       )}
                     </div>
                     {!isEditingBudget ? (
                       <p className="text-lg font-medium text-rk-brown">Rp {profile.monthlyBudget.toLocaleString('id-ID')}</p>
                     ) : (
                       <div className="mt-2 flex items-center gap-2">
                         <span className="text-sm font-medium text-rk-brown/80">Rp</span>
                         <input
                           type="number"
                           value={budgetInput}
                           onChange={e => setBudgetInput(e.target.value)}
                           className="flex-1 bg-rk-cream/50 border border-rk-brown/10 rounded-lg px-3 py-1.5 text-sm text-rk-brown outline-none focus:border-rk-gold/50"
                         />
                       </div>
                     )}
                  </div>
                  
                  <hr className="border-rk-brown/10 my-2" />
                  
                  <button 
                    onClick={handleExportData}
                    className="w-full flex items-center justify-center gap-2 text-rk-brown bg-rk-cream-dark/50 py-3 rounded-xl font-medium active:bg-rk-cream-dark transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Ekspor Laporan
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Yakin mau reset semua data?')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="mt-2 w-full text-center text-rk-red text-sm font-medium py-3 rounded-xl hover:bg-rk-red/5 active:bg-rk-red/10 transition-colors"
                  >
                    Reset Semua Data
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

        <div className="md:hidden shrink-0">
          <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}