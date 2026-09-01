import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Brain, User, Lock, Play, Loader2, Calculator, BookOpen, MessageCircle, FlaskConical, Shuffle, ChevronDown, Sparkles, ChevronRight } from 'lucide-react';
import { Level, Subject, UserProfile, SubTheme, Biome } from '../types';
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
  const [visibleNodesCount, setVisibleNodesCount] = useState(10);
  const [generatingState, setGeneratingState] = useState<'idle' | 'checking' | 'generating'>('idle');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dynamicCurriculum, setDynamicCurriculum] = useState<Biome[] | null>(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const navigate = useNavigate();
  const { playSound } = useSound();
  const { currentLives, timeUntilNext, justGainedLife } = useLives(profile, updateProfile);

  useEffect(() => {
    const fetchCurriculum = async () => {
      setLoadingCurriculum(true);
      const gradeStr = profile.grade || '1ero';
      let stage = profile.educationalStage || 'Secundaria';
      if (profile.level === 'Primaria') stage = 'Primaria';

      try {
        const res = await fetch(`/api/curriculum?grade=${encodeURIComponent(gradeStr)}&stage=${encodeURIComponent(stage)}&subject=${encodeURIComponent(subject)}`);
        if (!res.ok) throw new Error("Failed to fetch curriculum");
        const node = await res.json();
        
        const gradients = [
          'from-cyan-100 to-lime-100 dark:from-slate-900 dark:to-lime-950',
          'from-lime-100 to-amber-100 dark:from-lime-950 dark:to-amber-950',
          'from-amber-100 to-rose-200 dark:from-amber-950 dark:to-rose-950', // AprendePe Coral
          'from-rose-200 to-fuchsia-200 dark:from-rose-950 dark:to-fuchsia-950',
          'from-fuchsia-200 to-cyan-100 dark:from-fuchsia-950 dark:to-slate-900'
        ];

        const getCumulativeXP = (index: number) => {
          if (index === 0) return 100;
          let total = 100;
          for (let i = 1; i <= index; i++) {
            const increment = Math.min(100 + (i * 20), 400); // Cap increment
            total += increment;
          }
          return total;
        };

        let globalIndex = 0;
        const biomes: Biome[] = node.units.map((unit: any, i: number) => {
          const subThemes = unit.topics.map((topic: string) => {
            const xpRequirement = getCumulativeXP(globalIndex);
            const subTheme: SubTheme = {
              id: `dyn_${i}_${globalIndex}`,
              name: topic.length > 30 ? topic.substring(0, 27) + '...' : topic,
              requiredXP: xpRequirement,
              cnebCompetence: 'Resuelve problemas',
              promptTopic: topic
            };
            globalIndex++;
            return subTheme;
          });
          
          return {
            id: `dyn_biome_${i}`,
            name: unit.name,
            bgGradient: gradients[i % gradients.length],
            pathColor: '#ffffff',
            subThemes
          };
        });
        
        setDynamicCurriculum(biomes);
      } catch (err) {
        console.warn("Could not load dynamic curriculum", err);
        setDynamicCurriculum(null);
      } finally {
        setLoadingCurriculum(false);
      }
    };
    
    fetchCurriculum();
  }, [subject, profile.diagnosticLevel, profile.level]);

  const subjects: Subject[] = ['Matemáticas', 'Historia', 'Comunicación', 'Ciencias'];
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

      if (cachedQuestions) {
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

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        console.error("API Error details:", errData);
        throw new Error(errData?.details || "Error generating questions");
      }

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
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 mix-blend-multiply dark:mix-blend-color-burn">
        <img 
          src="/background.png" 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover object-bottom opacity-90"
        />
      </div>
    );
  };

  return (
    <div className={`${t.bg} transition-colors duration-500 overflow-y-auto no-scrollbar relative w-full`}>
      <div className="w-full mx-auto pb-24 min-h-screen flex flex-col relative z-0">
             <header className="w-full max-w-4xl mx-auto px-4 pt-8 flex justify-between items-center mb-6 sticky top-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl pb-4 z-40 border-b border-white/50 dark:border-slate-700/60 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/50 transition-all duration-500 rounded-b-3xl">
          <div className="flex items-center gap-2">
             <div className={`p-2 rounded-2xl shadow-sm ${t.iconBg}`}>
                <Brain size={24} className="text-white" />
             </div>
             <h1 className="text-slate-900 dark:text-white font-black mb-0 mt-0 text-xl tracking-tight">AprendePe</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all hover:shadow-md"
                >
                  {subject} <ChevronDown size={16} />
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="absolute right-0 top-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-44 overflow-hidden z-50"
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
                          className={`block w-full text-left px-4 py-3.5 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${subject === s ? t.textHeading : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
             <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-3 py-2 rounded-xl font-bold text-sm shadow-sm">
                <Flame size={18} className="animate-pulse fill-amber-500/20" />
                <span>{profile.streak}</span>
             </div>
             <Link to="/profile" className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all">
                <User size={20} />
             </Link>
          </div>
        </header>

        {/* Baúl de Errores Quick Banner */}
        {pendingMistakesCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 px-4 w-full max-w-4xl mx-auto"
          >
            <Link 
              to="/review"
              className="block p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 dark:from-amber-900/40 dark:via-orange-900/40 dark:to-rose-900/40 border border-amber-400/50 dark:border-amber-700/60 rounded-3xl shadow-lg hover:shadow-amber-500/30 transition-all duration-500 group relative overflow-hidden backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-base text-slate-900 dark:text-white tracking-tight">Baúl de Errores</span>
                      <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {pendingMistakesCount}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 opacity-90">
                      Recupera conocimiento y gana +5 XP sin gastar vidas.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 group-hover:translate-x-1">
                  <ChevronRight size={20} className="stroke-[3]" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Level Path Map & Global Lives Column */}
        <div className="flex w-full relative z-10 px-0">
          <div className="flex-1 flex flex-col w-full">
            {loadingCurriculum ? (
              <div className="w-full flex flex-col items-center justify-center py-32 opacity-70">
                <Loader2 size={40} className="animate-spin text-slate-400 mb-4" />
                <p className="text-slate-500 font-bold">Cargando tu temario...</p>
              </div>
            ) : (() => {
               const activeMap = dynamicCurriculum || curriculumMap[subject];
               const allSubThemes = activeMap.flatMap(b => b.subThemes);
               const totalNodesInCurriculum = allSubThemes.length;
               
               // Pagination logic
               let renderedNodesCount = 0;
               const paginatedMap = activeMap.map(biome => {
                 if (renderedNodesCount >= visibleNodesCount) return { ...biome, subThemes: [] };
                 const remainingAllowed = visibleNodesCount - renderedNodesCount;
                 const subThemesToRender = biome.subThemes.slice(0, remainingAllowed);
                 renderedNodesCount += subThemesToRender.length;
                 return { ...biome, subThemes: subThemesToRender };
               }).filter(biome => biome.subThemes.length > 0);
               
               const hasMoreNodes = visibleNodesCount < totalNodesInCurriculum;

               return (
                 <>
                 {paginatedMap.map((biome, bIndex) => {
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
                          <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: (i % 10) * 0.1, type: "spring", bounce: 0.4 }}
                            key={subTheme.id} 
                            className={`relative flex flex-col items-center justify-center z-10 group ${currentWidth}`}
                          >
                            
                            {/* Competence Tooltip */}
                           {profile.showCNEBCompetencies && (
                             <div className="absolute -top-12 bg-white/90 backdrop-blur-sm text-slate-800 px-3 py-1.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30 whitespace-nowrap text-xs font-bold">
                               {subTheme.cnebCompetence}
                               <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 rotate-45"></div>
                             </div>
                           )}

                           <div className="relative w-24 h-24 flex items-center justify-center">
                             {/* SVG Progress Ring */}
                             {isUnlocked && (
                               <svg className="absolute w-[116px] h-[116px] transform -rotate-90 pointer-events-none z-0 drop-shadow-md">
                                 <circle
                                   cx="58" cy="58" r="50"
                                   stroke="rgba(255,255,255,0.25)"
                                   strokeWidth="10"
                                   fill="transparent"
                                 />
                                 <circle
                                   cx="58" cy="58" r="50"
                                   stroke={isMastered ? '#fbbf24' : '#60a5fa'}
                                   strokeWidth="10"
                                   fill="transparent"
                                   strokeDasharray={314.16}
                                   strokeDashoffset={314.16 - (progressPercent / 100) * 314.16}
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
                                   ? `${nodeBg} shadow-[0_8px_0_rgba(0,0,0,0.15)] hover:scale-110 hover:-translate-y-2 active:scale-95 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.15)]` 
                                   : 'bg-slate-300/60 dark:bg-slate-800/60 backdrop-blur-md shadow-[0_6px_0_rgba(0,0,0,0.1)] text-white/50 dark:text-slate-500 cursor-not-allowed'
                               }`}
                             >
                               {isUnlocked ? (
                                 isMastered ? <Sparkles size={36} className="text-white drop-shadow-md" /> : <Play size={36} className="ml-1 text-slate-800 drop-shadow-sm" fill="currentColor" />
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
                         </motion.div>
                       );
                     })}
                   </div>
                 </div>
               );
            })}
                 
                 {/* Load More Button */}
                 {hasMoreNodes && (
                   <div className="w-full flex justify-center py-12 bg-slate-900">
                     <button
                       onClick={() => setVisibleNodesCount(prev => prev + 10)}
                       className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95"
                     >
                       Generar 10 niveles más
                     </button>
                   </div>
                 )}
                 </>
               );
            })()}
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
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
               <Loader2 size={48} className="text-white drop-shadow-lg" />
            </motion.div>
          </motion.div>
        )}
        
        {generatingState === 'generating' && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-50 bg-slate-900/70 flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white/10 dark:bg-slate-800/80 backdrop-blur-3xl p-10 rounded-[2rem] w-full max-w-sm border border-white/20 dark:border-slate-700/50 flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.3)] text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-pulse"></div>
              <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 className="relative z-10 mb-6"
              >
                <div className="w-16 h-16 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin"></div>
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-3 relative z-10 tracking-tight">Preparando tu lección</h2>
              <p className="text-indigo-100/80 mb-8 relative z-10 font-medium">
                La IA está creando un desafío perfecto para ti...
              </p>
              <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden relative z-10 p-0.5">
                 <motion.div 
                   className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 h-full w-full rounded-full" 
                   initial={{ x: '-100%' }}
                   animate={{ x: '100%' }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                 />
              </div>
            </motion.div>
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
