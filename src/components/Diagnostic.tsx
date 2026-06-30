import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Level, UserDiagnostic } from '../types';
import { Brain, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../contexts/SoundContext';
import confetti from 'canvas-confetti';

interface DiagnosticProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const mockDiagnosticQuestions = [
  { q: '¿Qué es 15 + 23?', options: ['38', '35', '40', '42'], ans: 0 },
  { q: '¿Cuál es el océano más grande?', options: ['Atlántico', 'Pacífico', 'Índico', 'Ártico'], ans: 1 },
  { q: 'Puntuar correctamente: "Hola Juan"', options: ['Hola, Juan', 'Hola Juan,', 'Hola Juan', 'Hola. Juan'], ans: 0 },
  { q: 'Simbolo químico del Oro', options: ['Ag', 'Au', 'O', 'Go'], ans: 1 },
  { q: '¿Quién pintó la Mona Lisa?', options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Dalí'], ans: 1 },
  { q: '¿Cuánto es 8 x 7?', options: ['54', '56', '62', '48'], ans: 1 },
  { q: 'Capital de Australia', options: ['Sídney', 'Melbourne', 'Canberra', 'Brisbane'], ans: 2 },
  { q: 'Reconocer el verbo form: "Nosotros cantamos"', options: ['yo', 'tú', 'él', 'nosotros'], ans: 3 },
  { q: '¿Cuál no es un estado de la materia?', options: ['Sólido', 'Líquido', 'Gas', 'Energía'], ans: 3 },
  { q: 'Continente con más países', options: ['Asia', 'América', 'África', 'Europa'], ans: 2 },
];

export default function Diagnostic({ profile, updateProfile }: DiagnosticProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { playSound } = useSound();

  const handleAnswer = async (index: number) => {
    playSound('click');
    const isCorrect = index === mockDiagnosticQuestions[currentIndex].ans;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    if (currentIndex < mockDiagnosticQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      playSound('levelUp');
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      });

      setIsSaving(true);
      // Determine Level based on score
      let calculatedLevel: Level = 'Inicial';
      if (newScore > 7) calculatedLevel = 'Secundaria';
      else if (newScore > 4) calculatedLevel = 'Primaria';

      try {
        await updateProfile({ diagnosticLevel: calculatedLevel, level: calculatedLevel });
        navigate('/home');
      } catch (err) {
        console.error('Error saving diagnostic', err);
        setIsSaving(false);
      }
    }
  };

  const question = mockDiagnosticQuestions[currentIndex];

  if (isSaving) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={64} className="text-indigo-500 animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Evaluando nivel...</h2>
        <p className="text-slate-400">Analizando tus respuestas para personalizar tu experiencia en AprendePe.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-xl w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <header className="flex items-center gap-4 mb-8">
          <div className="bg-indigo-500/20 p-3 rounded-2xl text-indigo-400">
            <Brain size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Prueba Diagnóstica</h1>
            <p className="text-slate-400">Pregunta {currentIndex + 1} de {mockDiagnosticQuestions.length}</p>
          </div>
        </header>

        <div className="w-full bg-slate-700 rounded-full h-2 mb-8">
          <div 
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex) / mockDiagnosticQuestions.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-2xl font-semibold">{question.q}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium p-4 rounded-xl text-left transition-colors flex items-center justify-between group"
                >
                  {opt}
                  <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
