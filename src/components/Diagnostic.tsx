import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Level } from '../types';
import { Brain, ArrowRight, Loader2, Sparkles, Target, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../contexts/SoundContext';
import confetti from 'canvas-confetti';

interface DiagnosticProps {
  profile?: UserProfile;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Diagnostic({ profile, updateProfile }: DiagnosticProps = {}) {
  const [step, setStep] = useState(0); // 0: Welcome, 1: Stage, 2: Grade, 3: Self-eval, 4: Diagnostic Fetch, 5: Quiz, 6: Results
  
  // Collected data
  const [stage, setStage] = useState<'Inicial' | 'Primaria' | 'Secundaria' | ''>('');
  const [grade, setGrade] = useState('');
  const [selfLevel, setSelfLevel] = useState('');
  
  // Diagnostic quiz state
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();
  const { playSound } = useSound();

  const handleNextStep = (newStep: number) => {
    playSound('click');
    setStep(newStep);
  };

  const startDiagnostic = async (selectedSelfLevel: string) => {
    setSelfLevel(selectedSelfLevel);
    handleNextStep(4);
    
    try {
      const res = await fetch('/api/generate-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educationalStage: stage, grade, selfAssessedLevel: selectedSelfLevel })
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setStep(5);
    } catch (err) {
      console.error(err);
      // Fallback in case of error (10 questions instead of 5)
      setQuestions(Array.from({ length: 10 }, (_, i) => ({
        text: `Pregunta diagnóstica #${i + 1} (Modo sin conexión)`,
        options: ["A", "B", "C", "D"],
        correctAnswerIndex: 0,
        explanation: "Respaldo por error de conexión."
      })));
      setStep(5);
    }
  };

  const handleAnswer = async (index: number) => {
    playSound('click');
    const isCorrect = index === questions[currentQ].correctAnswerIndex;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      playSound('levelUp');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      });
      setStep(6);
    }
  };

  const finishDiagnostic = async () => {
    playSound('click');
    setIsSaving(true);
    const percentage = Math.round((score / questions.length) * 100);
    let calculatedLevel: Level = 'Inicial';
    if (stage === 'Secundaria') calculatedLevel = 'Secundaria';
    else if (stage === 'Primaria') calculatedLevel = 'Primaria';

    try {
      const currentXp = profile?.xp || 0;
      const diagnosticData = {
        educationalStage: stage as any,
        grade,
        selfAssessedLevel: selfLevel,
        diagnosticScore: percentage,
        diagnosticLevel: calculatedLevel, 
        level: calculatedLevel,
        xp: currentXp + 100 // +100 XP por completar el diagnóstico
      };

      if (updateProfile && profile) {
        await updateProfile({ ...diagnosticData, hasCompletedDiagnostic: true });
        navigate('/home');
      } else {
        localStorage.setItem('temp_onboarding', JSON.stringify(diagnosticData));
        navigate('/login');
      }
    } catch (err) {
      console.error('Error saving diagnostic', err);
      setIsSaving(false);
    }
  };

  const themeClass = stage ? `theme-${stage.toLowerCase()}` : '';

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-500 flex flex-col items-center justify-center p-4 sm:p-8 ${themeClass}`}>
      <div className="max-w-xl w-full bg-white dark:bg-slate-800/90 p-8 rounded-[var(--radius,24px)] border border-slate-200 dark:border-slate-700 shadow-2xl relative overflow-hidden">
        
        {/* Progreso del Onboarding (Oculto en quiz y resultados) */}
        {step < 5 && (
          <div className="flex gap-2 justify-center mb-8">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step >= i ? 'w-8 bg-[var(--math,theme(colors.indigo.500))]' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* PASO 0: Bienvenida */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-[var(--math,theme(colors.indigo.500))] rounded-full flex items-center justify-center shadow-[0_8px_0_var(--math-s,theme(colors.indigo.700))] text-5xl mb-4 text-white">
                👋
              </div>
              <h1 className="text-3xl font-bold font-playful text-slate-900 dark:text-white">¡Hola! Soy tu tutor virtual de AprendePe</h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Estoy aquí para adaptarme a tu ritmo de aprendizaje. Primero, cuéntame un poco sobre ti para personalizar tu experiencia.
              </p>
              <button onClick={() => handleNextStep(1)} className="mt-4 w-full py-4 bg-[var(--math,theme(colors.indigo.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-2xl text-white font-bold text-xl shadow-[0_6px_0_var(--math-s,theme(colors.indigo.700))] cursor-pointer">
                ¡Empezar!
              </button>
            </motion.div>
          )}

          {/* PASO 1: Etapa Escolar */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center flex flex-col gap-6">
              <h2 className="text-3xl font-bold font-playful mb-2 text-slate-900 dark:text-white">¿En qué etapa escolar estás?</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Esto cambiará el diseño y los ejercicios para ti.</p>
              
              <div className="flex flex-col gap-4">
                {(['Inicial', 'Primaria', 'Secundaria'] as const).map(s => (
                  <button 
                    key={s} 
                    onClick={() => { setStage(s); handleNextStep(2); }} 
                    className="p-6 bg-[var(--math,theme(colors.indigo.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-white font-bold text-xl flex items-center justify-between shadow-[0_6px_0_var(--math-s,theme(colors.indigo.700))] cursor-pointer"
                  >
                    <span>{s === 'Inicial' ? '🧸' : s === 'Primaria' ? '🏫' : '🎓'} {s}</span>
                    <ArrowRight />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PASO 2: Grado */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center flex flex-col gap-6">
              <h2 className="text-3xl font-bold font-playful mb-2 text-slate-900 dark:text-white">¿Qué grado de {stage}?</h2>
              <div className="grid grid-cols-2 gap-4">
                {stage === 'Inicial' && ['3 años', '4 años', '5 años'].map(g => (
                  <button key={g} onClick={() => { setGrade(g); handleNextStep(3); }} className="p-4 bg-[var(--comm,theme(colors.amber.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-white font-bold text-lg shadow-[0_6px_0_var(--comm-s,theme(colors.amber.700))] cursor-pointer">
                    {g}
                  </button>
                ))}
                {stage === 'Primaria' && ['1ero', '2do', '3ero', '4to', '5to', '6to'].map(g => (
                  <button key={g} onClick={() => { setGrade(g); handleNextStep(3); }} className="p-4 bg-[var(--science,theme(colors.emerald.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-white font-bold text-lg shadow-[0_6px_0_var(--science-s,theme(colors.emerald.700))] cursor-pointer">
                    {g}
                  </button>
                ))}
                {stage === 'Secundaria' && ['1ero', '2do', '3ero', '4to', '5to'].map(g => (
                  <button key={g} onClick={() => { setGrade(g); handleNextStep(3); }} className="p-4 bg-[var(--social,theme(colors.rose.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-white font-bold text-lg shadow-[0_6px_0_var(--social-s,theme(colors.rose.700))] cursor-pointer">
                    {g}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PASO 3: Autoevaluación */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center flex flex-col gap-6">
              <h2 className="text-3xl font-bold font-playful mb-2 text-slate-900 dark:text-white">¿Cómo consideras tu nivel actual?</h2>
              <div className="flex flex-col gap-4">
                <button onClick={() => startDiagnostic('Principiante')} className="p-5 bg-[var(--math,theme(colors.indigo.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-white font-bold text-xl shadow-[0_6px_0_var(--math-s,theme(colors.indigo.700))] cursor-pointer">
                  🌱 Principiante
                </button>
                <button onClick={() => startDiagnostic('Intermedio')} className="p-5 bg-[var(--comm,theme(colors.amber.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-white font-bold text-xl shadow-[0_6px_0_var(--comm-s,theme(colors.amber.700))] cursor-pointer">
                  ⚡ Intermedio
                </button>
                <button onClick={() => startDiagnostic('Avanzado')} className="p-5 bg-[var(--social,theme(colors.rose.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-white font-bold text-xl shadow-[0_6px_0_var(--social-s,theme(colors.rose.700))] cursor-pointer">
                  🔥 Avanzado
                </button>
              </div>
            </motion.div>
          )}

          {/* PASO 4: Loading Quiz */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
              <Loader2 size={64} className="text-[var(--math,theme(colors.indigo.500))] animate-spin mb-6" />
              <h2 className="text-2xl font-bold font-playful mb-2 text-slate-900 dark:text-white">Generando tu prueba personalizada...</h2>
              <p className="text-slate-600 dark:text-slate-400 text-center">Nuestra IA está creando un test personalizado de 10 preguntas para {grade} de {stage} basado en el CNEB.</p>
            </motion.div>
          )}

          {/* PASO 5: Quiz Activo */}
          {step === 5 && questions.length > 0 && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col w-full">
              <header className="flex items-center gap-4 mb-8">
                <div className="bg-[var(--math,theme(colors.indigo.500))] text-white p-3 rounded-2xl">
                  <Brain size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-playful text-slate-900 dark:text-white">Prueba Diagnóstica</h1>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Pregunta <span>{currentQ + 1}</span> de <span>{questions.length}</span></p>
                </div>
              </header>

              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-8 overflow-hidden">
                <div 
                  className="bg-[var(--math,theme(colors.indigo.500))] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentQ / questions.length) * 100}%` }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                  <h2 className="text-2xl font-semibold leading-relaxed text-slate-900 dark:text-white">{questions[currentQ].text}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {questions[currentQ].options.map((opt: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className="bg-slate-100 dark:bg-slate-700/60 hover:bg-[var(--math,theme(colors.indigo.500))] hover:text-white text-slate-800 dark:text-white font-medium p-5 rounded-2xl text-left transition-all flex items-center justify-between group active:scale-95 border-2 border-transparent hover:border-[var(--math-s,theme(colors.indigo.600))] cursor-pointer shadow-sm"
                      >
                        <span>{opt}</span>
                        <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {/* PASO 6: Resultados Literal (MINEDU) */}
          {step === 6 && !isSaving && (() => {
            const percentage = Math.round((score / questions.length) * 100);
            let letter = 'C'; 
            let message = ''; 
            let colorClass = '';

            if (percentage >= 90) { 
              letter = 'AD'; 
              message = '¡Excepcional! Tu conocimiento es sobresaliente.'; 
              colorClass = 'text-indigo-500'; 
            } else if (percentage >= 75) { 
              letter = 'A'; 
              message = '¡Gran trabajo! Tienes bases muy sólidas.'; 
              colorClass = 'text-emerald-500'; 
            } else if (percentage >= 50) { 
              letter = 'B'; 
              message = '¡Buen esfuerzo! Estás en camino a dominar estos temas.'; 
              colorClass = 'text-amber-500'; 
            } else { 
              letter = 'C'; 
              message = '¡Punto de partida establecido! Tu aventura para mejorar comienza aquí.'; 
              colorClass = 'text-rose-500'; 
            }

            return (
              <motion.div key="step6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center">
                <div className="mb-6 flex justify-center">
                   <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                     <Award size={48} className="text-indigo-500" />
                   </div>
                </div>
                
                <h2 className="text-xl font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Resultado Oficial</h2>
                <div translate="no" className={`text-8xl md:text-9xl font-bold font-playful mb-6 ${colorClass} drop-shadow-sm`}>
                  {letter}
                </div>
                
                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-4 px-4">{message}</p>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-full mb-10">
                  {score}/{questions.length} respuestas correctas
                </p>
                
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-2 text-indigo-500 font-bold mb-2">
                    <Sparkles size={20} /> +100 XP ganados
                  </div>
                  <button 
                    onClick={finishDiagnostic}
                    className="w-full py-4 bg-[var(--math,theme(colors.indigo.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-2xl text-white font-bold text-xl shadow-[0_6px_0_var(--math-s,theme(colors.indigo.700))] cursor-pointer"
                  >
                    Continuar a AprendePe
                  </button>
                </div>
              </motion.div>
            );
          })()}

          {/* Saving Status */}
          {isSaving && (
             <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12">
               <Loader2 size={64} className="text-[var(--math,theme(colors.indigo.500))] animate-spin mb-6" />
               <h2 className="text-2xl font-bold font-playful mb-2 text-slate-900 dark:text-white">Guardando perfil...</h2>
               <p className="text-slate-600 dark:text-slate-400 text-center">Configurando AprendePe con tu nuevo nivel.</p>
             </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
