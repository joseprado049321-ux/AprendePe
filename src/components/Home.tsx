import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Brain, User, Lock, Play, Loader2, Calculator, BookOpen, MessageCircle, FlaskConical, Shuffle, ChevronDown, Sparkles, ChevronRight } from 'lucide-react';
import { Level, Subject, UserProfile, SubTheme } from '../types';
import { collection, query, where, limit, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getSubjectTheme } from '../lib/theme';
import { curriculumMap } from '../data/curriculum';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useSound } from '../contexts/SoundContext';
import Tour from './Tour';
import { useLives } from '../hooks/useLives';

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
  const { currentLives, timeUntilNext, justGainedLife } = useLives(profile, updateProfile);

  const subjects: Subject[] = ['Matemáticas', 'Historia', 'Comunicación', 'Ciencias', 'Variado'];
  const t = getSubjectTheme(subject);

  const pendingMistakesCount = (profile.mistakeBank || []).filter(m => !m.mastered).length;

  const handleNodeClick = async (subTheme: SubTheme, isUnlocked: boolean) => {
    if (!isUnlocked) {
      playSound('fail');
      return;
    }
    
    if (currentLives <= 0) {
      playSound('fail');
      alert('¡No tienes vidas! Ve a la Tienda para recargarlas y seguir aprendiendo.');
      return;
    }
    
    playSound('click');
    setGeneratingState('checking');
    
    const nodeId = subTheme.id;
    
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
          promptTopic: subTheme.promptTopic,
          cnebCompetence: subTheme.cnebCompetence,
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

  const generateVegetation = (subject: string, biomeId: string) => {
    // Generates absolute positioned SVG decorations
    const isMath = subject === 'Matemáticas';
    const isComm = subject === 'Comunicación';
    const isSci = subject === 'Ciencias';
    
    // Just a few static absolute elements for flavor
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <svg className="absolute top-10 left-10 w-16 h-16 text-white/40" viewBox="0 0 24 24" fill="currentColor">
           {isMath && <path d="M12 2L2 22h20L12 2zm0 4l6 14H6l6-14z" />}
           {isComm && <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
           {(isSci || subject === 'Historia' || subject === 'Variado') && <circle cx="12" cy="12" r="10" />}
        </svg>
        <svg className="absolute top-1/3 right-10 w-24 h-24 text-white/20 rotate-45" viewBox="0 0 24 24" fill="currentColor">
           {isMath && <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v2h2v5h2v-5h2v-2z" />}
           {isComm && <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />}
           {(isSci || subject === 'Historia' || subject === 'Variado') && <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />}
        </svg>
        <svg className="absolute bottom-20 left-1/4 w-12 h-12 text-white/30 -rotate-12" viewBox="0 0 24 24" fill="currentColor">
           <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99z" />
        </svg>
      </div>
    );
  };

  return (
    <div className={`${t.bg} transition-colors duration-500 overflow-y-auto no-scrollbar relative w-full`}>
      <div className="w-full mx-auto pb-24 min-h-screen flex flex-col relative z-0">
             <header className="w-full max-w-4xl mx-auto px-4 pt-8 flex justify-between items-center mb-6 sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur pb-4 z-40 border-b border-slate-200 dark:border-slate-800 transition-colors duration-500 rounded-b-3xl">
          <div className="flex items-center gap-2">
             <div className={`p-2 rounded-full ${t.iconBg}`}>
                <Brain size={24} className={subject === 'Variado' ? 'text-slate-900' : ''} />
             </div>
             <h1 className="text-slate-900 dark:text-white font-bold mb-0 mt-0 text-xl">AprendePe</h1>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
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
             <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 px-3 py-1.5 font-bold text-sm">
                <Flame size={18} className="animate-pulse text-amber-500" />
                <span>{profile.streak}</span>
             </div>
             <Link to="/profile" className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors">
                <User size={18} />
             </Link>
          </div>
        </header>

        {/* Baúl de Errores Quick Banner */}
        {pendingMistakesCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 w-full max-w-4xl mx-auto"
          >
            <Link 
              to="/review"
              className="block p-3.5 bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 dark:from-amber-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-amber-300/60 dark:border-amber-700/50 rounded-2xl shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Baúl de Errores</span>
                      <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {pendingMistakesCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Repasa sin perder vidas y gana +5 XP
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Repasar</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Level Path Map & Global Lives Column */}
        <div className="flex w-full relative z-10 px-0">
          <div className="flex-1 flex flex-col w-full">
            {curriculumMap[subject].map((biome, bIndex) => {
               // Calculate global indices to know previous XP requirements
               const allSubThemes = curriculumMap[subject].flatMap(b => b.subThemes);
               
               return (
                 <div key={biome.id} className={`w-full flex flex-col items-center py-16 bg-gradient-to-b ${biome.bgGradient} relative overflow-hidden shadow-inner`}>
                   
                   {generateVegetation(subject, biome.id)}

                   {/* Biome Name Banner */}
                   <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm px-8 py-2.5 rounded-full border border-white/30 text-white font-black text-xl shadow-lg z-20">
                     {biome.name}
                   </div>
                   
                   <div className="flex flex-col items-center gap-[80px] mt-10 w-full relative">
                     {biome.subThemes.map((subTheme, i) => {
                       const globalIndex = allSubThemes.findIndex(st => st.id === subTheme.id);
                       const previousXP = globalIndex > 0 ? allSubThemes[globalIndex - 1].requiredXP : 0;
                       
                       const userXP = profile.xp || 0;
                       const isUnlocked = userXP >= previousXP;
                       const targetXP = subTheme.requiredXP;
                       
                       const nodeMaxXP = targetXP - previousXP;
                       const nodeCurrentXP = Math.max(0, Math.min(userXP - previousXP, nodeMaxXP));
                       const progressPercent = Math.round((nodeCurrentXP / nodeMaxXP) * 100);
                       const isMastered = progressPercent >= 100;
                       
                       const currentWidth = ['-translate-x-12', 'translate-x-0', 'translate-x-12'][i % 3];
                       
                       let nodeBg = 'bg-white text-slate-800';
                       if (isMastered) nodeBg = 'bg-amber-400 text-white';
                       
                       return (
                         <div key={subTheme.id} className={`relative flex flex-col items-center justify-center z-10 group ${currentWidth}`}>
                           
                           {/* Competence Tooltip */}
                           {profile.showCNEBCompetencies && (
                             <div className="absolute -top-12 bg-white/90 backdrop-blur-sm text-slate-800 px-3 py-1.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30 whitespace-nowrap text-xs font-bold">
                               {subTheme.cnebCompetence}
                               <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 rotate-45"></div>
                             </div>
                           )}

                           <div className="relative w-20 h-20 flex items-center justify-center">
                             {/* SVG Progress Ring */}
                             {isUnlocked && (
                               <svg className="absolute w-[110px] h-[110px] transform -rotate-90 pointer-events-none z-0">
                                 <circle
                                   cx="55" cy="55" r="48"
                                   stroke="rgba(255,255,255,0.3)"
                                   strokeWidth="8"
                                   fill="transparent"
                                 />
                                 <circle
                                   cx="55" cy="55" r="48"
                                   stroke={isMastered ? '#fbbf24' : '#fff'}
                                   strokeWidth="8"
                                   fill="transparent"
                                   strokeDasharray={301.59}
                                   strokeDashoffset={301.59 - (progressPercent / 100) * 301.59}
                                   className="transition-all duration-1000 ease-out"
                                   strokeLinecap="round"
                                 />
                               </svg>
                             )}
                             
                             <button
                               onClick={isUnlocked ? () => handleNodeClick(subTheme, isUnlocked) : undefined}
                               disabled={!isUnlocked}
                               className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto relative z-10 ${
                                 isUnlocked 
                                   ? `${nodeBg} shadow-[0_6px_0_rgba(0,0,0,0.2)] hover:scale-105 active:scale-90 active:translate-y-2` 
                                   : 'bg-slate-300/50 backdrop-blur-sm shadow-[0_6px_0_rgba(0,0,0,0.1)] text-white/50 cursor-not-allowed'
                               }`}
                             >
                               {isUnlocked ? (
                                 isMastered ? <Sparkles size={32} /> : <Play size={32} className="ml-1" />
                               ) : (
                                 <Lock size={32} />
                               )}
                             </button>
                           </div>
                           
                           {/* Topic Title and XP requirement */}
                           <div className="flex flex-col items-center mt-4 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm">
                             <span className="font-bold text-sm text-white text-center max-w-[140px] leading-tight">
                               {subTheme.name}
                             </span>
                             {isUnlocked && !isMastered && (
                               <span className="text-xs font-black text-white/90 mt-0.5">
                                 {nodeCurrentXP} / {nodeMaxXP} XP
                               </span>
                             )}
                             {!isUnlocked && (
                               <span className="text-xs font-bold text-white/70 mt-0.5 flex items-center gap-1">
                                 <Lock size={10} /> Req. {targetXP} XP
                               </span>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               );
            })}
          </div>

          {/* Global Lives Column - Fixed Position */}
          <div className="fixed top-28 right-4 sm:right-10 z-40 flex flex-col items-center">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-300 text-center uppercase tracking-wider mb-2 bg-slate-900/50 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">Vidas</span>
              {Array.from({ length: 5 }).map((_, i) => {
                 const hasLife = i < currentLives;
                 const isJustGained = justGainedLife && i === currentLives - 1;
                 
                 return (
                   <motion.div 
                     key={i} 
                     animate={isJustGained ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
                     transition={{ duration: 0.5 }}
                     className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                       hasLife 
                         ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-800/40 shadow-sm shadow-rose-200/50 dark:shadow-rose-900/30' 
                         : 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-800'
                     }`}
                   >
                     <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                       <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                     </svg>
                   </motion.div>
                 );
              })}
              {currentLives < 5 && timeUntilNext !== null && (
                <div className="mt-1 text-center text-rose-500 font-bold font-mono text-sm bg-rose-100 dark:bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800/40">
                  {Math.floor(timeUntilNext / 60000).toString().padStart(2, '0')}:
                  {Math.floor((timeUntilNext % 60000) / 1000).toString().padStart(2, '0')}
                </div>
              )}
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
