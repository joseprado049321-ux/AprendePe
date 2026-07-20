import React from 'react';
import { UserProfile, UnlockedAchievement } from '../types';
import { ACHIEVEMENTS } from '../lib/achievements';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useSound } from '../contexts/SoundContext';
import { Diamond, Gem, CheckCircle, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface AchievementsProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Achievements({ profile, updateProfile }: AchievementsProps) {
  const navigate = useNavigate();
  const { playSound } = useSound();

  // Lazy migration: Convert legacy strings to objects with isClaimed: true
  const normalizedAchievements = (profile.unlockedAchievements || []).map(ach => {
    if (typeof ach === 'string') {
      return {
        id: ach,
        unlockedAt: new Date().toISOString(),
        isClaimed: true // User requested: old string achievements are considered claimed to prevent free rewards
      } as UnlockedAchievement;
    }
    return ach as UnlockedAchievement;
  });

  const handleClaim = async (achievementId: string, rewardType: 'oro' | 'esmeralda', rewardAmount: number) => {
    playSound('success');
    
    // Disparar confeti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: rewardType === 'oro' ? ['#f59e0b', '#fbbf24', '#fef3c7'] : ['#10b981', '#34d399', '#d1fae5']
    });

    // Actualizar el estado del logro a reclamado
    const updatedAchievements = normalizedAchievements.map(ach => {
      if (ach.id === achievementId) {
        return { ...ach, isClaimed: true };
      }
      return ach;
    });

    // Actualizar la billetera
    const currentWallet = profile.wallet || { oro: 0, esmeralda: 0, rubi: 0, diamante: 0 };
    const updatedWallet = { ...currentWallet };
    
    if (rewardType === 'oro') {
      updatedWallet.oro += rewardAmount;
    } else if (rewardType === 'esmeralda') {
      updatedWallet.esmeralda += rewardAmount;
    }

    await updateProfile({
      unlockedAchievements: updatedAchievements,
      wallet: updatedWallet
    });
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Fácil': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Medio': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Difícil': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'Épico': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 transition-colors duration-500 font-sans">
      <header className="flex justify-between items-center px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 transition-colors duration-500 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          🏆 Tus Logros
        </h1>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            <Diamond className="text-amber-500 fill-current" size={16} />
            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{profile.wallet?.oro || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            <Gem className="text-emerald-500 fill-current" size={16} />
            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{profile.wallet?.esmeralda || 0}</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-4 py-8 space-y-4">
        {ACHIEVEMENTS.map(ach => {
          const unlockedData = normalizedAchievements.find(a => a.id === ach.id);
          const isUnlocked = !!unlockedData;
          const isClaimed = isUnlocked && unlockedData.isClaimed;
          
          return (
            <div 
              key={ach.id} 
              className={`relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center p-5 rounded-2xl border-2 transition-all gap-4 ${
                isClaimed 
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm' 
                  : isUnlocked 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 shadow-md transform scale-[1.02]' 
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
              }`}
            >
              {/* Animación de Resplandor si está desbloqueado y no reclamado */}
              {isUnlocked && !isClaimed && (
                <motion.div 
                  className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 z-0"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Icono */}
              <div className={`shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl text-4xl z-10 ${
                isUnlocked ? 'bg-white dark:bg-slate-700 shadow-sm' : 'bg-slate-200 dark:bg-slate-800 grayscale opacity-50'
              }`}>
                {isUnlocked ? ach.icon : <Lock className="text-slate-400" size={28} />}
              </div>
              
              {/* Info */}
              <div className="flex-1 z-10">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-bold text-lg leading-tight ${
                    isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {ach.title}
                  </h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(ach.difficulty)}`}>
                    {ach.difficulty}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{ach.description}</p>
                
                {/* Recompensa Info (Solo visible si no está reclamado) */}
                {!isClaimed && (
                  <div className={`flex items-center gap-1.5 text-sm font-bold ${isUnlocked ? (ach.rewardType === 'oro' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400') : 'text-slate-400'}`}>
                    <span>Recompensa:</span>
                    {ach.rewardType === 'oro' ? <Diamond size={16} className="fill-current" /> : <Gem size={16} className="fill-current" />}
                    <span>{ach.rewardAmount}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="w-full sm:w-auto shrink-0 z-10 flex justify-end mt-2 sm:mt-0">
                {isClaimed ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl">
                    <CheckCircle size={20} />
                    <span>Completado</span>
                  </div>
                ) : isUnlocked ? (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleClaim(ach.id, ach.rewardType, ach.rewardAmount)}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_theme(colors.indigo.800)] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Reclamar</span>
                    {ach.rewardType === 'oro' ? <Diamond size={18} className="fill-current text-amber-300" /> : <Gem size={18} className="fill-current text-emerald-300" />}
                    <span>{ach.rewardAmount}</span>
                  </motion.button>
                ) : (
                  <div className="px-4 py-2 text-slate-400 font-medium text-sm bg-slate-200 dark:bg-slate-800 rounded-xl">
                    Bloqueado
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      <BottomNav activeTab="/achievements" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
