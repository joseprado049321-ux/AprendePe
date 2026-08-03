import React, { useState } from 'react';
import { Diamond, Gem, Shield, Zap, UserCircle2, Sparkles, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import BottomNav from './BottomNav';
import { useNavigate } from 'react-router-dom';
import { AVATARS, FRAMES } from '../data/cosmetics';

interface ShopProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Shop({ profile, updateProfile }: ShopProps) {
  const navigate = useNavigate();
  const wallet = profile.wallet || { oro: 0, esmeralda: 0 };
  const inventory = profile.inventory || { streakProtectors: 0, xpMultipliers: 0 };
  const unlockedAvatars = profile.unlockedAvatars || [];
  const unlockedFrames = profile.unlockedFrames || [];

  const [activeTab, setActiveTab] = useState<'potenciadores' | 'avatares' | 'marcos'>('potenciadores');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleBuy = async (item: string) => {
    if (item === 'streakProtector') {
      if (wallet.esmeralda >= 3) {
        await updateProfile({
          wallet: { ...wallet, esmeralda: wallet.esmeralda - 3 },
          inventory: { ...inventory, streakProtectors: inventory.streakProtectors + 1 }
        });
        showToast('¡Has comprado un Protector de Racha!', 'success');
      } else {
        showToast('No tienes suficientes Esmeraldas.', 'error');
      }
    } else if (item === 'xpMultiplier') {
      if (wallet.esmeralda >= 50) {
        await updateProfile({
          wallet: { ...wallet, esmeralda: wallet.esmeralda - 50 },
          inventory: { ...inventory, xpMultipliers: inventory.xpMultipliers + 1 }
        });
        showToast('¡Has comprado un Multiplicador de XP x2!', 'success');
      } else {
        showToast('No tienes suficientes Esmeraldas.', 'error');
      }
    } else if (item === 'buyEmerald') {
      if (wallet.oro >= 100) {
        await updateProfile({
          wallet: { ...wallet, oro: wallet.oro - 100, esmeralda: wallet.esmeralda + 1 }
        });
        showToast('¡Has comprado 1 Esmeralda!', 'success');
      } else {
        showToast('No tienes suficiente Oro.', 'error');
      }
    } else if (item === 'buyLife') {
      const currentLives = profile.lives ?? 5;
      if (currentLives >= 5) {
        showToast('¡Ya tienes el máximo de vidas (5)!', 'error');
        return;
      }
      if (wallet.esmeralda >= 5) {
        await updateProfile({
          wallet: { ...wallet, esmeralda: wallet.esmeralda - 5 },
          lives: currentLives + 1
        });
        showToast('¡Has recargado 1 Vida!', 'success');
      } else {
        showToast('No tienes suficientes Esmeraldas.', 'error');
      }
    }
  };

  const handleBuyAvatar = async (id: string, price: number) => {
    if (wallet.oro >= price) {
      await updateProfile({
        wallet: { ...wallet, oro: wallet.oro - price },
        unlockedAvatars: [...unlockedAvatars, id],
        avatar: id 
      });
      showToast('¡Avatar comprado y equipado exitosamente!', 'success');
    } else {
      showToast('No tienes suficiente Oro.', 'error');
    }
  };

  const handleBuyFrame = async (id: string, price: number) => {
    if (wallet.esmeralda >= price) {
      await updateProfile({
        wallet: { ...wallet, esmeralda: wallet.esmeralda - price },
        unlockedFrames: [...unlockedFrames, id],
        avatarFrame: id
      });
      showToast('¡Marco comprado y equipado exitosamente!', 'success');
    } else {
      showToast('No tienes suficientes Esmeraldas.', 'error');
    }
  };

  // Conditions for boosters
  const canBuyStreak = wallet.esmeralda >= 3;
  const canBuyMultiplier = wallet.esmeralda >= 50;
  const canBuyEmerald = wallet.oro >= 100;
  const isLivesMax = (profile.lives ?? 5) >= 5;
  const canBuyLife = wallet.esmeralda >= 5 && !isLivesMax;
  const notEnoughForLife = !isLivesMax && wallet.esmeralda < 5;

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-900 transition-colors relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm w-[90%] pointer-events-none">
          <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md border ${
            toast.type === 'success' 
              ? 'bg-emerald-500/90 text-white border-emerald-400/30' 
              : 'bg-rose-500/90 text-white border-rose-400/30'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="shrink-0" size={20} />
            ) : (
              <AlertCircle className="shrink-0" size={20} />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="bg-indigo-600 dark:bg-indigo-900 text-white pt-12 pb-6 px-4 rounded-b-3xl shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-6">Tienda</h1>
          <div className="flex flex-wrap justify-center gap-4 bg-white/10 p-4 rounded-2xl w-full">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 rounded-lg">
              <Diamond className="text-amber-400" size={20} />
              <span className="font-bold">{wallet.oro}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 rounded-lg">
              <Gem className="text-emerald-400" size={20} />
              <span className="font-bold">{wallet.esmeralda}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('potenciadores')}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'potenciadores' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
          >
            Potenciadores
          </button>
          <button 
            onClick={() => setActiveTab('avatares')}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'avatares' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
          >
            <UserCircle2 size={16} /> Avatares
          </button>
          <button 
            onClick={() => setActiveTab('marcos')}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'marcos' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
          >
            <Sparkles size={16} /> Marcos
          </button>
        </div>

        {activeTab === 'potenciadores' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Protector de Racha */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <Shield className="text-indigo-500" size={32} />
                  </div>
                  <div className={`flex items-center gap-1 font-bold px-3 py-1 rounded-full text-sm transition-colors ${
                    canBuyStreak 
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                  }`}>
                    <Gem size={14} className={canBuyStreak ? 'text-emerald-500' : 'text-rose-500'} />
                    <span>3</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Protector de Racha</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                  Protege tu racha diaria por 1 día si olvidas practicar. Tienes: {inventory.streakProtectors}
                </p>
              </div>

              <div className="w-full mt-2">
                <button 
                  onClick={() => handleBuy('streakProtector')} 
                  disabled={!canBuyStreak} 
                  className="w-full bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 disabled:text-slate-400 dark:disabled:text-slate-500 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Comprar
                </button>
                {!canBuyStreak && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle size={13} className="shrink-0" /> No tienes suficientes Esmeraldas
                  </p>
                )}
              </div>
            </div>

            {/* Multiplicador XP x2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                    <Zap className="text-amber-500" size={32} />
                  </div>
                  <div className={`flex items-center gap-1 font-bold px-3 py-1 rounded-full text-sm transition-colors ${
                    canBuyMultiplier 
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                  }`}>
                    <Gem size={14} className={canBuyMultiplier ? 'text-emerald-500' : 'text-rose-500'} />
                    <span>50</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Multiplicador XP x2</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                  Duplica tu XP ganado durante las próximas 24 horas. Tienes: {inventory.xpMultipliers}
                </p>
              </div>

              <div className="w-full mt-2">
                <button 
                  onClick={() => handleBuy('xpMultiplier')} 
                  disabled={!canBuyMultiplier} 
                  className="w-full bg-amber-50 hover:bg-amber-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 disabled:text-slate-400 dark:disabled:text-slate-500 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Comprar
                </button>
                {!canBuyMultiplier && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle size={13} className="shrink-0" /> No tienes suficientes Esmeraldas
                  </p>
                )}
              </div>
            </div>

            {/* 1 Esmeralda */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                    <Gem className="text-emerald-500" size={32} />
                  </div>
                  <div className={`flex items-center gap-1 font-bold px-3 py-1 rounded-full text-sm transition-colors ${
                    canBuyEmerald 
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                  }`}>
                    <Diamond size={14} className={canBuyEmerald ? 'text-amber-500' : 'text-rose-500'} />
                    <span>100</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">1 Esmeralda</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                  Compra una esmeralda utilizando tu oro acumulado.
                </p>
              </div>

              <div className="w-full mt-2">
                <button 
                  onClick={() => handleBuy('buyEmerald')} 
                  disabled={!canBuyEmerald} 
                  className="w-full bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 disabled:text-slate-400 dark:disabled:text-slate-500 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Comprar
                </button>
                {!canBuyEmerald && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle size={13} className="shrink-0" /> No tienes suficiente Oro
                  </p>
                )}
              </div>
            </div>

            {/* Recargar 1 Vida */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-xl">
                    <svg className="w-8 h-8 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </div>
                  <div className={`flex items-center gap-1 font-bold px-3 py-1 rounded-full text-sm transition-colors ${
                    notEnoughForLife 
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40' 
                      : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <Gem size={14} className={notEnoughForLife ? 'text-rose-500' : 'text-emerald-500'} />
                    <span>5</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recargar 1 Vida</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                  Recarga una vida global para continuar tu aprendizaje. Vidas actuales: {profile.lives ?? 5}/5.
                </p>
              </div>

              <div className="w-full mt-2">
                <button 
                  onClick={() => handleBuy('buyLife')} 
                  disabled={!canBuyLife} 
                  className="w-full bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 disabled:text-slate-400 dark:disabled:text-slate-500 font-bold py-2.5 rounded-xl transition-colors"
                >
                  {isLivesMax ? 'Vidas Llenas' : 'Comprar'}
                </button>
                {notEnoughForLife && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle size={13} className="shrink-0" /> No tienes suficientes Esmeraldas
                  </p>
                )}
                {isLivesMax && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center mt-2 flex items-center justify-center gap-1">
                    <Check size={13} className="shrink-0" /> Máximo de vidas alcanzado
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'avatares' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {AVATARS.map((av) => {
              const isUnlocked = unlockedAvatars.includes(av.id);
              const hasEnoughGold = wallet.oro >= av.priceGold;
              return (
                <div key={av.id} className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center justify-between">
                  <div className="flex flex-col items-center w-full">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-4xl mb-3 shadow-inner">
                      {av.emoji}
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-1" title={av.name}>{av.name}</h4>
                    <span className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${av.category === 'Épico' ? 'text-fuchsia-500' : 'text-slate-400'}`}>
                      {av.category}
                    </span>
                  </div>
                  
                  <div className="w-full mt-auto">
                    {isUnlocked ? (
                      <button disabled className="w-full py-2 flex justify-center items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl font-bold text-xs">
                        <Check size={15} /> Adquirido
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleBuyAvatar(av.id, av.priceGold)}
                          disabled={!hasEnoughGold}
                          className={`w-full py-2 flex justify-center items-center gap-1.5 rounded-xl font-bold text-xs transition-colors ${
                            hasEnoughGold
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300 shadow-sm'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 cursor-not-allowed'
                          }`}
                        >
                          <Diamond size={14} className={hasEnoughGold ? 'text-amber-500' : 'text-rose-500 dark:text-rose-400'} />
                          <span>{av.priceGold}</span>
                        </button>
                        {!hasEnoughGold && (
                          <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold mt-1.5 flex items-center justify-center gap-0.5 leading-tight">
                            <AlertCircle size={10} className="shrink-0" /> No tienes suficiente Oro
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'marcos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {FRAMES.map((fr) => {
              const isUnlocked = unlockedFrames.includes(fr.id);
              const hasEnoughEmeralds = wallet.esmeralda >= fr.priceEmeralds;
              return (
                <div key={fr.id} className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center justify-between">
                  <div className="flex flex-col items-center w-full">
                    <div className="w-20 h-20 mb-3 flex items-center justify-center">
                      <div className={`w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 ${fr.cssClass}`}></div>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-1" title={fr.name}>{fr.name}</h4>
                    <span className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${fr.category === 'Legendario' ? 'text-orange-500' : 'text-slate-400'}`}>
                      {fr.category}
                    </span>
                  </div>
                  
                  <div className="w-full mt-auto">
                    {isUnlocked ? (
                      <button disabled className="w-full py-2 flex justify-center items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl font-bold text-xs">
                        <Check size={15} /> Adquirido
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleBuyFrame(fr.id, fr.priceEmeralds)}
                          disabled={!hasEnoughEmeralds}
                          className={`w-full py-2 flex justify-center items-center gap-1.5 rounded-xl font-bold text-xs transition-colors ${
                            hasEnoughEmeralds
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 shadow-sm'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 cursor-not-allowed'
                          }`}
                        >
                          <Gem size={14} className={hasEnoughEmeralds ? 'text-emerald-500' : 'text-rose-500 dark:text-rose-400'} />
                          <span>{fr.priceEmeralds}</span>
                        </button>
                        {!hasEnoughEmeralds && (
                          <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold mt-1.5 flex items-center justify-center gap-0.5 leading-tight">
                            <AlertCircle size={10} className="shrink-0" /> No tienes suficientes Esmeraldas
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      <BottomNav activeTab="/shop" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
