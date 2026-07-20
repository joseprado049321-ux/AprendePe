import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { BarChart3, Diamond, Gem, Zap, Flame, Edit2, Check, UserCircle2, Sparkles, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useSound } from '../contexts/SoundContext';
import WeeklyGoals from './WeeklyGoals';
import History from './History';
import { AVATARS, FRAMES } from '../data/cosmetics';

interface ProfileProps {
  profile: UserProfile;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Profile({ profile, updateProfile }: ProfileProps) {
  const navigate = useNavigate();
  const { playSound } = useSound();
  const [equipModalOpen, setEquipModalOpen] = useState(false);
  const [activeEquipTab, setActiveEquipTab] = useState<'avatares' | 'marcos'>('avatares');

  const wallet = profile.wallet || { oro: 0, esmeralda: 0 };
  
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

  const currentAvatar = AVATARS.find(a => a.id === profile.avatar) || { emoji: '👤', id: 'default' };
  const currentFrame = FRAMES.find(f => f.id === profile.avatarFrame) || { cssClass: 'ring-4 ring-slate-200 dark:ring-slate-700 shadow-lg', id: 'default' };

  const handleEquip = async (type: 'avatar' | 'frame', id: string) => {
    playSound('click');
    if (updateProfile) {
      if (type === 'avatar') {
        await updateProfile({ avatar: id === 'default' ? '' : id });
      } else {
        await updateProfile({ avatarFrame: id === 'default' ? '' : id });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors">
      
      {/* Header Profile Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="w-full max-w-4xl mx-auto p-6 md:p-8 relative z-10">
          <div className="flex justify-end mb-4">
            <Link to="/settings" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-colors" title="Configuración">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group cursor-pointer shrink-0" onClick={() => setEquipModalOpen(true)}>
              <div className={`w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-6xl transition-transform duration-300 group-hover:scale-105 ${currentFrame.cssClass}`}>
                <span className="inline-block animate-bounce" style={{ animationDuration: '3s' }}>
                  {currentAvatar.emoji}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Edit2 size={18} />
              </div>
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{profile.displayName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-bold tracking-wide">
                  {profile.level}
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium">
                  Rango {currentLevelNum}
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Zap className="text-amber-500" size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">XP Total</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{profile.xp || 0}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Flame className="text-orange-500" size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Racha</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{profile.streak} <span className="text-sm font-medium text-slate-500">días</span></p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Diamond className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Oro</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{wallet.oro}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Gem className="text-emerald-500" size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Esmeraldas</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{wallet.esmeralda}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* XP Progress */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 md:p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Progreso al Rango {currentLevelNum + 1}</h3>
              <p className="text-3xl font-light text-indigo-600 dark:text-indigo-400">{currentXp} <span className="text-xl text-indigo-500/50 dark:text-indigo-600">/ {nextMilestone} XP</span></p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{Math.round(progressPercent)}% completado</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-6 overflow-hidden relative">
            <motion.div 
              className="bg-indigo-500 h-full rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full"></div>
            </motion.div>
          </div>
        </section>

        {/* Diagnóstico Inicial */}
        {profile.hasCompletedDiagnostic && profile.diagnosticScore !== undefined && (() => {
            const percentage = profile.diagnosticScore;
            let letter = 'C'; 
            let message = ''; 
            let colorClass = '';

            if (percentage >= 90) { 
              letter = 'AD'; 
              message = 'Logro Destacado'; 
              colorClass = 'text-indigo-500'; 
            } else if (percentage >= 75) { 
              letter = 'A'; 
              message = 'Logro Esperado'; 
              colorClass = 'text-emerald-500'; 
            } else if (percentage >= 50) { 
              letter = 'B'; 
              message = 'En Proceso'; 
              colorClass = 'text-amber-500'; 
            } else { 
              letter = 'C'; 
              message = 'En Inicio'; 
              colorClass = 'text-rose-500'; 
            }
            return (
              <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className={`p-4 rounded-2xl shrink-0 flex items-center justify-center w-24 h-24 ${colorClass.replace('text-', 'bg-').replace('500', '50')} dark:bg-slate-900/50`}>
                  <span className={`text-5xl font-bold font-playful ${colorClass}`}>{letter}</span>
                </div>
                <div className="flex-1 w-full text-center md:text-left">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Resultado del Diagnóstico Inicial</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                    El punto de partida de tu aprendizaje en el nivel {profile.diagnosticLevel || profile.educationalStage}.
                  </p>
                  <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                    <span className={`font-bold ${colorClass}`}>{message}</span>
                  </div>
                </div>
              </section>
            );
        })()}

        <WeeklyGoals profile={profile} updateProfile={updateProfile} />

        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 md:p-8 rounded-3xl shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
             <span className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
               <BarChart3 size={20} />
             </span>
             Reporte para Docentes/Padres
          </h2>
          
          {(!profile.history || profile.history.length === 0) ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Aún no hay datos suficientes para generar un reporte. ¡Completa lecciones!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(() => {
                const history = profile.history;
                const totalAccuracy = history.reduce((sum, h) => sum + (h.accuracyPercentage || 0), 0);
                const avgAccuracy = Math.round(totalAccuracy / history.length);
                
                const subjectStats = history.reduce((acc, h) => {
                  if (!acc[h.subject]) {
                    acc[h.subject] = { correct: 0, total: 0 };
                  }
                  acc[h.subject].correct += (h.accuracyPercentage || 0);
                  acc[h.subject].total += 100;
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
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Precisión Media</p>
                      <p className="text-2xl font-light text-slate-900 dark:text-white">{avgAccuracy}%</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">Fortaleza</p>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">{strongest.subject}</p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-800/30">
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-1">Área de Mejora</p>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">{weakest.subject}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </section>

        <History profile={profile} />
      </div>

      {/* Equip Modal */}
      {equipModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10 sm:rounded-t-3xl rounded-t-3xl">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vestidor</h2>
              <button onClick={() => setEquipModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors">
                <svg className="w-6 h-6 text-slate-500 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-4 flex gap-2 overflow-x-auto border-b border-slate-100 dark:border-slate-700">
               <button 
                  onClick={() => setActiveEquipTab('avatares')}
                  className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${activeEquipTab === 'avatares' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
               >
                 <UserCircle2 size={18} /> Avatares
               </button>
               <button 
                  onClick={() => setActiveEquipTab('marcos')}
                  className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${activeEquipTab === 'marcos' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
               >
                 <Sparkles size={18} /> Marcos
               </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {activeEquipTab === 'avatares' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {/* Default Avatar */}
                  <div 
                    onClick={() => handleEquip('avatar', 'default')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2 ${!profile.avatar || profile.avatar === 'default' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                  >
                    <div className="text-4xl">👤</div>
                    <span className="text-xs font-bold text-slate-500">Por Defecto</span>
                  </div>
                  
                  {profile.unlockedAvatars?.map(id => {
                    const av = AVATARS.find(a => a.id === id);
                    if (!av) return null;
                    const isEquipped = profile.avatar === id;
                    return (
                      <div 
                        key={id}
                        onClick={() => handleEquip('avatar', id)}
                        className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${isEquipped ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md transform scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                      >
                        <div className="text-4xl">{av.emoji}</div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{av.name}</span>
                        {isEquipped && <Check size={14} className="text-indigo-600 mt-1" />}
                      </div>
                    )
                  })}
                  
                  {(!profile.unlockedAvatars || profile.unlockedAvatars.length === 0) && (
                    <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                      <Diamond size={32} className="mb-2 opacity-50" />
                      <p>Aún no has comprado ningún Avatar.</p>
                      <Link to="/shop" onClick={() => setEquipModalOpen(false)} className="text-indigo-500 hover:underline mt-2">Ir a la Tienda</Link>
                    </div>
                  )}
                </div>
              )}

              {activeEquipTab === 'marcos' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Default Frame */}
                  <div 
                    onClick={() => handleEquip('frame', 'default')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-3 ${!profile.avatarFrame || profile.avatarFrame === 'default' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-xs font-bold text-slate-500">Ninguno</span>
                  </div>
                  
                  {profile.unlockedFrames?.map(id => {
                    const fr = FRAMES.find(f => f.id === id);
                    if (!fr) return null;
                    const isEquipped = profile.avatarFrame === id;
                    return (
                      <div 
                        key={id}
                        onClick={() => handleEquip('frame', id)}
                        className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-3 ${isEquipped ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md transform scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                      >
                        <div className={`w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 ${fr.cssClass}`}></div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{fr.name}</span>
                        {isEquipped && <Check size={14} className="text-indigo-600" />}
                      </div>
                    )
                  })}
                  
                  {(!profile.unlockedFrames || profile.unlockedFrames.length === 0) && (
                    <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                      <Gem size={32} className="mb-2 opacity-50" />
                      <p>Aún no has comprado ningún Marco.</p>
                      <Link to="/shop" onClick={() => setEquipModalOpen(false)} className="text-indigo-500 hover:underline mt-2">Ir a la Tienda</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 sm:rounded-b-3xl">
               <button onClick={() => setEquipModalOpen(false)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg">
                 ¡Listo!
               </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab="/profile" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
