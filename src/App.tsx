import { useState, useEffect } from 'react';
import { UserProfile, Expense } from './utils/storage';
import { syncUserProfile, addExpenseToFirestore, updateExpenseInFirestore, deleteExpenseFromFirestore } from './utils/firebaseUtils';
import { useFirebase } from './components/FirebaseProvider';
import OnboardingFlow from './components/OnboardingFlow';
import DashboardCard from './components/DashboardCard';
import BudgetWarning from './components/BudgetWarning';
import ExpenseList from './components/ExpenseList';
import BottomNav from './components/BottomNav';
import InputBar from './components/InputBar';
import InsightsPage from './components/InsightsPage';
import SavingsChallengeCard from './components/SavingsChallengeCard';
import ProfileDropdown from './components/ProfileDropdown';
import ProfileModal from './components/ProfileModal';
import { Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AuthForm from './components/AuthForm';
import SettingsPage from './components/SettingsPage';
import WeeklySummaryCard from './components/WeeklySummaryCard';

type Tab = 'dashboard' | 'log' | 'insights' | 'settings';

export default function App() {
  const { user, profile, expenses, loading, refreshProfile } = useFirebase();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  const [lastAddedExpenseId, setLastAddedExpenseId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleShowToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExpenseAdded = async (expense: Expense) => {
    await addExpenseToFirestore({
      id: expense.id,
      amount: expense.amount,
      text: expense.text,
      category: expense.category,
      date: expense.date,
      mood: expense.mood,
      splitBillId: expense.splitBillId
    });
    setLastAddedExpenseId(expense.id);
    setTimeout(() => {
      setLastAddedExpenseId(null);
    }, 5000);
  };

  const handleSetMood = async (expenseId: string, mood: string) => {
    await updateExpenseInFirestore(expenseId, { mood });
  };
  
  const handleUndo = async () => {
    if (lastAddedExpenseId) {
      await deleteExpenseFromFirestore(lastAddedExpenseId);
      setLastAddedExpenseId(null);
      handleShowToast('Entri tadi udah dihapus.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpenseFromFirestore(id);
  };

  const handleUpdateExpense = async (id: string, updates: Partial<Expense>) => {
    await updateExpenseInFirestore(id, updates);
  };

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    await syncUserProfile(newProfile);
    await refreshProfile();
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="h-screen bg-rk-cream flex flex-col items-center justify-center">
         <motion.div 
           animate={{ scale: [1, 1.1, 1], y: [0, -10, 0] }} 
           transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
           className="w-16 h-16 bg-rk-brown/10 rounded-3xl mb-4 flex items-center justify-center shadow-inner"
         >
           <Wallet className="w-8 h-8 text-rk-brown/60" />
         </motion.div>
         <p className="text-rk-brown/60 font-medium font-serif animate-pulse">Lagi ngebuka dompet lo...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-[#F5EFE6] flex items-center justify-center p-4 sm:p-6 text-center antialiased relative overflow-hidden">
         {/* Background Ornaments */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <svg className="absolute opacity-[0.03] w-full h-full" xmlns="http://www.w3.org/2000/svg">
             <filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch"/></filter>
             <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
           </svg>
           <motion.div 
             animate={{ y: [0, -30, 0], scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
             transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
             className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-rk-gold/10 blur-[80px] rounded-full"
           />
           <motion.div 
             animate={{ x: [0, 20, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
             transition={{ repeat: Infinity, duration: 20, ease: "easeInOut", delay: 2 }}
             className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rk-brown/5 blur-[100px] rounded-full"
           />
         </div>
         <AuthForm />
      </div>
    );
  }

  if (!profile) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="h-screen bg-rk-cream flex overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 md:top-6 left-1/2 z-[100] bg-gray-900 text-white px-5 py-3 rounded-full font-medium text-sm shadow-xl whitespace-nowrap"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR DESKTOP */}
      <div className="hidden md:flex flex-col w-64 lg:w-72 bg-[#FFFDF8] border-r border-rk-brown/5 p-5 lg:p-6 justify-between shrink-0 z-20">
        <div>
          <div className="mb-10 flex items-center gap-2 text-rk-brown">
            <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight">RupiahKu.</h1>
          </div>
          <nav className="flex flex-col gap-1">
             {(['dashboard', 'log', 'insights', 'settings'] as Tab[]).map((tab) => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer ${activeTab === tab ? 'bg-rk-brown text-rk-cream shadow-md' : 'text-rk-brown/60 hover:bg-rk-brown/5 hover:text-rk-brown'}`}
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden px-5 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] sticky top-0 z-20 bg-rk-cream/90 backdrop-blur-md flex justify-between items-center w-full shrink-0">
          <h1 className="text-2xl font-serif text-rk-brown">Halo, {profile.name}.</h1>
          <ProfileDropdown onNavigate={setActiveTab} onOpenProfile={() => setShowProfileModal(true)} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth w-full" id="scroll-container">
          <div className="w-full max-w-6xl mx-auto px-4 md:px-8 lg:px-10 pb-20 md:pb-8">
            {/* Desktop Header */}
            <div className="hidden md:flex py-6 lg:py-8 justify-between items-end w-full">
               <div>
                  <h1 className="text-2xl lg:text-3xl font-serif text-rk-brown">Halo, {profile.name}.</h1>
                  <p className="text-rk-brown/60 text-sm mt-1">Gimana dompet hari ini?</p>
               </div>
               <ProfileDropdown onNavigate={setActiveTab} onOpenProfile={() => setShowProfileModal(true)} />
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
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
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
                className="flex flex-col pt-2 h-full"
              >
                <div className="flex-1 flex flex-col justify-center max-w-[600px] w-full mx-auto md:mt-4">
                  <div className="w-full h-40 md:h-48 bg-rk-brown/5 rounded-3xl mb-6 flex flex-col items-center justify-center border border-white relative overflow-hidden">
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                       <Wallet className="w-8 h-8 text-rk-brown/80" />
                     </div>
                     <h2 className="text-xl md:text-2xl font-serif text-rk-brown text-center mx-4">Catat dulu yuk</h2>
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
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
              >
                <InsightsPage 
                   expenses={expenses} 
                   profile={profile} 
                   onBadgesUpdate={async (badges) => {
                     const newProfile = { ...profile, badges };
                     await syncUserProfile(newProfile);
                     await refreshProfile();
                   }}
                   onShowToast={handleShowToast}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
                className="pt-2 h-full"
              >
                <SettingsPage 
                  profile={profile} 
                  expenses={expenses} 
                  onDeleteAllExpenses={async () => {
                    for (const exp of expenses) {
                      await handleDeleteExpense(exp.id);
                    }
                    handleShowToast('Semua catatan berhasil dihapus.');
                  }}
                />
              </motion.div>
            )}
           </AnimatePresence>
          </div>
        </div>

        <div className="md:hidden shrink-0 z-20">
          <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>
      
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}