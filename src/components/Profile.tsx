import React from 'react';
import { UserProfile } from '../types';
import { ACHIEVEMENTS } from '../lib/achievements';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { Moon, Sun, Volume2, VolumeX, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useSound } from '../contexts/SoundContext';
import WeeklyGoals from './WeeklyGoals';
import History from './History';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTheme } from '../contexts/ThemeContext';
import { Bell, BellOff } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Profile({ profile, updateProfile }: ProfileProps) {
  const navigate = useNavigate();
  const { playSound } = useSound();

  // Calculate next XP milestone
  const calculateProgress = (xp: number) => {
    const milestones = [0, 100, 300, 600, 1000, 1500, 2500, 5000, 10000];
    let currentXp = xp || 0;
    
    let nextMilestone = milestones[milestones.length - 1];
    let prevMilestone = 0;
    let currentLevelNum = milestones.length;

    for (let i = 0; i < milestones.length; i++) {
      if (currentXp < milestones[i]) {
        nextMilestone = milestones[i];
        prevMilestone = milestones[i - 1] || 0;
        currentLevelNum = i;
        break;
      }
    }
    
    const progressXP = currentXp - prevMilestone;
    const requiredXP = nextMilestone - prevMilestone;
    const progressPercent = Math.min(100, Math.max(0, (progressXP / requiredXP) * 100));

    return { prevMilestone, nextMilestone, currentLevelNum, progressPercent, currentXp };
  };

  const { nextMilestone, currentLevelNum, progressPercent, currentXp } = calculateProgress(profile.xp);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-8 sm:p-8 font-sans pb-24 transition-colors">
      <div className="w-full max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-light text-slate-900 dark:text-white mb-2">Perfil de {profile.displayName}</h1>
            <p className="text-slate-600 dark:text-slate-400">Categoría actual: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{profile.level}</span></p>
          </div>
          <div className="flex flex-wrap border-t sm:border-0 border-slate-200 dark:border-slate-800 pt-4 sm:pt-0 items-center justify-start sm:justify-end gap-4 transition-colors">
            <Link to="/settings" className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors" title="Configuración">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </Link>
          </div>
        </header>

        <section className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl transition-colors shadow-sm dark:shadow-none">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Progreso XP - Rango {currentLevelNum}</h3>
              <p className="text-3xl font-light text-emerald-600 dark:text-emerald-400">{currentXp} <span className="text-xl text-emerald-500 dark:text-emerald-600">/ {nextMilestone} XP</span></p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{Math.round(progressPercent)}% completado</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-6 overflow-hidden shadow-inner relative transition-colors">
            <motion.div 
              className="bg-emerald-500 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
            {/* Glossy overlay effect for the progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-full pointer-events-none"></div>
          </div>
        </section>

         <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex items-center justify-between transition-colors shadow-sm dark:shadow-none">
             <div>
               <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">XP Total</h3>
               <p className="text-4xl font-light text-[var(--math)]">{profile.xp || 0}</p>
             </div>
             <div className="text-5xl">⚡</div>
           </div>
           <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex items-center justify-between transition-colors shadow-sm dark:shadow-none">
             <div>
               <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Racha Actual</h3>
               <p className="text-4xl font-light text-orange-500 dark:text-orange-400">{profile.streak} días</p>
             </div>
             <div className="text-5xl">🔥</div>
           </div>
        </section>


        <WeeklyGoals profile={profile} updateProfile={updateProfile} />

        <section className="bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-indigo-200 dark:border-indigo-500/30 p-8 rounded-3xl transition-colors shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 3.8l7.1 14.2H4.9L12 5.8z"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 relative z-10 flex items-center gap-2">
             <span className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
               <BarChart3 size={24} />
             </span>
             Reporte para Docentes/Padres
          </h2>
          
          {(!profile.history || profile.history.length === 0) ? (
            <p className="text-slate-500 dark:text-slate-400">Aún no hay datos suficientes para generar un reporte. ¡Completa algunas lecciones primero!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
              {(() => {
                const history = profile.history;
                const totalAccuracy = history.reduce((sum, h) => sum + (h.accuracyPercentage || 0), 0);
                const avgAccuracy = Math.round(totalAccuracy / history.length);
                
                const subjectStats = history.reduce((acc, h) => {
                  if (!acc[h.subject]) {
                    acc[h.subject] = { correct: 0, total: 0 };
                  }
                  acc[h.subject].correct += (h.accuracyPercentage || 0);
                  acc[h.subject].total += 100; // assuming each out of 100
                  return acc;
                }, {} as Record<string, { correct: number, total: number }>);

                let strongest = { subject: '-', accuracy: 0 };
                let weakest = { subject: '-', accuracy: 100 };

                Object.entries(subjectStats).forEach(([subject, stats]) => {
                   const accuracy = (stats.correct / stats.total) * 100;
                   if (accuracy >= strongest.accuracy) strongest = { subject, accuracy: Math.round(accuracy) };
                   if (accuracy <= weakest.accuracy) weakest = { subject, accuracy: Math.round(accuracy) };
                });

                return (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Precisión Media</p>
                      <p className="text-3xl font-light text-slate-900 dark:text-white">
                         {avgAccuracy}%
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">Fortaleza</p>
                      <p className="text-xl font-medium text-slate-900 dark:text-white">
                         {strongest.subject}
                      </p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-5 rounded-2xl border border-rose-100 dark:border-rose-800/30">
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-2">Área de Mejora</p>
                      <p className="text-xl font-medium text-slate-900 dark:text-white">
                         {weakest.subject}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </section>

        <History profile={profile} />

      </div>
      
      <BottomNav activeTab="/profile" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
