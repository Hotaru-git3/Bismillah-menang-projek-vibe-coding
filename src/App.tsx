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
import { Settings, Share2, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type Tab = 'dashboard' | 'log' | 'insights' | 'settings';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // Undo/Edit states
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
    
    // Hide undo button after 5 seconds if not clicked
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
      // Show toast
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
    <div className="min-h-screen bg-rk-cream sm:bg-[#DED5C9] sm:py-8 flex justify-center items-center">
      <div className="flex flex-col w-full min-h-screen sm:min-h-0 sm:h-[850px] max-w-[480px] mx-auto bg-rk-cream relative sm:rounded-[2.5rem] sm:shadow-2xl overflow-hidden ring-1 ring-rk-brown/5">
        {/* Header */}
        <div className="px-6 py-6 pt-10 sticky top-0 z-10 bg-rk-cream/90 backdrop-blur-md flex justify-between items-center">
        <h1 className="text-2xl font-serif text-rk-brown">Halo, {profile.name}.</h1>
      </div>

      <AnimatePresence>
        {showUndoToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-rk-amber text-rk-brown px-4 py-2 rounded-full font-medium text-sm shadow-md border border-rk-gold"
          >
            Entri tadi udah dihapus, bro.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative scroll-smooth" id="scroll-container">
        {activeTab === 'dashboard' && (
          <div className="w-full pt-2 pb-24">
            <BudgetWarning 
              expenses={expenses} 
              monthlyBudget={profile.monthlyBudget} 
              onGoToInsights={() => setActiveTab('insights')}
            />
            <DashboardCard expenses={expenses} monthlyBudget={profile.monthlyBudget} />
            <SavingsChallengeCard expenses={expenses} />
            <ExpenseList 
              expenses={expenses} 
              lastAddedId={lastAddedExpenseId}
              onUndo={handleUndo}
              onDeleteExpense={handleDeleteExpense}
              onUpdateExpense={handleUpdateExpense}
            />
          </div>
        )}

        {activeTab === 'log' && (
          <div className="flex flex-col pt-2 px-4 pb-24 min-h-full">
            <h2 className="text-xl font-serif text-rk-brown mb-4 pl-2">Catat dulu bro</h2>
            <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
              <div className="w-full h-48 bg-white/50 rounded-3xl mb-8 flex items-center justify-center">
                 <img src="https://api.dicebear.com/7.x/notionists/svg?seed=wallet&backgroundColor=transparent" alt="wallet" className="w-32 h-32 opacity-80 mix-blend-multiply" />
              </div>
              <InputBar 
                 onExpenseAdded={handleExpenseAdded} 
                 onSetMood={handleSetMood}
              />
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <InsightsPage expenses={expenses} profile={profile} onBadgesUpdate={(badges) => {
            const newProfile = { ...profile, badges };
            setProfile(newProfile);
          }} />
        )}

        {activeTab === 'settings' && (
          <div className="pt-2 px-6 pb-24">
            <h2 className="text-2xl font-serif text-rk-brown mb-6">Pengaturan</h2>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-rk-brown/5 flex flex-col gap-4">
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
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
}
