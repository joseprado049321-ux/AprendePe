import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Brain, User, Lock, Play, Loader2, Calculator, BookOpen, MessageCircle, FlaskConical, Shuffle, ChevronDown } from 'lucide-react';
import { Level, Subject, UserProfile } from '../types';
import { collection, query, where, limit, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getSubjectTheme } from '../lib/theme';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useSound } from '../contexts/SoundContext';
import Tour from './Tour';

interface HomeProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Home({ profile, updateProfile }: HomeProps) {
  const [subject, setSubject] = useState<Subject>(profile.lastSelectedCourse as Subject || 'Matemáticas');
  const [generatingState, setGeneratingState] = useState<'idle' | 'checking' | 'generating'>('idle');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { playSound } = useSound();

  const subjects: Subject[] = ['Matemáticas', 'Historia', 'Comunicación', 'Ciencias', 'Variado'];
  const t = getSubjectTheme(subject);

  const currentUnlocked = profile.unlockedLevels?.[subject] || 1;

  // Simulate a path of levels
  const pathNodes = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    unlocked: (i + 1) <= currentUnlocked
  }));

  const levelWidths = useMemo(() => {
    const sizes = ['w-32', 'w-48', 'w-64']; // Small, Medium, Large
    let lastSizeIdx = -1;
    return Array.from({ length: 10 }, () => {
      let nextSizeIdx;
      do {
        nextSizeIdx = Math.floor(Math.random() * 3);
      } while (nextSizeIdx === lastSizeIdx);
      lastSizeIdx = nextSizeIdx;
      return sizes[nextSizeIdx];
    });
  }, []);

  const handleNodeClick = async (nodeId: number, isUnlocked: boolean) => {
    if (!isUnlocked) {
      playSound('fail');
      return;
    }
    
    if ((profile.lives ?? 5) <= 0) {
      playSound('fail');
      alert('¡No tienes vidas! Ve a la Tienda para recargarlas y seguir aprendiendo.');
      return;
    }
    
    playSound('click');
    setGeneratingState('checking');
    
    try {
      const userHistory = {
        diagnosticLevel: profile.diagnosticLevel || profile.level,
        xp: profile.xp || 0
      };

      let cachedQuestions = null;

      // 1. Silent Cache (Frontend) using Subcollection
      if (profile.uid !== 'guest') {
        try {
          const docRef = doc(db, 'users', profile.uid, 'preguntasGeneradas', `${subject}_${nodeId}`);
          const snapshot = await getDoc(docRef);
          
          if (snapshot.exists()) {
            console.log("CACHE HIT: Retrieved from Firestore Client");
            const cachedData = snapshot.data();
            cachedQuestions = cachedData.questions;
          }
        } catch (dbErr) {
          console.warn("CACHE MISS / ERR:", dbErr);
        }
      }

      if (cachedQuestions && cachedQuestions.length > 0) {
        setGeneratingState('idle');
        navigate('/quiz', { 
          state: { subject, level: profile.diagnosticLevel || profile.level, questions: cachedQuestions, nodeId } 
        });
        return;
      }

      // 2. Call Gemini Backend
      setGeneratingState('generating');
      
      const lastHistory = profile.history?.[0];
      const lastAccuracy = lastHistory?.accuracyPercentage;
      const lastLivesLost = lastHistory?.livesLost;

      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject, 
          level: profile.diagnosticLevel || profile.level, 
          nodeId,
          userId: profile.uid,
          userHistory,
          lastAccuracy,
          lastLivesLost
        })
      });

      if (!response.ok) throw new Error("Error generating questions");

      const data = await response.json();
      const generatedQuestions = data.questions || [];
      
      // 3. Save to Cache in Subcollection
      if (profile.uid !== 'guest' && generatedQuestions.length > 0 && !data.isFallback) {
         try {
           const docRef = doc(db, 'users', profile.uid, 'preguntasGeneradas', `${subject}_${nodeId}`);
           await setDoc(docRef, {
             userId: profile.uid,
             theme: subject,
             level: profile.diagnosticLevel || profile.level,
             nodeId,
             questions: generatedQuestions,
             createdAt: serverTimestamp()
           });
           console.log("SAVED TO CACHE via Client SDK");
         } catch (e) {
           console.warn("Could not save to cache", e);
         }
      }

      setGeneratingState('idle');
      navigate('/quiz', { 
        state: { 
          subject, 
          level: profile.diagnosticLevel || profile.level,
          questions: generatedQuestions,
          nodeId
        } 
      });

    } catch (e: any) {
      console.warn("Error in question generation flow:", e?.message || e);
      setGeneratingState('idle');
      alert("Hubo un error al generar la lección. Por favor, intenta de nuevo.");
    }
  };

  return (
    <div className={`${t.bg} transition-colors duration-500 overflow-y-auto no-scrollbar relative`}>
      <div className="w-full max-w-md mx-auto px-4 pt-8 pb-24 min-h-screen flex flex-col relative z-0">
        
        <header className="flex justify-between items-center mb-6 sticky top-0 bg-[var(--bg)]/90 backdrop-blur pb-4 z-40 pt-2 border-b-2 border-[var(--gray)] transition-colors duration-500">
          <div className="flex items-center gap-2">
             <div className={`p-2 rounded-full ${t.iconBg}`}>
                <Brain size={24} className={subject === 'Variado' ? 'text-slate-900' : ''} />
             </div>
             <h1 className={`${t.text} font-bold mb-0 mt-0 text-xl`}>Negros</h1>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 bg-[var(--gray)] px-3 py-1.5 rounded-lg font-bold text-sm text-[var(--text)] hover:bg-[var(--gray-s)] transition-colors"
                >
                  {subject} <ChevronDown size={16} />
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-40 overflow-hidden z-50"
                    >
                      {subjects.map(s => (
                        <button
                          key={s}
                          onClick={() => { 
                            setSubject(s); 
                            setIsDropdownOpen(false); 
                            playSound('click'); 
                            updateProfile({ lastSelectedCourse: s });
                          }}
                          className={`block w-full text-left px-4 py-3 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${subject === s ? t.textHeading : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
             <div className={`flex items-center gap-1 text-[var(--muted)] px-3 py-1.5 font-bold text-sm`}>
                <Flame size={18} className="animate-pulse text-orange-400" />
                <span>{profile.streak}</span>
             </div>
             <Link to="/profile" className={`p-2 rounded-full border-2 border-[var(--gray)] text-[var(--text)] hover:bg-[var(--gray)] transition-colors`}>
                <User size={18} />
             </Link>
          </div>
        </header>

        {/* Level Path Map & Global Lives Column */}
        <div className="flex w-full relative z-10 px-4">
          <div className="flex-1 flex flex-col items-center gap-[60px] py-10">
            {pathNodes.map((node, i) => {
              // Variado strict palette: alternate colors for nodes
              let nodeBg = t.node;
              if (subject === 'Variado' && node.unlocked) {
                 const colors = ['bg-red-500 shadow-[0_6px_0_#cc3c3c]', 'bg-yellow-500 shadow-[0_6px_0_#cc9f00]', 'bg-[var(--math)] shadow-[0_6px_0_var(--math-s)]', 'bg-[var(--science)] shadow-[0_6px_0_var(--science-s)]'];
                 nodeBg = colors[i % 4];
                 if(nodeBg.includes('yellow')) {
                   nodeBg += ' text-slate-900';
                 } else {
                   nodeBg += ' text-white';
                 }
              } else if (node.unlocked) {
                 nodeBg = `bg-[var(--${subject === 'Matemáticas' ? 'math' : subject === 'Historia' ? 'social' : subject === 'Comunicación' ? 'comm' : 'science'})] shadow-[0_6px_0_var(--${subject === 'Matemáticas' ? 'math' : subject === 'Historia' ? 'social' : subject === 'Comunicación' ? 'comm' : 'science'}-s)] border-0 text-white hover:brightness-110`;
                 if (subject === 'Comunicación') {
                     nodeBg += ' text-[#5a3e00]';
                 }
              }

              const currentWidth = levelWidths[i] || 'w-48';

              return (
                <motion.div 
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex flex-col items-center justify-center z-10"
                >
                  <button
                    onClick={node.unlocked ? () => handleNodeClick(node.id, node.unlocked) : undefined}
                    disabled={!node.unlocked}
                    title={node.unlocked ? undefined : `🔒 Completa el Nivel ${node.id - 1} para desbloquear`}
                    className={`${currentWidth} h-20 rounded-xl flex items-center justify-center transition-all duration-300 pointer-events-auto ${
                      node.unlocked 
                        ? `${nodeBg} hover:scale-105 hover:shadow-2xl active:scale-95` 
                        : 'bg-[#e5e5e5] shadow-[0_6px_0_#c0c0c0] text-[#afafaf] opacity-60 cursor-not-allowed dark:bg-[var(--gray)] dark:shadow-[0_6px_0_var(--bg)] dark:text-[var(--muted)]'
                    }`}
                  >
                    {node.unlocked ? <span className="text-[26px] font-bold">{node.id}</span> : <Lock size={28} />}
                  </button>
                  <span className="font-bold text-[12px] whitespace-nowrap absolute -bottom-[24px] text-[#afafaf]">
                    Nivel {node.id}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Global Lives Column */}
          <div className="w-20 shrink-0 flex flex-col items-center pt-10">
            <div className="sticky top-28 flex flex-col gap-3">
              <span className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">Vidas</span>
              {Array.from({ length: 5 }).map((_, i) => {
                 const hasLife = i < (profile.lives ?? 5);
                 return (
                   <div 
                     key={i} 
                     className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                       hasLife 
                         ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500 shadow-md shadow-rose-200/50 dark:shadow-rose-900/50' 
                         : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                     }`}
                   >
                     <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                       <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                     </svg>
                   </div>
                 );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Loading Screen */}
      <AnimatePresence>
        {generatingState === 'checking' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center"
          >
            <Loader2 size={40} className="text-white animate-spin drop-shadow-md" />
          </motion.div>
        )}
        
        {generatingState === 'generating' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <div className="bg-slate-800 p-8 rounded-3xl w-full max-w-sm border border-slate-700 flex flex-col items-center shadow-2xl text-center">
              <Loader2 size={64} className="text-white animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-white mb-3">Generando...</h2>
              <p className="text-slate-400 mb-8">
                Espera. Las preguntas se están generando...
              </p>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                 <div className="bg-white h-full w-full animate-[progress_2s_ease-in-out_infinite] origin-left" style={{
                   animationName: 'shimmer',
                   background: 'linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.5) 100%)',
                   backgroundSize: '200% 100%',
                 }} />
              </div>
            </div>
            <style>{`
              @keyframes shimmer {
                0% { background-position: 100% 0; }
                100% { background-position: -100% 0; }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!profile.hasCompletedTour && generatingState === 'idle' && (
        <Tour profile={profile} updateProfile={updateProfile} />
      )}
      
      <BottomNav activeTab="/home" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
