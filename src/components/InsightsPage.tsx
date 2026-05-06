import { useState, useEffect } from 'react';
import { Expense, UserProfile, saveProfile, getSplitBills, SplitBill } from '../utils/storage';
import { generateWeeklySummary, detectRecurringExpense, generateMicroLesson, generateProyeksi } from '../services/geminiService';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, BookOpen, Clock, Target, Medal, CheckCircle2, Users, Copy, Rocket } from 'lucide-react';

import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';

interface InsightsProps {
  expenses: Expense[];
  profile: UserProfile;
  onBadgesUpdate: (badges: string[]) => void;
}

export default function InsightsPage({ expenses, profile, onBadgesUpdate }: InsightsProps) {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'proyeksi'>('ringkasan');
  const [summary, setSummary] = useState<{ summary: string, topCategories: string[], tip: string } | null>(null);
  const [recurring, setRecurring] = useState<{ detected: boolean, text: string, projection6Months: number } | null>(null);
  const [lesson, setLesson] = useState<{ title: string, content: string, question: string, correctAnswer: string, options: string[] } | null>(null);
  const [splitBills, setSplitBills] = useState<SplitBill[]>([]);
  const [proyeksi, setProyeksi] = useState<any>(null);
  
  const [isGeneratingSum, setIsGeneratingSum] = useState(false);
  const [isGeneratingRec, setIsGeneratingRec] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [isGeneratingProyeksi, setIsGeneratingProyeksi] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState<string | null>(null);

  useEffect(() => {
    setSplitBills(getSplitBills());
  }, []);

  const getMoodChartData = () => {
    const moodTotals: Record<string, number> = {
      '😊': 0, '🤔': 0, '😐': 0, '😟': 0, '😤': 0
    };
    let hasData = false;
    expenses.forEach(e => {
       if (e.mood && moodTotals[e.mood] !== undefined) {
          moodTotals[e.mood] += e.amount;
          hasData = true;
       }
    });

    if (!hasData) return [];

    return Object.entries(moodTotals).map(([mood, amount]) => ({
      name: mood,
      amount,
      fill: mood === '😊' ? '#22c55e' :
            mood === '🤔' ? '#3b82f6' :
            mood === '😐' ? '#94a3b8' :
            mood === '😟' ? '#eab308' :
            mood === '😤' ? '#ef4444' : '#000'
    })).filter(d => d.amount > 0);
  };

  const loadSummary = async () => {
    if (expenses.length === 0) return;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentExpenses = expenses.filter(e => new Date(e.date) >= sevenDaysAgo);

    setIsGeneratingSum(true);
    try {
      const res = await generateWeeklySummary(recentExpenses.length > 0 ? recentExpenses : expenses.slice(0, 5));
      setSummary(res);
    } catch(err) {
      console.error(err);
    } finally {
      setIsGeneratingSum(false);
    }
  };

  const loadRecurring = async () => {
    if (expenses.length === 0) return;
    setIsGeneratingRec(true);
    try {
      const res = await detectRecurringExpense(expenses);
      setRecurring(res);
    } catch(err) {
      console.error(err);
    } finally {
      setIsGeneratingRec(false);
    }
  };

  const loadLesson = async () => {
    if (expenses.length === 0) return;
    setIsGeneratingLesson(true);
    try {
      const res = await generateMicroLesson(expenses);
      setLesson(res);
      setQuizAnswered(null);
    } catch(err) {
      console.error(err);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleQuizAnswer = (opt: string) => {
    if (quizAnswered) return;
    setQuizAnswered(opt);
    
    if (lesson && opt === lesson.correctAnswer) {
      const newBadges = [...(profile.badges || []), lesson.title];
      onBadgesUpdate(newBadges);
      saveProfile({ ...profile, badges: newBadges });
    }
  };

  const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     alert("Pesan udah dicopy, tinggal paste ke WA!");
  };

  const loadProyeksi = async () => {
    setIsGeneratingProyeksi(true);
    try {
        const res = await generateProyeksi(expenses);
        setProyeksi(res);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGeneratingProyeksi(false);
    }
  };

  const moodChartData = getMoodChartData();

  return (
    <div className="w-full pt-2 pb-24 md:pb-6">
      <div className="mb-6">
         <h2 className="text-2xl md:text-3xl font-serif text-rk-brown mb-1">Insights</h2>
         <p className="text-sm text-rk-brown/60">Pahami kemana duit lo ngalir.</p>
      </div>

      <div className="flex gap-4 border-b border-rk-brown/10 mb-8">
         <button onClick={() => setActiveTab('ringkasan')} className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'ringkasan' ? 'border-b-2 border-rk-brown text-rk-brown' : 'text-rk-brown/50'}`}>Ringkasan</button>
         <button onClick={() => setActiveTab('proyeksi')} className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'proyeksi' ? 'border-b-2 border-rk-brown text-rk-brown' : 'text-rk-brown/50'}`}>Proyeksi</button>
      </div>

      {activeTab === 'ringkasan' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          {/* Week Summary - Full width kiri */}
          <div 
            className="bg-[#FFFDF8] border border-[#E2D5C3] rounded-sm p-5 md:p-6 pl-10 shadow-[2px_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden"
            style={{
               backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(226, 213, 195, 0.5) 28px)',
               backgroundAttachment: 'local'
            }}
          >
            <div className="absolute top-0 bottom-0 left-6 w-[2px] bg-red-400/30" />
            <div className="absolute top-0 right-0 w-8 h-8 shadow-sm" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)', background: '#ebdcc5' }} />
            
            <div className="relative z-10 pt-1">
               <div className="flex items-center gap-2 mb-2 text-rk-brown">
                 <Sparkles className="w-5 h-5 text-rk-amber" />
                 <h3 className="font-hand text-xl md:text-2xl font-bold tracking-wide">Weekly AI Summary</h3>
               </div>

               {summary ? (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                    <p 
                      className="font-hand text-[17px] text-rk-brown/90" 
                      style={{ lineHeight: '28px' }}
                    >
                      {summary.summary}
                    </p>
                    <div className="mt-4 pt-2 border-t border-rk-brown/10 border-dashed">
                      <p className="font-semibold text-rk-brown/80 uppercase tracking-widest text-[10px] mb-2" style={{ lineHeight: 'normal' }}>Top Spending:</p>
                      <ul className="list-disc pl-5 space-y-1 mb-4 font-hand" style={{ lineHeight: '28px' }}>
                        {summary.topCategories.map((c, i) => (
                          <li key={i} className="text-[17px] text-rk-brown/80">{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-2 font-hand text-[17px] text-rk-brown/90" style={{ lineHeight: '28px' }}>
                      <span className="font-bold">Tip:</span> {summary.tip}
                    </div>
                  </motion.div>
               ) : (
                  <div className="text-center py-6 mt-4 relative z-10">
                    <button 
                      onClick={loadSummary} 
                      disabled={isGeneratingSum || expenses.length === 0}
                      className="bg-rk-brown text-rk-cream px-5 py-2.5 rounded-sm shadow-md text-base font-medium hover:bg-rk-brown-light transition-all disabled:opacity-50 transform -rotate-1 hover:rotate-0 font-hand"
                    >
                      {isGeneratingSum ? (
                        <span className="flex items-center justify-center"><motion.span animate={{rotate:360}} transition={{repeat:Infinity, duration:1, ease:'linear'}} className="mr-2 inline-block"><Sparkles className="w-4 h-4"/></motion.span> Menulis catatan...</span>
                      ) : expenses.length === 0 ? "Belum ada catatan" : "Tulis Catatan Minggu Ini"}
                    </button>
                  </div>
               )}
            </div>
          </div>

          {/* Kanan: Mood Chart + Recurring Pattern */}
          <div className="space-y-5 md:space-y-6">
            {/* Mood vs Spending Chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-rk-brown/5">
              <h3 className="font-medium text-rk-brown mb-4 text-sm">Mood vs Pengeluaran</h3>
              {moodChartData.length > 0 ? (
                <div className="h-48 w-full -ml-4">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={moodChartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DAC1" opacity={0.5} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 18 }} />
                       <Tooltip 
                         formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                         cursor={{ fill: '#FAF6EC' }}
                         contentStyle={{ borderRadius: '12px', border: '1px solid rgba(62,39,35,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                         itemStyle={{ color: '#3E2723', fontWeight: 'bold' }}
                       />
                       <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                         {moodChartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-rk-brown/50 text-center py-6">Belum ada data mood, bro. Catat pengeluaran dan pilih mood-nya!</p>
              )}
            </div>

            {/* Recurring Detection */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-rk-brown/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                   <Clock className="w-5 h-5 text-rk-brown/60" />
                   <h3 className="font-medium text-rk-brown text-sm">Pola Berulang</h3>
                </div>
                {!recurring && !isGeneratingRec && expenses.length > 0 && (
                   <button onClick={loadRecurring} className="text-xs text-rk-brown underline">Cek Pola</button>
                )}
              </div>
              
              {isGeneratingRec ? (
                <p className="text-sm text-rk-brown/50 animate-pulse">Lagi nyari pola...</p>
              ) : recurring ? (
                recurring.detected ? (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">
                    <p className="text-sm text-rk-brown leading-relaxed">"{recurring.text}"</p>
                    <div className="bg-rk-brown/5 rounded-xl p-3 border border-rk-brown/10">
                      <p className="text-[10px] uppercase tracking-widest text-rk-brown/60 mb-1 font-semibold">Proyeksi 6 Bulan</p>
                      <p className="font-serif text-xl text-rk-brown">Rp {recurring.projection6Months.toLocaleString('id-ID')}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-rk-gold-dark font-medium">
                        <TrendingUp className="w-3 h-3" /> Setara ~{(recurring.projection6Months / 1400000).toFixed(2)} gram Emas!
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-sm text-rk-brown/60">Belum nemu pola pengeluaran yang jelas nih.</p>
                )
              ) : (
                <p className="text-xs text-rk-brown/40">Analisis pengeluaran yang sering diulang.</p>
              )}
            </div>
          </div>

          {/* Split Bills - Full Width Bottom */}
          {splitBills.length > 0 && (
             <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-rk-brown/5">
               <div className="flex items-center gap-2 mb-3">
                 <Users className="w-5 h-5 text-rk-brown/60" />
                 <h3 className="font-medium text-rk-brown text-sm">Draft Tagihan (Split Bill)</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {splitBills.map((bill, index) => (
                    <div key={index} className="bg-rk-cream/30 p-3 rounded-xl border border-rk-brown/5">
                       <p className="font-medium text-rk-brown text-sm mb-2">{bill.text} (Total Rp {bill.originalAmount.toLocaleString('id-ID')})</p>
                       <div className="space-y-2">
                         {bill.friends.map((f, i) => (
                            <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-rk-brown/5 text-sm">
                               <span className="text-rk-brown/80">{f.name}</span>
                               <div className="flex items-center gap-3">
                                 <span className="font-semibold text-rk-brown">Rp {f.amount.toLocaleString('id-ID')}</span>
                                 <button 
                                   onClick={() => copyToClipboard(`Bro, patungan ${bill.text} kemaren lo masih utang Rp ${f.amount.toLocaleString('id-ID')} nih 😄`)}
                                   className="p-1.5 text-rk-brown/40 hover:text-rk-gold-dark hover:bg-rk-gold/10 rounded-md transition-colors"
                                 >
                                    <Copy className="w-4 h-4" />
                                 </button>
                               </div>
                            </div>
                         ))}
                       </div>
                    </div>
                 ))}
               </div>
             </div>
          )}

          {/* Micro Lessons - Full Width Bottom */}
          <div className="lg:col-span-2 bg-rk-brown text-rk-cream rounded-2xl p-5 md:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <BookOpen className="w-5 h-5 text-rk-gold" />
                 <h3 className="font-serif text-lg font-medium text-rk-cream">Belajar Duit</h3>
              </div>
              {profile.badges && profile.badges.length > 0 && (
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                  <Medal className="w-3 h-3 text-rk-gold" />
                  <span className="text-[10px] font-bold">{profile.badges.length}</span>
                </div>
              )}
            </div>

            {isGeneratingLesson ? (
               <p className="text-sm text-rk-cream/60 animate-pulse text-center py-4">Bikin modul bentar...</p>
            ) : lesson ? (
               <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                 <h4 className="font-semibold text-lg text-rk-gold mb-2">{lesson.title}</h4>
                 <p className="text-sm text-rk-cream/90 leading-relaxed mb-6 whitespace-pre-wrap">{lesson.content}</p>
                 
                 <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                   <p className="text-sm font-medium mb-3">Quiz: {lesson.question}</p>
                   <div className="space-y-2">
                     {lesson.options.map((opt, i) => {
                       const isSelected = quizAnswered === opt;
                       const isCorrect = opt === lesson.correctAnswer;
                       
                       let btnStyle = "bg-white/10 text-rk-cream hover:bg-white/20";
                       if (quizAnswered) {
                         if (isCorrect) btnStyle = "bg-green-500/20 text-green-400 border border-green-500/30";
                         else if (isSelected) btnStyle = "bg-red-500/20 text-red-400 border border-red-500/30";
                         else btnStyle = "opacity-50 bg-white/5";
                       }

                       return (
                         <button 
                           key={i}
                           disabled={!!quizAnswered}
                           onClick={() => handleQuizAnswer(opt)}
                           className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${btnStyle}`}
                         >
                           <span>{opt}</span>
                           {quizAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 ml-2" />}
                         </button>
                       );
                     })}
                   </div>
                   {quizAnswered && (
                     <div className="mt-4 text-center">
                       <button onClick={loadLesson} className="text-xs text-rk-gold underline">Lanjut Topik Lain</button>
                     </div>
                   )}
                 </div>
               </motion.div>
            ) : (
               <div className="text-center py-4">
                 <p className="text-sm text-rk-cream/60 mb-4">Pengen upgrade level financial literacy lu?</p>
                 <button 
                   onClick={loadLesson}
                   disabled={expenses.length === 0}
                   className="bg-rk-gold text-rk-brown font-semibold px-4 py-2 rounded-lg text-sm hover:bg-rk-gold-dark transition-colors disabled:opacity-50"
                 >
                   Minta Materi
                 </button>
               </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {!proyeksi ? (
            <div className="text-center py-10 md:py-16">
              <Rocket className="w-12 h-12 text-rk-brown/20 mx-auto mb-4" />
              <h3 className="font-serif text-xl md:text-2xl text-rk-brown mb-2">Lihat Masa Depan Lo</h3>
              <p className="text-sm text-rk-brown/60 mb-6">AI bakal hitung efek jangka panjang dari pengeluaran lo.</p>
              <button 
                onClick={loadProyeksi}
                disabled={isGeneratingProyeksi || expenses.length === 0}
                className="bg-rk-brown text-rk-cream px-6 py-3 rounded-xl font-medium shadow-md active:bg-rk-brown-light transition-all disabled:opacity-50"
              >
                 {isGeneratingProyeksi ? (
                   <span className="flex items-center justify-center animate-pulse">Menghitung...</span>
                 ) : (
                   "Mulai Proyeksi AI"
                 )}
              </button>
            </div>
          ) : (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
              {/* Latte Factor Card */}
              <div className="bg-[#FAF8F5] border border-rk-brown/10 rounded-xl p-5 md:p-6 shadow-[4px_4px_0_0_rgba(62,39,35,0.05)] relative">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-rk-brown/5 rounded-full" />
                <h3 className="font-serif text-xl text-rk-brown mb-2 text-center mt-2">☕ The Latte Factor</h3>
                
                {proyeksi.latteFactor.items.length > 0 ? (
                  <p className="text-center text-sm text-rk-brown/70 mb-4">Lo keseringan jajan: <span className="font-medium text-rk-brown">{proyeksi.latteFactor.items.join(', ')}</span></p>
                ) : (
                  <p className="text-center text-sm text-rk-brown/70 mb-4">Pengeluaran kecil aman, bro.</p>
                )}
                
                <div className="text-center my-6">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-rk-brown/50 mb-1">Kalo Diterusin, Setahun Abis</p>
                   <p className="text-2xl md:text-3xl font-serif text-rk-red font-bold">Rp {proyeksi.latteFactor.yearlyCost.toLocaleString('id-ID')}</p>
                </div>
                
                <div className="bg-rk-gold/10 p-3 rounded-lg text-center border border-rk-gold/20">
                  <p className="text-xs text-rk-gold-dark font-medium italic">"{proyeksi.latteFactor.equivalentText}"</p>
                </div>
              </div>

              {/* Time Machine Card */}
              <div className="bg-[#FDFBF7] border-2 border-dashed border-rk-brown/20 rounded-xl p-5 md:p-6 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMzRTI3MjMiLz48L3N2Zz4=')]"></div>
                
                <div className="relative z-10">
                    <h3 className="font-serif text-xl text-rk-brown mb-6 text-center">🚀 Mesin Waktu Investasi</h3>
                    
                    <div className="relative flex justify-between items-center mb-10 px-0">
                       <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-rk-brown/20 -translate-y-1/2 z-0" />
                       
                       <div className="z-10 flex flex-col items-center bg-[#Fdfbf7] p-1">
                          <div className="w-3 h-3 rounded-full bg-rk-brown border-2 border-[#Fdfbf7]" />
                          <p className="text-[9px] font-bold uppercase mt-2 text-rk-brown">Hari Ini</p>
                          <p className="text-[11px] font-medium text-rk-brown/70 text-center whitespace-nowrap">Rp {(proyeksi.investmentMachine.currentMonthly / 1000).toLocaleString('id-ID')}K</p>
                       </div>
                       
                       <div className="z-10 flex flex-col items-center bg-[#Fdfbf7] p-1">
                          <div className="w-3 h-3 rounded-full bg-rk-gold border-2 border-[#Fdfbf7]" />
                          <p className="text-[9px] font-bold uppercase mt-2 text-rk-brown">1 Thn</p>
                          <p className="text-[11px] font-medium text-rk-brown/70 text-center whitespace-nowrap">Rp {(proyeksi.investmentMachine.projected1Y / 1000000).toFixed(1)}Jt</p>
                       </div>

                       <div className="z-10 flex flex-col items-center bg-[#Fdfbf7] p-1">
                          <div className="w-4 h-4 rounded-full bg-rk-green border-2 border-[#Fdfbf7] shadow-sm animate-pulse" />
                          <p className="text-[9px] font-bold uppercase mt-2 text-rk-green">5 Thn</p>
                          <p className="text-[12px] font-bold text-rk-green text-center whitespace-nowrap">Rp {(proyeksi.investmentMachine.projected5Y / 1000000).toFixed(1)}Jt</p>
                       </div>
                    </div>
                    
                    <p className="text-center text-sm font-hand text-rk-brown/90 leading-relaxed text-[17px]">
                       "{proyeksi.investmentMachine.encouragement}"
                    </p>
                </div>
              </div>
              
              <div className="lg:col-span-2 text-center pt-2">
                <button onClick={loadProyeksi} className="text-xs text-rk-brown/40 hover:text-rk-brown underline transition-colors">
                  Hitung Ulang Proyeksi
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}