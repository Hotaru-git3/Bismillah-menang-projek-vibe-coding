import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Medal, CheckCircle2 } from 'lucide-react';
import { Expense, UserProfile } from '../utils/storage';
import { generateMicroLesson } from '../services/geminiService';
import { syncUserProfile } from '../utils/firebaseUtils';

interface Props {
  expenses: Expense[];
  profile: UserProfile;
  onBadgesUpdate: (badges: string[]) => void;
  onShowToast: (msg: string) => void;
}

export default function MicroLessonCard({ expenses, profile, onBadgesUpdate, onShowToast }: Props) {
  const [lesson, setLesson] = React.useState<{ title: string, content: string, question: string, correctAnswer: string, options: string[] } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [quizAnswered, setQuizAnswered] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const loadLesson = async () => {
    if (expenses.length === 0) return;
    setLoading(true);
    try {
      const res = await generateMicroLesson(expenses);
      setLesson(res);
      setQuizAnswered(null);
      setRetryCount(0);
    } catch(err: any) {
      console.error(err);
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(loadLesson, 1000);
      } else {
        onShowToast("AI lagi sibuk, coba nanti.");
      }
    } finally {
      if (retryCount >= 2) setLoading(false);
      else if (!loading) setLoading(false);
    }
  };

  const handleQuizAnswer = async (opt: string) => {
    if (quizAnswered) return;
    setQuizAnswered(opt);
    
    if (lesson && opt === lesson.correctAnswer) {
      const newBadges = [...(profile.badges || []), lesson.title];
      onBadgesUpdate(newBadges);
      await syncUserProfile({ ...profile, badges: newBadges });
    }
  };

  return (
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
      {loading ? (
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
                     className={`cursor-pointer w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${btnStyle}`}
                   >
                     <span>{opt}</span>
                     {quizAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 ml-2" />}
                   </button>
                 );
               })}
             </div>
             {quizAnswered && (
               <div className="mt-4 text-center">
                 <button onClick={loadLesson} className="cursor-pointer text-xs text-rk-gold underline">Lanjut Topik Lain</button>
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
             className="cursor-pointer bg-rk-gold text-rk-brown font-semibold px-4 py-2 rounded-lg text-sm hover:bg-rk-gold-dark transition-colors disabled:opacity-50"
           >
             Minta Materi
           </button>
         </div>
      )}
    </div>
  );
}
