import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Level } from '../types';
import { Brain, ArrowRight, Loader2, Sparkles, User as UserIcon, BookOpen, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../contexts/SoundContext';
import confetti from 'canvas-confetti';

interface DiagnosticProps {
  profile?: UserProfile;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Diagnostic({ profile, updateProfile }: DiagnosticProps = {}) {
  const [step, setStep] = useState(0); // 0: Welcome, 1: Stage, 2: Grade, 3: Self-eval, 4: Diagnostic Fetch, 5: Quiz
  
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
        body: JSON.stringify({ educationalStage: stage, grade })
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setStep(5);
    } catch (err) {
      console.error(err);
      // Fallback in case of error
      setQuestions(Array.from({ length: 5 }, (_, i) => ({
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

      setIsSaving(true);
      const percentage = Math.round((newScore / questions.length) * 100);
      let calculatedLevel: Level = 'Inicial';
      if (stage === 'Secundaria') calculatedLevel = 'Secundaria';
      else if (stage === 'Primaria') calculatedLevel = 'Primaria';

      try {
        const diagnosticData = {
          educationalStage: stage as any,
          grade,
          selfAssessedLevel: selfLevel,
          diagnosticScore: percentage,
          diagnosticLevel: calculatedLevel, 
          level: calculatedLevel 
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
    }
  };

  const themeClass = stage ? `theme-${stage.toLowerCase()}` : '';

  return (
    <div className={`min-h-screen bg-[var(--bg,theme(colors.slate.900))] text-[var(--text,white)] transition-colors duration-500 flex flex-col items-center justify-center p-4 sm:p-8 ${themeClass}`}>
      <div className="max-w-xl w-full bg-[var(--gray,theme(colors.slate.800))] p-8 rounded-[var(--radius,24px)] border border-[var(--muted,theme(colors.slate.700))] shadow-2xl relative overflow-hidden">
        
        {/* Progreso del Onboarding (Oculto en quiz) */}
        {step < 5 && (
          <div className="flex gap-2 justify-center mb-8">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step >= i ? 'w-8 bg-[var(--math,theme(colors.indigo.500))]' : 'w-2 bg-[var(--gray-s,theme(colors.slate.600))]'}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* PASO 0: Bienvenida */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-[var(--math,theme(colors.indigo.500))] rounded-full flex items-center justify-center shadow-[0_8px_0_var(--math-s,theme(colors.indigo.700))] text-5xl mb-4">
                👋
              </div>
              <h1 className="text-3xl font-bold font-playful text-[var(--text,white)]">¡Hola! Soy tu tutor virtual de AprendePe</h1>
              <p className="text-lg text-[var(--muted,theme(colors.slate.400))] leading-relaxed">
                Estoy aquí para adaptarme a tu ritmo de aprendizaje. Primero, cuéntame un poco sobre ti para personalizar tu experiencia.
              </p>
              <button onClick={() => handleNextStep(1)} className="mt-4 w-full py-4 bg-[var(--math,theme(colors.indigo.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-2xl text-white font-bold text-xl shadow-[0_6px_0_var(--math-s,theme(colors.indigo.700))]">
                ¡Empezar!
              </button>
            </motion.div>
          )}

          {/* PASO 1: Etapa Escolar */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center flex flex-col gap-6">
              <h2 className="text-3xl font-bold font-playful mb-2">¿En qué etapa escolar estás?</h2>
              <p className="text-[var(--muted,theme(colors.slate.400))] mb-4">Esto cambiará el diseño y los ejercicios para ti.</p>
              
              <div className="flex flex-col gap-4">
                {(['Inicial', 'Primaria', 'Secundaria'] as const).map(s => (
                  <button 
                    key={s} 
                    onClick={() => { setStage(s); handleNextStep(2); }} 
                    className="p-6 bg-[var(--math,theme(colors.indigo.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-white font-bold text-xl flex items-center justify-between shadow-[0_6px_0_var(--math-s,theme(colors.indigo.700))]"
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
              <h2 className="text-3xl font-bold font-playful mb-2">¿Qué grado de {stage}?</h2>
              <div className="grid grid-cols-2 gap-4">
                {stage === 'Inicial' && ['3 años', '4 años', '5 años'].map(g => (
                  <button key={g} onClick={() => { setGrade(g); handleNextStep(3); }} className="p-4 bg-[var(--comm,theme(colors.amber.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-[var(--bg,white)] font-bold text-lg shadow-[0_6px_0_var(--comm-s,theme(colors.amber.700))]">
                    {g}
                  </button>
                ))}
                {stage === 'Primaria' && ['1ero', '2do', '3ero', '4to', '5to', '6to'].map(g => (
                  <button key={g} onClick={() => { setGrade(g); handleNextStep(3); }} className="p-4 bg-[var(--science,theme(colors.emerald.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-[var(--bg,white)] font-bold text-lg shadow-[0_6px_0_var(--science-s,theme(colors.emerald.700))]">
                    {g}
                  </button>
                ))}
                {stage === 'Secundaria' && ['1ero', '2do', '3ero', '4to', '5to'].map(g => (
                  <button key={g} onClick={() => { setGrade(g); handleNextStep(3); }} className="p-4 bg-[var(--social,theme(colors.rose.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-[var(--bg,white)] font-bold text-lg shadow-[0_6px_0_var(--social-s,theme(colors.rose.700))]">
                    {g}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PASO 3: Autoevaluación */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center flex flex-col gap-6">
              <h2 className="text-3xl font-bold font-playful mb-2">¿Cómo consideras tu nivel actual?</h2>
              <div className="flex flex-col gap-4">
                <button onClick={() => startDiagnostic('Principiante')} className="p-5 bg-[var(--math,theme(colors.indigo.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-[var(--bg,white)] font-bold text-xl shadow-[0_6px_0_var(--math-s,theme(colors.indigo.700))]">
                  🌱 Principiante
                </button>
                <button onClick={() => startDiagnostic('Intermedio')} className="p-5 bg-[var(--comm,theme(colors.amber.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-[var(--bg,white)] font-bold text-xl shadow-[0_6px_0_var(--comm-s,theme(colors.amber.700))]">
                  ⚡ Intermedio
                </button>
                <button onClick={() => startDiagnostic('Avanzado')} className="p-5 bg-[var(--social,theme(colors.rose.500))] hover:brightness-110 active:translate-y-1 transition-all rounded-[var(--radius,24px)] text-[var(--bg,white)] font-bold text-xl shadow-[0_6px_0_var(--social-s,theme(colors.rose.700))]">
                  🔥 Avanzado
                </button>
              </div>
            </motion.div>
          )}

          {/* PASO 4: Loading Quiz */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
              <Loader2 size={64} className="text-[var(--math,theme(colors.indigo.500))] animate-spin mb-6" />
              <h2 className="text-2xl font-bold font-playful mb-2">Preparando tu diagnóstico...</h2>
              <p className="text-[var(--muted,theme(colors.slate.400))] text-center">Nuestra IA está creando un test personalizado para {grade} de {stage}.</p>
            </motion.div>
          )}

          {/* PASO 5: Quiz Activo */}
          {step === 5 && questions.length > 0 && !isSaving && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full">
              <header className="flex items-center gap-4 mb-8">
                <div className="bg-[var(--math,theme(colors.indigo.500))] text-[var(--bg,white)] p-3 rounded-2xl">
                  <Brain size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-playful">Prueba Diagnóstica</h1>
                  <p className="text-[var(--muted,theme(colors.slate.400))] font-medium">Pregunta {currentQ + 1} de {questions.length}</p>
                </div>
              </header>

              <div className="w-full bg-[var(--gray-s,theme(colors.slate.700))] rounded-full h-3 mb-8 overflow-hidden">
                <div 
                  className="bg-[var(--math,theme(colors.indigo.500))] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentQ / questions.length) * 100}%` }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                  <h2 className="text-2xl font-semibold leading-relaxed">{questions[currentQ].text}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {questions[currentQ].options.map((opt: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className="bg-[var(--gray-s,theme(colors.slate.700))] hover:bg-[var(--math,theme(colors.indigo.500))] hover:text-white text-[var(--text,white)] font-medium p-5 rounded-2xl text-left transition-all flex items-center justify-between group active:scale-95 border-2 border-transparent hover:border-[var(--math-s,theme(colors.indigo.600))]"
                      >
                        {opt}
                        <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {/* Saving Status */}
          {isSaving && (
             <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12">
               <Loader2 size={64} className="text-[var(--math,theme(colors.indigo.500))] animate-spin mb-6" />
               <h2 className="text-2xl font-bold font-playful mb-2">Evaluando nivel...</h2>
               <p className="text-[var(--muted,theme(colors.slate.400))] text-center">Analizando tus respuestas para personalizar tu experiencia en AprendePe.</p>
             </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
