import React, { useState } from 'react';
import { Diamond, Gem, Shield, Zap, UserCircle2, Sparkles, Check } from 'lucide-react';
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

  const handleBuy = async (item: string) => {
    if (item === 'streakProtector') {
      if (wallet.esmeralda >= 3) {
        await updateProfile({
          wallet: { ...wallet, esmeralda: wallet.esmeralda - 3 },
          inventory: { ...inventory, streakProtectors: inventory.streakProtectors + 1 }
        });
        alert('¡Has comprado un Protector de Racha!');
      } else {
        alert('No tienes suficientes Esmeraldas.');
      }
    } else if (item === 'xpMultiplier') {
      if (wallet.esmeralda >= 50) {
        await updateProfile({
          wallet: { ...wallet, esmeralda: wallet.esmeralda - 50 },
          inventory: { ...inventory, xpMultipliers: inventory.xpMultipliers + 1 }
        });
        alert('¡Has comprado un Multiplicador de XP x2!');
      } else {
        alert('No tienes suficientes Esmeraldas.');
      }
    } else if (item === 'buyEmerald') {
      if (wallet.oro >= 100) {
        await updateProfile({
          wallet: { ...wallet, oro: wallet.oro - 100, esmeralda: wallet.esmeralda + 1 }
        });
        alert('¡Has comprado 1 Esmeralda!');
      } else {
        alert('No tienes suficiente Oro.');
      }
    } else if (item === 'buyLife') {
      const currentLives = profile.lives ?? 5;
      if (currentLives >= 5) {
        alert('¡Ya tienes el máximo de vidas (5)!');
        return;
      }
      if (wallet.esmeralda >= 5) {
        await updateProfile({
          wallet: { ...wallet, esmeralda: wallet.esmeralda - 5 },
          lives: currentLives + 1
        });
        alert('¡Has recargado 1 Vida!');
      } else {
        alert('No tienes suficientes Esmeraldas.');
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
      alert('¡Avatar comprado y equipado exitosamente!');
    } else {
      alert('No tienes suficiente Oro.');
    }
  };

  const handleBuyFrame = async (id: string, price: number) => {
    if (wallet.esmeralda >= price) {
      await updateProfile({
        wallet: { ...wallet, esmeralda: wallet.esmeralda - price },
        unlockedFrames: [...unlockedFrames, id],
        avatarFrame: id
      });
      alert('¡Marco comprado y equipado exitosamente!');
    } else {
      alert('No tienes suficientes Esmeraldas.');
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-900 transition-colors">
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
            {/* Potenciadores Mantenidos (Exactos) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <Shield className="text-indigo-500" size={32} />
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 rounded-full text-sm">
                  <Gem size={14} /> 3
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Protector de Racha</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4 flex-grow">
                Protege tu racha diaria por 1 día si olvidas practicar. Tienes: {inventory.streakProtectors}
              </p>
              <button onClick={() => handleBuy('streakProtector')} disabled={wallet.esmeralda < 3} className="w-full bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold py-2 rounded-xl transition-colors">
                Comprar
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                  <Zap className="text-amber-500" size={32} />
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 rounded-full text-sm">
                  <Gem size={14} /> 50
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Multiplicador XP x2</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4 flex-grow">
                Duplica tu XP ganado durante las próximas 24 horas. Tienes: {inventory.xpMultipliers}
              </p>
              <button onClick={() => handleBuy('xpMultiplier')} disabled={wallet.esmeralda < 50} className="w-full bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 font-bold py-2 rounded-xl transition-colors">
                Comprar
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                  <Gem className="text-emerald-500" size={32} />
                </div>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold px-3 py-1 rounded-full text-sm">
                  <Diamond size={14} /> 100
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">1 Esmeralda</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4 flex-grow">
                Compra una esmeralda utilizando tu oro acumulado.
              </p>
              <button onClick={() => handleBuy('buyEmerald')} disabled={wallet.oro < 100} className="w-full bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold py-2 rounded-xl transition-colors">
                Comprar
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-xl">
                  <svg className="w-8 h-8 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 rounded-full text-sm">
                  <Gem size={14} /> 5
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recargar 1 Vida</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4 flex-grow">
                Recarga una vida global para continuar tu aprendizaje. Vidas actuales: {profile.lives ?? 5}/5.
              </p>
              <button onClick={() => handleBuy('buyLife')} disabled={wallet.esmeralda < 5 || (profile.lives ?? 5) >= 5} className="w-full bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-bold py-2 rounded-xl transition-colors">
                Comprar
              </button>
            </div>
          </div>
        )}

        {activeTab === 'avatares' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {AVATARS.map((av) => {
              const isUnlocked = unlockedAvatars.includes(av.id);
              return (
                <div key={av.id} className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-4xl mb-3 shadow-inner">
                    {av.emoji}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-1" title={av.name}>{av.name}</h4>
                  <span className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${av.category === 'Épico' ? 'text-fuchsia-500' : 'text-slate-400'}`}>
                    {av.category}
                  </span>
                  
                  {isUnlocked ? (
                    <button disabled className="w-full py-1.5 flex justify-center items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl font-bold text-sm">
                      <Check size={16} /> Adquirido
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleBuyAvatar(av.id, av.priceGold)}
                      disabled={wallet.oro < av.priceGold}
                      className="w-full py-1.5 flex justify-center items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-400 disabled:opacity-50 rounded-xl font-bold text-sm transition-colors"
                    >
                      <Diamond size={14} /> {av.priceGold}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'marcos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {FRAMES.map((fr) => {
              const isUnlocked = unlockedFrames.includes(fr.id);
              return (
                <div key={fr.id} className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 ${fr.cssClass}`}></div>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-1" title={fr.name}>{fr.name}</h4>
                  <span className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${fr.category === 'Legendario' ? 'text-orange-500' : 'text-slate-400'}`}>
                    {fr.category}
                  </span>
                  
                  {isUnlocked ? (
                    <button disabled className="w-full py-1.5 flex justify-center items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl font-bold text-sm">
                      <Check size={16} /> Adquirido
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleBuyFrame(fr.id, fr.priceEmeralds)}
                      disabled={wallet.esmeralda < fr.priceEmeralds}
                      className="w-full py-1.5 flex justify-center items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-400 disabled:opacity-50 rounded-xl font-bold text-sm transition-colors"
                    >
                      <Gem size={14} /> {fr.priceEmeralds}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>

      <BottomNav activeTab="/shop" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
