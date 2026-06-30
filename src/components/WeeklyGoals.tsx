import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../contexts/SoundContext';

interface WeeklyGoalsProps {
  profile: UserProfile;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function WeeklyGoals({ profile, updateProfile }: WeeklyGoalsProps) {
  const { playSound } = useSound();
  const [isEditing, setIsEditing] = useState(false);
  
  // Default target XP if none is set
  const defaultTarget = 500;
  
  const [targetXP, setTargetXP] = useState(profile.weeklyGoals?.targetXP ?? defaultTarget);
  
  // Logic to initialize or reset weekly goals based on date
  useEffect(() => {
    const today = new Date();
    // Get start of next Monday for reset
    const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);

    const initialGoal = {
      targetXP: defaultTarget,
      currentXP: 0,
      tasksCompleted: 0,
      resetDate: nextMonday.toISOString(),
    };

    if (!profile.weeklyGoals) {
      if (updateProfile) {
        updateProfile({ weeklyGoals: initialGoal });
      }
    } else {
      const resetDate = new Date(profile.weeklyGoals.resetDate);
      if (today >= resetDate) {
        // Time to reset
        if (updateProfile) {
          updateProfile({
            weeklyGoals: {
              targetXP: profile.weeklyGoals.targetXP,
              currentXP: 0,
              tasksCompleted: 0,
              resetDate: nextMonday.toISOString(),
            }
          });
        }
      } else {
        setTargetXP(profile.weeklyGoals.targetXP);
      }
    }
  }, [profile.weeklyGoals?.resetDate, updateProfile]);

  const handleSaveGoal = async () => {
    playSound('click');
    if (updateProfile && profile.weeklyGoals) {
      await updateProfile({
        weeklyGoals: {
          ...profile.weeklyGoals,
          targetXP,
        }
      });
    }
    setIsEditing(false);
  };

  const currentXP = profile.weeklyGoals?.currentXP || 0;
  const currentTarget = profile.weeklyGoals?.targetXP || defaultTarget;
  const tasksCompleted = profile.weeklyGoals?.tasksCompleted || 0;
  
  // Make sure we never display > 100% on the chart, but log actual
  const percentage = Math.min(100, Math.round((currentXP / currentTarget) * 100)) || 0;

  const data = [
    {
      name: 'Progress',
      value: percentage,
      fill: 'url(#colorGradient)',
    }
  ];

  return (
    <section className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl transition-colors shadow-sm dark:shadow-none flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Target className="text-indigo-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Metas Semanales</h2>
        </div>
      </div>

      <div className="relative w-48 h-48 mb-6">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="70%" 
            outerRadius="100%" 
            barSize={16} 
            data={data} 
            startAngle={90} 
            endAngle={-270}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <PolarAngleAxis 
              type="number" 
              domain={[0, 100]} 
              angleAxisId={0} 
              tick={false} 
            />
            <RadialBar
              background={{ fill: 'rgba(148, 163, 184, 0.2)' }}
              dataKey="value"
              cornerRadius={10}
              clockWise
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={percentage}
            className="text-4xl font-bold text-slate-900 dark:text-white"
          >
            {percentage}%
          </motion.span>
        </div>
      </div>

      <div className="text-center w-full">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-3"
            >
              <input 
                type="number" 
                value={targetXP} 
                onChange={(e) => setTargetXP(Number(e.target.value))}
                min="10"
                step="10"
                className="w-24 text-center px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-slate-500 dark:text-slate-400 font-medium">XP</span>
              <button 
                onClick={handleSaveGoal}
                className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                title="Guardar meta"
              >
                <Check size={20} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{currentXP}</span>
                    <span className="mx-1">/</span>
                    <span className="text-lg font-medium">{currentTarget} XP</span> semanales
                  </p>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Editar meta"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1 whitespace-nowrap text-sm">
                  Has completado <span className="font-bold text-slate-800 dark:text-slate-200">{tasksCompleted}</span> {tasksCompleted === 1 ? 'lección' : 'lecciones'} esta semana.
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-2 flex items-center justify-center gap-1">
                <TrendingUp size={14} /> 
                {currentXP >= currentTarget 
                  ? '¡Meta alcanzada! ¡Excelente!' 
                  : `Faltan ${Math.max(0, currentTarget - currentXP)} XP para la meta`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
