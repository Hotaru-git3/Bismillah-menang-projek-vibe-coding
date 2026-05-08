import React from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import DoublePieChart from './DoublePieChart';
import { Expense } from '../utils/storage';

export default function MoodChartCard({ expenses }: { expenses: Expense[] }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rk-brown/5 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-6">
        <h3 className="font-serif text-lg text-rk-brown font-medium">Emosi & Pengeluaran</h3>
        <div className="p-2 bg-rk-brown/5 rounded-full">
          <PieChartIcon className="w-4 h-4 text-rk-brown" />
        </div>
      </div>
      
      <DoublePieChart expenses={expenses} />
    </div>
  );
}
