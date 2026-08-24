import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, XCircle, HeartPulse, Diamond, Gem, Shield, Zap, Loader2, Heart, Sparkles, Lightbulb, HelpCircle, BookOpen, ChevronDown } from 'lucide-react';
import { Level, Subject, UserProfile, MistakeItem } from '../types';
import { getTheme } from '../lib/theme';
import { getQuestions } from '../data';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkAchievements } from '../lib/achievements';
import { useSound } from '../contexts/SoundContext';
import confetti from 'canvas-confetti';
import { calculateDrop, RewardDrop } from '../lib/rewards';
import { useLives } from '../hooks/useLives';

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
  const { currentLives: lives } = useLives(profile, updateProfile);

  const [showOutOfLivesModal, setShowOutOfLivesModal] = useState(false);
  const [rescuing, setRescuing] = useState(false);
  const [reward, setReward] = useState<RewardDrop | null>(null);

  // AI Explanation State
  const [showAiModal, setShowAiModal] = useState(false);
  const [showInlineExplanation, setShowInlineExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<{ explanation: string; tip: string; keyConcept: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const question = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  const fetchAiExplanation = async (selectedIdx: number) => {
    setLoadingAi(true);
    setAiExplanation(null);

    try {
      const res = await fetch('/api/explain-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.text,
          options: question.options,
          userAnswer: question.options[selectedIdx] || '',
          correctAnswer: question.options[question.correctAnswerIndex],
          subject,
          stage: profile.educationalStage || profile.level || 'Primaria'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data);
      } else {
        setAiExplanation({
          explanation: question.explanation || `La respuesta correcta es "${question.options[question.correctAnswerIndex]}".`,
          tip: '¡Sigue practicando para dominar este concepto!',
          keyConcept: subject
        });
      }
    } catch (err) {
      setAiExplanation({
        explanation: question.explanation || `La respuesta correcta es "${question.options[question.correctAnswerIndex]}".`,
        tip: '¡Sigue practicando para dominar este concepto!',
        keyConcept: subject
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSelect = async (index: number) => {
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

      // Disparar explicación de IA directamente
      fetchAiExplanation(index);

      // Guardar en el Baúl de Errores (mistakeBank)
      const existingMistakes = profile.mistakeBank || [];
      const exists = existingMistakes.some(m => m.question.text === question.text);
      let updatedMistakeBank: MistakeItem[];

      if (exists) {
        updatedMistakeBank = existingMistakes.map(m => 
          m.question.text === question.text
            ? { ...m, failedAt: new Date().toISOString(), userAnswerIndex: index, mastered: false }
            : m
        );
      } else {
        const newMistake: MistakeItem = {
          id: `mistake_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          question: { ...question, subject },
          subject,
          level,
          failedAt: new Date().toISOString(),
          userAnswerIndex: index,
          mastered: false
        };
        updatedMistakeBank = [newMistake, ...existingMistakes];
      }

      const updates: Partial<UserProfile> = { lives: newLives, mistakeBank: updatedMistakeBank };
      if (lives === 5 && newLives < 5) {
        updates.livesUpdatedAt = new Date().toISOString();
      }
      await updateProfile(updates);
      
      if (newLives === 0) {
         setTimeout(() => setShowOutOfLivesModal(true), 500);
      }
    }
  };

  const handleOpenAiExplanation = () => {
    playSound('click');
    setShowAiModal(true);
    if (!aiExplanation && selectedOption !== null) {
      fetchAiExplanation(selectedOption);
    }
  };

  const handleBuyLives = async () => {
    const currentEsmeralda = profile.wallet?.esmeralda || 0;
    if (currentEsmeralda < 5) return;
    
    await updateProfile({
        wallet: {
            ...profile.wallet!,
            esmeralda: currentEsmeralda - 5
        },
        lives: lives + 1
    });
    setShowOutOfLivesModal(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowAiModal(false);
    setAiExplanation(null);
    setLoadingAi(false);
  };

  const handleWatchAd = () => {
    setRescuing(true);
    setTimeout(async () => {
        await updateProfile({ lives: lives + 1 });
        setRescuing(false);
        setShowOutOfLivesModal(false);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowAiModal(false);
        setAiExplanation(null);
        setLoadingAi(false);
    }, 3000);
  };

  const handleContinue = async () => {
    setShowAiModal(false);
    setShowInlineExplanation(false);
    setAiExplanation(null);
    setLoadingAi(false);

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
      let newPerfectStreak = profile.perfectLessonsStreak || 0;
      let earnedEmeraldFromStreak = false;

      if (isPerfectLesson) {
        newPerfectStreak += 1;
        if (newPerfectStreak >= 3) {
          earnedEmeraldFromStreak = true;
          newPerfectStreak = 0;
        }
      } else {
        newPerfectStreak = 0;
      }
      
      const newAchievements = checkAchievements(profile.unlockedAchievements || [], {
        points: newPoints,
        streak: newStreak,
        isPerfectLesson,
        isFirstLesson: !profile.unlockedAchievements || profile.unlockedAchievements.length === 0,
        livesLeft: lives
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
      if (rewardDrop.type === 'xpMultiplier') updatedInventory.xpMultipliers += rewardDrop.amount;
      if (rewardDrop.type === 'streakProtector') updatedInventory.streakProtectors += rewardDrop.amount;
      
      if (earnedEmeraldFromStreak) {
        updatedWallet.esmeralda += 1;
        if (rewardDrop.type === 'esmeralda') {
           setReward({ type: 'esmeralda', amount: rewardDrop.amount + 1 });
        } else if (rewardDrop.type === 'none') {
           setReward({ type: 'esmeralda', amount: 1 });
        } else {
           setReward(rewardDrop);
        }
      } else {
        setReward(rewardDrop);
      }

      try {
        await updateProfile({
          points: newPoints,
          xp: newXp,
          streak: newStreak,
          perfectLessonsStreak: newPerfectStreak,
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
          case 'streakProtector': return <Shield className="text-indigo-400" size={48} />;
          case 'xpMultiplier': return <Zap className="text-amber-500" size={48} />;
          default: return null;
      }
  };

  const getRewardName = (type: string) => {
      switch(type) {
          case 'oro': return 'Oro';
          case 'esmeralda': return 'Esmeraldas';
          case 'streakProtector': return 'Protector de Racha';
          case 'xpMultiplier': return 'Multiplicador XP';
          default: return '';
      }
  };

  return (
    <div className={`${theme.appBg} flex flex-col h-screen overflow-hidden relative`}>
      {/* Rescue Modal */}
      <AnimatePresence>
          {showOutOfLivesModal && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4"
              >
                  <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center"
                  >
                      <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/40 rounded-full flex items-center justify-center mb-6">
                          <HeartPulse className="text-rose-500" size={40} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">¡Te has quedado sin vidas!</h2>
                      
                      {rescuing ? (
                          <div className="py-8 flex flex-col items-center gap-4">
                              <Loader2 className="animate-spin text-indigo-500" size={48} />
                              <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Viendo anuncio patrocinado...</p>
                          </div>
                      ) : (
                          <>
                              <p className="text-slate-600 dark:text-slate-400 mb-8">No te rindas ahora. Recupera vidas para continuar tu racha de aprendizaje.</p>
                              
                              <div className="w-full space-y-4">
                                  {(profile.wallet?.esmeralda || 0) < 5 ? (
                                      <div className="w-full text-rose-500 dark:text-rose-400 text-sm font-semibold mb-2">
                                          Saldo insuficiente (Necesitas 5 Esmeraldas)
                                      </div>
                                  ) : null}
                                  <button 
                                      onClick={handleBuyLives}
                                      disabled={(profile.wallet?.esmeralda || 0) < 5}
                                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-between cursor-pointer disabled:cursor-not-allowed"
                                  >
                                      <span className="text-lg">Recuperar 1 Vida</span>
                                      <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl">
                                          <Gem size={18} className="text-emerald-400 fill-current" />
                                          <span>5</span>
                                      </div>
                                  </button>
                                  
                                  <button 
                                      onClick={handleWatchAd}
                                      className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold py-4 px-6 rounded-2xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                                  >
                                      <Zap size={22} className="text-emerald-500 dark:text-emerald-400" />
                                      <span className="text-lg">Ver anuncio (1 Vida)</span>
                                  </button>
                                  
                                  <button 
                                      onClick={() => navigate('/home')}
                                      className="w-full mt-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold py-3 transition-colors text-base cursor-pointer"
                                  >
                                      Salir al Mapa
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
                          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                      >
                          Continuar
                      </button>
                  </motion.div>
              </motion.div>
          )}

          {/* AI Explanation Modal */}
          {showAiModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[70] bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tutor de IA AprendePe</h3>
                    <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 mt-0.5">
                      {aiExplanation?.keyConcept || subject}
                    </span>
                  </div>
                </div>

                {loadingAi ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="animate-spin text-indigo-500" size={44} />
                    <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse text-sm sm:text-base">
                      Analizando tu respuesta y preparando una explicación personalizada...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                        <BookOpen size={18} />
                        <span>Explicación Paso a Paso</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                        {aiExplanation?.explanation || question.explanation}
                      </p>
                    </div>

                    {aiExplanation?.tip && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                        <div className="flex items-center gap-2 mb-1.5 text-amber-700 dark:text-amber-400 font-bold text-sm">
                          <Lightbulb size={18} />
                          <span>Consejo de Memoria</span>
                        </div>
                        <p className="text-amber-900 dark:text-amber-200 text-sm font-medium">
                          {aiExplanation.tip}
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                      <span>🎒 Esta pregunta se guardó en tu <strong>Baúl de Errores</strong> para que puedas repasarla sin perder vidas.</span>
                    </div>

                    <button 
                      onClick={() => setShowAiModal(false)}
                      className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                    >
                      ¡Entendido, sigamos!
                    </button>
                  </div>
                )}
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
        <div className="flex items-center gap-1 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart 
              key={i} 
              size={24} 
              className={i < lives ? "text-red-500 fill-current" : "text-slate-200 dark:text-slate-700"} 
            />
          ))}
        </div>
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
                    Materia: {subject} {question.cnebCompetence ? `• ${question.cnebCompetence}` : ''}
                  </span>
                )}
                
                {/* Pregunta o Fill in the Blanks */}
                <h1 className={`${theme.textHeading} text-center sm:text-left leading-tight py-4 mb-0 transition-all duration-300`}>
                  {question.type === 'fill_in_the_blanks' && question.blankSentence
                    ? (
                      <span>
                        {question.blankSentence.split('___')[0]}
                        <span className={`inline-block min-w-[80px] text-center border-b-4 mx-2 px-4 pb-1 transition-colors ${
                          isAnswered && selectedOption === question.correctAnswerIndex ? 'border-emerald-500 text-emerald-500' :
                          isAnswered ? 'border-rose-500 text-rose-500' :
                          selectedOption !== null ? 'border-indigo-500 text-indigo-500' : 'border-slate-300 dark:border-slate-600 text-transparent'
                        }`}>
                          {selectedOption !== null ? question.options[selectedOption] : '____'}
                        </span>
                        {question.blankSentence.split('___')[1]}
                      </span>
                    )
                    : question.text}
                </h1>
                
                {question.type === 'fill_in_the_blanks' && !question.blankSentence && (
                  <h1 className={`${theme.textHeading} text-center sm:text-left leading-tight py-4 mb-0`}>{question.text}</h1>
                )}
              </div>

              <div className={`grid gap-4 auto-rows-fr ${question.type === 'true_false' ? 'grid-cols-2 max-w-lg mx-auto w-full' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {question.options.map((opt, i) => {
                  let btnStateClass = theme.buttonDefault;
                  if (isAnswered) {
                    if (i === question.correctAnswerIndex) {
                      btnStateClass = theme.buttonCorrect;
                    } else if (i === selectedOption) {
                      btnStateClass = theme.buttonIncorrect;
                    }
                  }

                  const isTrueFalse = question.type === 'true_false';

                  return (
                    <motion.button
                      key={i}
                      whileHover={!isAnswered && lives > 0 ? { scale: 1.02 } : {}}
                      whileTap={!isAnswered && lives > 0 ? { scale: 0.95 } : {}}
                      disabled={isAnswered || lives <= 0}
                      onClick={() => handleSelect(i)}
                      className={`${theme.buttonClass} ${btnStateClass} ${isTrueFalse ? 'min-h-[120px] text-xl' : 'min-h-[100px]'} cursor-pointer flex items-center justify-center`}
                    >
                      {level === 'Secundaria' && !isTrueFalse && (
                        <span className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg font-bold transition-colors ${
                          isAnswered && i === question.correctAnswerIndex ? 'bg-emerald-500 text-white' : 
                          isAnswered && i === selectedOption ? 'bg-rose-500 text-white' : 
                          'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}>
                          {i + 1}
                        </span>
                      )}
                      <span className={`${theme.buttonText} ${isTrueFalse ? 'font-black text-2xl' : ''}`}>{opt}</span>
                    </motion.button>
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
            <div className={`${isCorrect ? theme.panelCorrect : theme.panelIncorrect} max-h-[85vh] overflow-y-auto`}>
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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
                      {isCorrect && (
                        <p className="text-base sm:text-lg text-white opacity-90">
                           {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={handleContinue}
                    className={`${isCorrect ? theme.panelButtonCorrect : theme.panelButtonIncorrect} shrink-0 self-end sm:self-auto`}
                  >
                    Continuar
                  </button>
                </div>

                {/* Explicación Detallada de IA Directa */}
                {!isCorrect && (
                  <div className="bg-black/20 dark:bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 text-white shadow-lg space-y-3">
                    <button 
                      onClick={() => setShowInlineExplanation(!showInlineExplanation)}
                      className="w-full flex items-center justify-between gap-2 border-white/15 pb-2 cursor-pointer outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-300 animate-pulse" />
                        <span className="font-extrabold text-sm sm:text-base tracking-wide">
                          Explicación Detallada de tu Tutor IA
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {aiExplanation?.keyConcept && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-amber-200 border border-white/20 hidden sm:inline-block">
                            {aiExplanation.keyConcept}
                          </span>
                        )}
                        <ChevronDown className={`transition-transform duration-300 ${showInlineExplanation ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {showInlineExplanation && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 border-t border-white/15">
                            {loadingAi ? (
                              <div className="py-4 flex items-center gap-3 text-white/90">
                                <Loader2 className="animate-spin text-amber-300 shrink-0" size={24} />
                                <span className="text-sm font-medium animate-pulse">
                                  Tu Tutor de IA está analizando tu respuesta para explicarte con máxima claridad...
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-3 text-sm sm:text-base text-white/95">
                                <p className="leading-relaxed whitespace-pre-line bg-black/15 p-3 rounded-xl border border-white/10">
                                  {aiExplanation?.explanation || question.explanation}
                                </p>

                                {aiExplanation?.tip && (
                                  <div className="flex items-start gap-2.5 bg-amber-500/20 border border-amber-300/40 p-3 rounded-xl text-amber-100 text-xs sm:text-sm font-medium">
                                    <Lightbulb size={18} className="text-amber-300 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="text-amber-200 block mb-0.5">Truco para recordar:</strong>
                                      <span>{aiExplanation.tip}</span>
                                    </div>
                                  </div>
                                )}

                                <div className="text-xs text-white/80 flex items-center justify-between pt-1">
                                  <span>🎒 Guardado en tu <strong>Baúl de Errores</strong> para repasar sin perder vidas.</span>
                                  <button
                                    type="button"
                                    onClick={handleOpenAiExplanation}
                                    className="text-amber-200 underline font-bold hover:text-white cursor-pointer ml-2"
                                  >
                                    Ver en modal
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
