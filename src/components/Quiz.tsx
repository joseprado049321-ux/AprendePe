import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, XCircle, HeartPulse, Diamond, Gem, Shield, Zap, Loader2 } from 'lucide-react';
import { Level, Subject, UserProfile } from '../types';
import { getTheme } from '../lib/theme';
import { getQuestions } from '../data';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkAchievements } from '../lib/achievements';
import { useSound } from '../contexts/SoundContext';
import confetti from 'canvas-confetti';
import { calculateDrop, RewardDrop } from '../lib/rewards';

interface QuizProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Quiz({ profile, updateProfile }: QuizProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { playSound } = useSound();
  
  const level: Level = location.state?.level || profile.level;
  const subject: Subject = location.state?.subject || 'Matemáticas';

  const theme = getTheme(level);
  const passedQuestions = location.state?.questions;
  const questions = passedQuestions || getQuestions(level, subject);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const [errors, setErrors] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [lives, setLives] = useState(5); 

  const [showRescueModal, setShowRescueModal] = useState(false);
  const [rescuing, setRescuing] = useState(false);
  const [reward, setReward] = useState<RewardDrop | null>(null);

  const question = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  const handleSelect = (index: number) => {
    if (isAnswered || lives <= 0) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === question?.correctAnswerIndex) {
      playSound('success');
      setSessionPoints(prev => prev + 10);
    } else {
      playSound('fail');
      setErrors(prev => prev + 1);
      const newLives = Math.max(0, lives - 1);
      setLives(newLives); 
      if (newLives === 0 && level !== 'Secundaria') {
         setTimeout(() => setShowRescueModal(true), 500);
      }
    }
  };

  const handleBuyLives = async () => {
    const currentEsmeraldas = profile.wallet?.esmeralda || 0;
    if (currentEsmeraldas < 10) return;
    
    await updateProfile({
        wallet: {
            ...profile.wallet!,
            esmeralda: currentEsmeraldas - 10
        }
    });
    setLives(3);
    setShowRescueModal(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleWatchAd = () => {
    setRescuing(true);
    setTimeout(() => {
        setLives(1);
        setRescuing(false);
        setShowRescueModal(false);
        setSelectedOption(null);
        setIsAnswered(false);
    }, 5000);
  };

  const handleContinue = async () => {
    if (currentIndex < questions.length - 1) {
      playSound('click');
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      playSound('levelUp');
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      });

      const newPoints = profile.points + sessionPoints;
      const newXp = (profile.xp || 0) + sessionPoints;
      
      const today = new Date();
      const lastActiveStr = profile.lastActive;
      let newStreak = profile.streak || 0;
      
      if (lastActiveStr) {
        const lastActive = new Date(lastActiveStr);
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const lastActiveStart = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
        
        const diffDays = Math.round((todayStart.getTime() - lastActiveStart.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        } else if (diffDays === 0 && newStreak === 0) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const weeklyGoals = profile.weeklyGoals ? { ...profile.weeklyGoals } : undefined;
      if (weeklyGoals) {
        weeklyGoals.currentXP += sessionPoints;
        weeklyGoals.tasksCompleted = (weeklyGoals.tasksCompleted || 0) + 1;
      }
      
      const isPerfectLesson = errors === 0;
      
      const newAchievements = checkAchievements(profile.unlockedAchievements, {
        points: newPoints,
        streak: newStreak,
        isPerfectLesson,
        isFirstLesson: profile.unlockedAchievements.length === 0
      });
      
      const updatedAchievements = [...profile.unlockedAchievements, ...newAchievements];

      const historyEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        subject,
        xpEarned: sessionPoints,
        accuracyPercentage: Math.round(((questions.length - errors) / questions.length) * 100),
        livesLost: 5 - lives
      };
      
      const newHistory = [historyEntry, ...(profile.history || [])].slice(0, 10);

      const accuracy = historyEntry.accuracyPercentage;
      const passedNodeId = location.state?.nodeId;
      const newUnlockedLevels = { ...(profile.unlockedLevels || {}) };
      const currentSubjectUnlockedLevel = newUnlockedLevels[subject] || 1;
      
      if (passedNodeId && passedNodeId === currentSubjectUnlockedLevel && accuracy >= 50) {
        newUnlockedLevels[subject] = currentSubjectUnlockedLevel + 1;
      }

      // Calculate reward
      const rewardDrop = calculateDrop();
      const updatedWallet = profile.wallet ? { ...profile.wallet } : { oro: 0, esmeralda: 0, rubi: 0, diamante: 0 };
      const updatedInventory = profile.inventory ? { ...profile.inventory } : { streakProtectors: 0, xpMultipliers: 0 };
      
      if (rewardDrop.type === 'oro') updatedWallet.oro += rewardDrop.amount;
      if (rewardDrop.type === 'esmeralda') updatedWallet.esmeralda += rewardDrop.amount;
      if (rewardDrop.type === 'rubi') updatedWallet.rubi += rewardDrop.amount;
      if (rewardDrop.type === 'diamante') updatedWallet.diamante += rewardDrop.amount;
      if (rewardDrop.type === 'xpMultiplier') updatedInventory.xpMultipliers += rewardDrop.amount;
      if (rewardDrop.type === 'streakProtector') updatedInventory.streakProtectors += rewardDrop.amount;
      
      setReward(rewardDrop);

      try {
        await updateProfile({
          points: newPoints,
          xp: newXp,
          streak: newStreak,
          unlockedLevels: newUnlockedLevels,
          unlockedAchievements: updatedAchievements,
          lastActive: new Date().toISOString(),
          history: newHistory,
          wallet: updatedWallet,
          inventory: updatedInventory,
          ...(weeklyGoals ? { weeklyGoals } : {})
        });
      } catch (e) {
        console.error("Error saving gamification data", e);
      }
    }
  };

  const isCorrect = selectedOption === question.correctAnswerIndex;

  const getRewardIcon = (type: string) => {
      switch(type) {
          case 'oro': return <Diamond className="text-amber-400" size={48} />;
          case 'esmeralda': return <Gem className="text-emerald-400" size={48} />;
          case 'rubi': return <Diamond className="text-rose-500" size={48} />;
          case 'diamante': return <Diamond className="text-cyan-400" size={48} />;
          case 'streakProtector': return <Shield className="text-indigo-400" size={48} />;
          case 'xpMultiplier': return <Zap className="text-amber-500" size={48} />;
          default: return null;
      }
  };

  const getRewardName = (type: string) => {
      switch(type) {
          case 'oro': return 'Gemas de Oro';
          case 'esmeralda': return 'Esmeraldas';
          case 'rubi': return 'Rubíes';
          case 'diamante': return 'Diamantes';
          case 'streakProtector': return 'Protector de Racha';
          case 'xpMultiplier': return 'Multiplicador XP';
          default: return '';
      }
  };

  return (
    <div className={`${theme.appBg} flex flex-col h-screen overflow-hidden relative`}>
      {/* Rescue Modal */}
      <AnimatePresence>
          {showRescueModal && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4"
              >
                  <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center"
                  >
                      <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                          <HeartPulse className="text-rose-500" size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Te has quedado sin vidas!</h2>
                      
                      {rescuing ? (
                          <div className="py-8 flex flex-col items-center gap-4">
                              <Loader2 className="animate-spin text-indigo-500" size={40} />
                              <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Viendo anuncio patrocinado...</p>
                          </div>
                      ) : (
                          <>
                              <p className="text-slate-600 dark:text-slate-400 mb-8">No te rindas ahora. Recupera vidas para continuar la lección.</p>
                              
                              <div className="w-full space-y-3">
                                  <button 
                                      onClick={handleBuyLives}
                                      disabled={(profile.wallet?.esmeralda || 0) < 10}
                                      className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-between"
                                  >
                                      <span>Recuperar 3 Vidas</span>
                                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                                          <Gem size={18} />
                                          <span>10</span>
                                      </div>
                                  </button>
                                  
                                  <button 
                                      onClick={handleWatchAd}
                                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                                  >
                                      <Zap size={20} />
                                      Ver Anuncio (1 Vida)
                                  </button>
                                  
                                  <button 
                                      onClick={() => navigate('/home')}
                                      className="w-full mt-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold py-3 transition-colors"
                                  >
                                      Rendirse y salir
                                  </button>
                              </div>
                          </>
                      )}
                  </motion.div>
              </motion.div>
          )}

          {/* Reward Modal */}
          {reward && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-[60] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4"
              >
                  <motion.div 
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center border-t-8 border-indigo-500"
                  >
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">¡Lección Completada!</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Has obtenido una recompensa especial</p>
                      
                      <div className="bg-slate-50 dark:bg-slate-900 w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-inner mb-6 border-4 border-slate-100 dark:border-slate-700">
                          <motion.div
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                          >
                              {getRewardIcon(reward.type)}
                          </motion.div>
                      </div>
                      
                      <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="mb-8"
                      >
                          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">+{reward.amount} {getRewardName(reward.type)}</h3>
                          <p className="text-sm text-indigo-500 font-bold mt-2">+{sessionPoints} XP</p>
                      </motion.div>

                      <button 
                          onClick={() => navigate('/home')}
                          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform active:scale-95"
                      >
                          Continuar
                      </button>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      <div className="pt-8 pb-4 px-4 sm:px-8 max-w-4xl mx-auto w-full flex items-center gap-6">
        <button onClick={() => navigate('/home')} className="text-slate-400 hover:text-slate-500 transition-colors cursor-pointer">
          <X size={28} strokeWidth={2.5} />
        </button>
        <div className={`grow ${theme.progressBg}`}>
          <div className={theme.progressFill} style={{ width: `${progress}%` }} />
        </div>
        {level !== 'Secundaria' && (
          <div className="flex items-center gap-1.5 text-rose-500 font-bold shrink-0">
            <HeartPulse size={28} />
            <span className="text-xl">{lives}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-48">
        <div className="w-full max-w-3xl mx-auto px-4 pt-4 sm:pt-12 h-full flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex-grow flex flex-col justify-center"
            >
              <div className="w-full space-y-2 mb-8 sm:mb-12">
                {level === 'Secundaria' && (
                  <span className={`${theme.iconColor} font-bold uppercase tracking-widest text-sm text-center sm:text-left block`}>
                    Materia: {subject}
                  </span>
                )}
                <h1 className={`${theme.textHeading} text-center sm:text-left leading-tight py-4 mb-0`}>
                  {question.text}
                </h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
                {question.options.map((opt, i) => {
                  let btnStateClass = theme.buttonDefault;
                  if (isAnswered) {
                    if (i === question.correctAnswerIndex) {
                      btnStateClass = theme.buttonCorrect;
                    } else if (i === selectedOption) {
                      btnStateClass = theme.buttonIncorrect;
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={isAnswered || lives <= 0}
                      onClick={() => handleSelect(i)}
                      className={`${theme.buttonClass} ${btnStateClass} min-h-[100px] cursor-pointer`}
                    >
                      {level === 'Secundaria' && (
                        <span className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg font-bold transition-colors ${
                          isAnswered && i === question.correctAnswerIndex ? 'bg-emerald-500 text-white' : 
                          isAnswered && i === selectedOption ? 'bg-rose-500 text-white' : 
                          'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}>
                          {i + 1}
                        </span>
                      )}
                      <span className={theme.buttonText}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-inherit"
          >
            <div className={`${isCorrect ? theme.panelCorrect : theme.panelIncorrect}`}>
              <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row gap-6 justify-between items-center sm:items-end">
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    {isCorrect ? (
                      <CheckCircle strokeWidth={2.5} className="w-8 h-8 text-white" />
                    ) : (
                      <XCircle strokeWidth={2.5} className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-xl sm:text-2xl mb-1 text-white">
                      {isCorrect ? '¡Excelente!' : 'Casi lo logras'}
                    </h2>
                    <p className="text-base sm:text-lg text-white opacity-90">
                       {question.explanation}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleContinue}
                  className={`${isCorrect ? theme.panelButtonCorrect : theme.panelButtonIncorrect} shrink-0`}
                >
                  Continuar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
