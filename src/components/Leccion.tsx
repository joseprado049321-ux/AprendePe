import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export interface LeccionOption {
  text: string;
  isCorrect: boolean;
}

export interface LeccionQuestion {
  text: string;
  options: LeccionOption[];
  explanation: string;
}

interface LeccionProps {
  questions: LeccionQuestion[];
  onComplete?: () => void;
}

export default function Leccion({ questions, onComplete }: LeccionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="p-8 text-center text-slate-500">No hay preguntas disponibles.</div>;
  }

  const currentQuestion = questions[currentIndex];
  const progressPercentage = ((currentIndex) / questions.length) * 100;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOptionIndex(index);
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
          <span>Pregunta {currentIndex + 1} de {questions.length}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-grow flex flex-col"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mb-8 leading-tight">
              {currentQuestion.text}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOptionIndex === index;
                let optionStyle = 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md';
                let icon = null;

                if (isAnswered) {
                  if (option.isCorrect) {
                    optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm';
                    icon = <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />;
                  } else if (isSelected && !option.isCorrect) {
                    optionStyle = 'bg-rose-50 border-rose-500 text-rose-900 shadow-sm';
                    icon = <XCircle className="text-rose-500 shrink-0" size={24} />;
                  } else {
                    optionStyle = 'bg-slate-50 border-slate-200 opacity-60 grayscale';
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectOption(index)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-4 ${optionStyle} ${
                      !isAnswered ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                    }`}
                  >
                    <span className="text-lg font-medium">{option.text}</span>
                    {icon && <span className="animate-in fade-in zoom-in duration-300">{icon}</span>}
                  </button>
                );
              })}
            </div>

            {/* Explanation Section */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                  className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl"
                >
                  <h3 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                    {currentQuestion.options[selectedOptionIndex!].isCorrect ? '¡Correcto!' : 'Respuesta incorrecta'}
                  </h3>
                  <p className="text-indigo-800">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Next Button */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={handleNextQuestion}
          disabled={!isAnswered}
          className={`w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
            isAnswered
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/25 active:scale-95 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {currentIndex < questions.length - 1 ? (
            <>
              Siguiente
              <ArrowRight size={20} />
            </>
          ) : (
            'Completar Lección'
          )}
        </button>
      </div>
    </div>
  );
}
