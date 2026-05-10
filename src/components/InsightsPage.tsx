import React, { useState } from 'react';
import { Flame, Bookmark } from 'lucide-react';
import { Expense, UserProfile } from '../utils/storage';

import WeeklySummaryCard from './WeeklySummaryCard';
import MoodChartCard from './MoodChartCard';
import RecurringCard from './RecurringCard';
import SplitBillsCard from './SplitBillsCard';
import MicroLessonCard from './MicroLessonCard';
import ProjectionCard from './ProjectionCard';
import RoastCard from './RoastCard';
import SavedItemsSidebar from './SavedItemsSidebar';

interface InsightsProps {
  expenses: Expense[];
  profile: UserProfile;
  onBadgesUpdate: (badges: string[]) => void;
  onShowToast: (msg: string) => void;
}

export default function InsightsPage({ expenses, profile, onBadgesUpdate, onShowToast }: InsightsProps) {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'proyeksi' | 'roast'>('ringkasan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="w-full pt-2 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h2 className="text-2xl md:text-3xl font-serif text-rk-brown mb-1">Insights</h2>
           <p className="text-sm text-rk-brown/60">Pahami kemana duit lo ngalir.</p>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="cursor-pointer p-2.5 bg-rk-brown/5 hover:bg-rk-brown/10 text-rk-brown rounded-full transition-colors relative" title="Arsip AI">
           <Bookmark className="w-5 h-5" />
           {((profile.savedSummaries?.length || 0) + (profile.savedRecurring?.length || 0)) > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white"></span>
           )}
        </button>
      </div>
      <div className="flex gap-4 border-b border-rk-brown/10 mb-8 overflow-x-auto no-scrollbar">
         <button onClick={() => setActiveTab('ringkasan')} className={`cursor-pointer pb-2 text-sm font-medium transition-colors shrink-0 ${activeTab === 'ringkasan' ? 'border-b-2 border-rk-brown text-rk-brown' : 'text-rk-brown/50'}`}>Ringkasan</button>
         <button onClick={() => setActiveTab('proyeksi')} className={`cursor-pointer pb-2 text-sm font-medium transition-colors shrink-0 ${activeTab === 'proyeksi' ? 'border-b-2 border-rk-brown text-rk-brown' : 'text-rk-brown/50'}`}>Proyeksi</button>
         <button onClick={() => setActiveTab('roast')} className={`cursor-pointer pb-2 text-sm font-medium transition-colors shrink-0 flex items-center gap-1 ${activeTab === 'roast' ? 'border-b-2 border-red-500 text-red-500' : 'text-rk-brown/50'}`}><Flame className="w-3.5 h-3.5"/> AI Roast</button>
      </div>
      {activeTab === 'ringkasan' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          <WeeklySummaryCard expenses={expenses} profile={profile} onShowToast={onShowToast} />
          
          <div className="space-y-5 md:space-y-6">
            <MoodChartCard expenses={expenses} />
            <RecurringCard expenses={expenses} profile={profile} onShowToast={onShowToast} />
          </div>

          <SplitBillsCard />
          
          <MicroLessonCard 
            expenses={expenses} 
            profile={profile} 
            onBadgesUpdate={onBadgesUpdate}
            onShowToast={onShowToast}
          />
        </div>
      ) : activeTab === 'proyeksi' ? (
        <ProjectionCard expenses={expenses} profile={profile} onShowToast={onShowToast} />
      ) : activeTab === 'roast' ? (
        <RoastCard expenses={expenses} profile={profile} onShowToast={onShowToast} />
      ) : null}
      <SavedItemsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        profile={profile} 
      />
    </div>
  );
}
