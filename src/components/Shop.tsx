import React from 'react';
import { Diamond, Gem, Shield, Zap } from 'lucide-react';
import { UserProfile } from '../types';
import BottomNav from './BottomNav';
import { useNavigate } from 'react-router-dom';

interface ShopProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Shop({ profile, updateProfile }: ShopProps) {
  const navigate = useNavigate();
  const wallet = profile.wallet || { oro: 0, esmeralda: 0, rubi: 0, diamante: 0 };
  const inventory = profile.inventory || { streakProtectors: 0, xpMultipliers: 0 };

  const handleBuy = async (item: string) => {
    if (item === 'streakProtector') {
      if (wallet.rubi >= 5) {
        await updateProfile({
          wallet: { ...wallet, rubi: wallet.rubi - 5 },
          inventory: { ...inventory, streakProtectors: inventory.streakProtectors + 1 }
        });
        alert('¡Has comprado un Protector de Racha!');
      } else {
        alert('No tienes suficientes Rubíes.');
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 rounded-lg">
              <Diamond className="text-rose-400" size={20} />
              <span className="font-bold">{wallet.rubi}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 rounded-lg">
              <Diamond className="text-cyan-400" size={20} />
              <span className="font-bold">{wallet.diamante}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Potenciadores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Streak Protector */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <Shield className="text-indigo-500" size={32} />
                </div>
                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold px-3 py-1 rounded-full text-sm">
                  <Diamond size={14} /> 5
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Protector de Racha</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4 flex-grow">
                Protege tu racha diaria por 1 día si olvidas practicar. Tienes: {inventory.streakProtectors}
              </p>
              <button 
                onClick={() => handleBuy('streakProtector')}
                disabled={wallet.rubi < 5}
                className="w-full bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30 font-bold py-2 rounded-xl transition-colors"
              >
                Comprar
              </button>
            </div>

            {/* XP Multiplier */}
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
              <button 
                onClick={() => handleBuy('xpMultiplier')}
                disabled={wallet.esmeralda < 50}
                className="w-full bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 font-bold py-2 rounded-xl transition-colors"
              >
                Comprar
              </button>
            </div>

          </div>
        </section>

        <section className="opacity-50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Cosméticos (Próximamente)</h2>
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <p className="text-slate-500 dark:text-slate-400">Pronto podrás comprar avatares y temas exclusivos.</p>
          </div>
        </section>
      </div>

      <BottomNav activeTab="/shop" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
