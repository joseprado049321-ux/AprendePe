import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { useSound } from '../contexts/SoundContext';
import { ArrowDown, Check, ChevronRight } from 'lucide-react';

interface TourProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onComplete?: () => void;
}

export default function Tour({ profile, updateProfile, onComplete }: TourProps) {
  const { playSound } = useSound();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = [
    {
      title: '¡Bienvenido a AprendePe!',
      description: 'Acabas de completar tu diagnóstico inicial. Ahora te daremos un breve recorrido.',
      targetId: null,
    },
    {
      title: 'Metas Semanales',
      description: 'Ve a tu perfil para configurar tus metas de XP y ganar recompensas adicionales.',
      targetId: 'nav-tab-profile',
    },
    {
      title: 'Tablero de Posiciones',
      description: '¡Compite con otros estudiantes y llega al primer lugar del ranking!',
      targetId: 'nav-tab-leaderboard',
    },
    {
      title: 'Logros',
      description: 'Desbloquea emblemas completando lecciones y rachas. ¡Demuestra lo que sabes!',
      targetId: 'nav-tab-achievements',
    }
  ];

  useEffect(() => {
    const updateTargetRect = () => {
      const step = steps[currentStep];
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [currentStep]);

  const handleNext = () => {
    playSound('click');
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const finishTour = async () => {
    playSound('levelUp');
    await updateProfile({ hasCompletedTour: true });
    if (onComplete) {
      onComplete();
    }
  };

  if (profile.hasCompletedTour) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {!targetRect && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-500" />
      )}
      
      <AnimatePresence mode="wait">
        {targetRect && steps[currentStep].targetId ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute z-[101] pointer-events-auto"
            style={{
              bottom: window.innerHeight - targetRect.top + 20,
              left: Math.min(Math.max(20, targetRect.left + targetRect.width / 2 - 140), window.innerWidth - 300)
            }}
          >
            <div className="w-full max-w-[280px] bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-white dark:text-slate-800 drop-shadow-md">
                <ArrowDown size={32} fill="currentColor" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{steps[currentStep].title}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">{steps[currentStep].description}</p>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-200 dark:bg-slate-600'}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={handleNext}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1"
                >
                  {currentStep === steps.length - 1 ? 'Empezar' : 'Siguiente'}
                  {currentStep === steps.length - 1 ? <Check size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto p-6 z-[101]"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                <Check size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {steps[currentStep].title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                {steps[currentStep].description}
              </p>
              
              <button 
                onClick={handleNext}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition-colors text-lg"
              >
                Comenzar recorrido
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Highlighting the target element by adding a hole in the backdrop */}
      {targetRect && (
        <>
          <div className="absolute inset-0 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
          <div 
            className="absolute z-[100] rounded-2xl bg-white/20 dark:bg-white/10"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.6)',
              pointerEvents: 'none'
            }}
          />
        </>
      )}
    </div>
  );
}
