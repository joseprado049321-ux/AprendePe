import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, CheckCircle, XCircle, Sparkles, Lightbulb, 
  ShieldCheck, Award, Zap, RotateCcw, ChevronRight, CheckCircle2, 
  Trash2, HelpCircle, Loader2, Play
} from 'lucide-react';
import { UserProfile, MistakeItem, Subject } from '../types';
import { useSound } from '../contexts/SoundContext';
import confetti from 'canvas-confetti';
import BottomNav from './BottomNav';

interface ReviewProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Review({ profile, updateProfile }: ReviewProps) {
  const navigate = useNavigate();
  const { playSound } = useSound();

  const allMistakes: MistakeItem[] = profile.mistakeBank || [];
  const pendingMistakes = allMistakes.filter(m => !m.mastered);
  const masteredMistakes = allMistakes.filter(m => m.mastered);

  // States
  const [selectedSubject, setSelectedSubject] = useState<string>('Todos');
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceQueue, setPracticeQueue] = useState<MistakeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [masteredInSession, setMasteredInSession] = useState(0);
  const [activeTab, setActiveTab] = useState<'pending' | 'mastered'>('pending');

  // AI explanation state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<{ explanation: string; tip: string; keyConcept: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [inspectingMistake, setInspectingMistake] = useState<MistakeItem | null>(null);

  // Filtered mistakes
  const filteredPending = selectedSubject === 'Todos' 
    ? pendingMistakes 
    : pendingMistakes.filter(m => m.subject === selectedSubject);

  const filteredMastered = selectedSubject === 'Todos' 
    ? masteredMistakes 
    : masteredMistakes.filter(m => m.subject === selectedSubject);

  const subjectsList = ['Todos', 'Matemáticas', 'Comunicación', 'Ciencias', 'Historia', 'Variado'];

  // Start Practice Session
  const handleStartPractice = () => {
    if (filteredPending.length === 0) return;
    playSound('click');
    setPracticeQueue([...filteredPending]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setSessionXp(0);
    setMasteredInSession(0);
    setIsPracticing(true);
  };

  const currentMistake = practiceQueue[currentIndex] || practiceQueue[0];
  const currentQ = currentMistake?.question;

  // Handle Practice Answer
  const handleSelectPracticeOption = async (optionIdx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);

    const isCorrect = optionIdx === currentQ.correctAnswerIndex;

    if (isCorrect) {
      playSound('success');
      setSessionXp(prev => prev + 5);
      setMasteredInSession(prev => prev + 1);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      // Mark this mistake as mastered in profile
      const updatedMistakes = allMistakes.map(m => 
        m.id === currentMistake.id ? { ...m, mastered: true } : m
      );

      const currentXp = profile.xp || 0;
      const currentWallet = profile.wallet || { oro: 0, esmeralda: 0 };

      await updateProfile({
        mistakeBank: updatedMistakes,
        xp: currentXp + 5,
        wallet: {
          ...currentWallet,
          oro: currentWallet.oro + 2
        }
      });
    } else {
      playSound('fail');
      // Obtener explicación de IA directamente
      handleFetchAiInline(currentMistake, optionIdx);
    }
  };

  const handleFetchAiInline = async (item: MistakeItem, chosenAnswerIdx?: number) => {
    setLoadingAi(true);
    setAiExplanation(null);
    const q = item.question;
    const ansIdx = chosenAnswerIdx !== undefined ? chosenAnswerIdx : item.userAnswerIndex;
    const userAns = ansIdx !== undefined && q.options[ansIdx] ? q.options[ansIdx] : 'Respuesta errónea';

    try {
      const res = await fetch('/api/explain-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: q.text,
          options: q.options,
          userAnswer: userAns,
          correctAnswer: q.options[q.correctAnswerIndex],
          subject: item.subject,
          stage: profile.educationalStage || profile.level || 'Primaria'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data);
      } else {
        setAiExplanation({
          explanation: q.explanation || `La respuesta correcta es "${q.options[q.correctAnswerIndex]}".`,
          tip: '¡Sigue practicando para consolidar este aprendizaje!',
          keyConcept: item.subject
        });
      }
    } catch {
      setAiExplanation({
        explanation: q.explanation || `La respuesta correcta es "${q.options[q.correctAnswerIndex]}".`,
        tip: '¡Sigue practicando para consolidar este aprendizaje!',
        keyConcept: item.subject
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleNextPracticeQuestion = () => {
    setShowAiModal(false);
    setAiExplanation(null);
    setLoadingAi(false);

    if (currentIndex < practiceQueue.length - 1) {
      playSound('click');
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      playSound('levelUp');
      setIsPracticing(false);
    }
  };

  const handleFetchAiForCurrent = async (item: MistakeItem, chosenAnswerIdx?: number) => {
    playSound('click');
    setInspectingMistake(item);
    setShowAiModal(true);
    setLoadingAi(true);

    const q = item.question;
    const ansIdx = chosenAnswerIdx !== undefined ? chosenAnswerIdx : item.userAnswerIndex;
    const userAns = ansIdx !== undefined && q.options[ansIdx] ? q.options[ansIdx] : 'Respuesta errónea';

    try {
      const res = await fetch('/api/explain-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: q.text,
          options: q.options,
          userAnswer: userAns,
          correctAnswer: q.options[q.correctAnswerIndex],
          subject: item.subject,
          stage: profile.educationalStage || profile.level || 'Primaria'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data);
      } else {
        setAiExplanation({
          explanation: q.explanation || `La respuesta correcta es "${q.options[q.correctAnswerIndex]}".`,
          tip: '¡Sigue practicando para consolidar este aprendizaje!',
          keyConcept: item.subject
        });
      }
    } catch {
      setAiExplanation({
        explanation: q.explanation || `La respuesta correcta es "${q.options[q.correctAnswerIndex]}".`,
        tip: '¡Sigue practicando para consolidar este aprendizaje!',
        keyConcept: item.subject
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleRemoveMistake = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    const updated = allMistakes.filter(m => m.id !== id);
    await updateProfile({ mistakeBank: updated });
  };

  return (
    <div className="min-h-screen bg-[var(--bg,theme(colors.slate.50))] text-[var(--text,theme(colors.slate.900))] dark:bg-[var(--bg,theme(colors.slate.900))] dark:text-[var(--text,white)] flex flex-col pb-24 transition-colors">
      
      {/* AI Explanation Modal */}
      <AnimatePresence>
        {showAiModal && inspectingMistake && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => { setShowAiModal(false); setInspectingMistake(null); }}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XCircle size={22} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tutor Pedagógico IA</h3>
                  <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 mt-0.5">
                    {aiExplanation?.keyConcept || inspectingMistake.subject}
                  </span>
                </div>
              </div>

              {loadingAi ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 className="animate-spin text-indigo-500" size={44} />
                  <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse text-sm sm:text-base">
                    Preparando explicación pedagógica personalizada...
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
                      {aiExplanation?.explanation || inspectingMistake.question.explanation}
                    </p>
                  </div>

                  {aiExplanation?.tip && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                      <div className="flex items-center gap-2 mb-1.5 text-amber-700 dark:text-amber-400 font-bold text-sm">
                        <Lightbulb size={18} />
                        <span>Consejo / Truco de Memoria</span>
                      </div>
                      <p className="text-amber-900 dark:text-amber-200 text-sm font-medium">
                        {aiExplanation.tip}
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={() => { setShowAiModal(false); setInspectingMistake(null); }}
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    ¡Entendido!
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW: Interactive Practice Session */}
      {isPracticing && currentMistake ? (
        <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <button 
              onClick={() => setIsPracticing(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={24} />
            </button>

            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                <span>Pregunta {currentIndex + 1} de {practiceQueue.length}</span>
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <ShieldCheck size={16} /> Modo Seguro (Sin pérdida de vidas)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / practiceQueue.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="flex-1 flex flex-col justify-center my-auto py-4">
            <div className="mb-6">
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3">
                {currentMistake.subject}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.text}
              </h2>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-indigo-400 shadow-sm";
                
                if (isAnswered) {
                  if (idx === currentQ.correctAnswerIndex) {
                    btnStyle = "bg-emerald-500 border-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20";
                  } else if (idx === selectedOption) {
                    btnStyle = "bg-rose-500 border-rose-600 text-white font-bold shadow-lg shadow-rose-500/20";
                  } else {
                    btnStyle = "opacity-40 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectPracticeOption(idx)}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-medium text-base sm:text-lg transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === currentQ.correctAnswerIndex && (
                      <CheckCircle className="text-white shrink-0 ml-2" size={22} />
                    )}
                    {isAnswered && idx === selectedOption && idx !== currentQ.correctAnswerIndex && (
                      <XCircle className="text-white shrink-0 ml-2" size={22} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Bottom Sheet */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="mt-auto bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {selectedOption === currentQ.correctAnswerIndex ? (
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Award size={24} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <HelpCircle size={24} />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                        {selectedOption === currentQ.correctAnswerIndex ? '¡Concepto Dominado! 🎉 (+5 XP)' : 'Casi, ¡revisa la explicación!'}
                      </h4>
                      {selectedOption === currentQ.correctAnswerIndex && (
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          {currentQ.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleNextPracticeQuestion}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0 self-end sm:self-auto"
                  >
                    {currentIndex < practiceQueue.length - 1 ? 'Siguiente Pregunta' : 'Terminar Repaso'}
                  </button>
                </div>

                {/* Direct AI Explanation Card for Practice Mistake */}
                {selectedOption !== currentQ.correctAnswerIndex && (
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-inner space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500 animate-pulse" />
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          Explicación Detallada de tu Tutor IA
                        </span>
                      </div>
                      {aiExplanation?.keyConcept && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {aiExplanation.keyConcept}
                        </span>
                      )}
                    </div>

                    {loadingAi ? (
                      <div className="py-4 flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <Loader2 className="animate-spin text-indigo-500 shrink-0" size={22} />
                        <span className="text-sm font-medium animate-pulse">
                          Tu Tutor de IA está analizando tu respuesta para explicarte con total claridad...
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm sm:text-base">
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                          {aiExplanation?.explanation || currentQ.explanation}
                        </p>

                        {aiExplanation?.tip && (
                          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-xl text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium">
                            <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">Truco para recordar:</strong>
                              <span>{aiExplanation.tip}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* VIEW: Overview & Mistake Bank List */
        <div className="max-w-4xl mx-auto w-full px-4 pt-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/home')}
                className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎒 Baúl de Errores</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Repasa tus preguntas falladas a tu propio ritmo y sin perder vidas.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none block">
                  {pendingMistakes.length}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Por repasar</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none block">
                  {masteredMistakes.length}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Dominadas</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold opacity-80 block tracking-wider">Modo Seguro</span>
                <span className="text-lg font-bold">Sin perder vidas</span>
              </div>
              <ShieldCheck size={32} className="opacity-90" />
            </div>
          </div>

          {/* Primary Action Button (Start Practice) */}
          {pendingMistakes.length > 0 && (
            <button
              onClick={handleStartPractice}
              className="w-full mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-between transition-all transform active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Play size={20} className="fill-current ml-0.5" />
                </div>
                <div>
                  <div className="text-lg font-bold">¡Iniciar Práctica de Repaso!</div>
                  <div className="text-xs text-indigo-100 font-medium">
                    Practica {filteredPending.length} {filteredPending.length === 1 ? 'pregunta' : 'preguntas'} ({selectedSubject})
                  </div>
                </div>
              </div>
              <span className="bg-white/20 text-xs px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider">
                +5 XP c/u
              </span>
            </button>
          )}

          {/* Subjects Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
            {subjectsList.map(s => {
              const count = s === 'Todos' 
                ? pendingMistakes.length 
                : pendingMistakes.filter(m => m.subject === s).length;

              return (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedSubject === s
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{s}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedSubject === s ? 'bg-white/30 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tabs: Pendientes vs Dominadas */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 px-4 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Por Repasar ({filteredPending.length})
            </button>
            <button
              onClick={() => setActiveTab('mastered')}
              className={`pb-3 px-4 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer ${
                activeTab === 'mastered'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Dominadas ({filteredMastered.length})
            </button>
          </div>

          {/* Content */}
          {activeTab === 'pending' ? (
            filteredPending.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={44} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  ¡Tu Baúl de Errores está limpio! 🎉
                </h3>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  No tienes preguntas pendientes en esta sección. Sigue aprendiendo en las lecciones para poner a prueba tus habilidades.
                </p>
                <button
                  onClick={() => navigate('/home')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  Ir al Mapa de Niveles
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPending.map(item => {
                  const q = item.question;
                  const userAns = item.userAnswerIndex !== undefined && q.options[item.userAnswerIndex] 
                    ? q.options[item.userAnswerIndex] 
                    : null;
                  const correctAns = q.options[q.correctAnswerIndex];

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.subject}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFetchAiForCurrent(item)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800"
                          >
                            <Sparkles size={14} className="text-amber-400" />
                            <span>Explicar con IA</span>
                          </button>
                          <button
                            onClick={(e) => handleRemoveMistake(item.id, e)}
                            title="Eliminar de la lista"
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                        {q.text}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        {userAns && (
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 flex items-center gap-2">
                            <XCircle size={16} className="text-rose-500 shrink-0" />
                            <span>Tu respuesta: <strong>{userAns}</strong></span>
                          </div>
                        )}
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                          <span>Correcta: <strong>{correctAns}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            filteredMastered.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aún no has dominado preguntas en esta categoría. ¡Inicia una sesión de práctica de repaso para dominarlas!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMastered.map(item => (
                  <div
                    key={item.id}
                    className="bg-white/70 dark:bg-slate-800/50 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            {item.subject}
                          </span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">¡Dominada! ✨</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {item.question.text}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFetchAiForCurrent(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                      title="Ver explicación de IA"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      {!isPracticing && <BottomNav activeTab="/review" onChangeTab={(tab) => navigate(tab)} />}
    </div>
  );
}
