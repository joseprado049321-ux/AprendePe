import React, { useState } from 'react';
import { Diamond, Gem, Shield, Zap, UserCircle2, Sparkles, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import BottomNav from './BottomNav';
import { useNavigate } from 'react-router-dom';
import { AVATARS, FRAMES } from '../data/cosmetics';
import { useLives } from '../hooks/useLives';

interface ShopProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function Shop({ profile, updateProfile }: ShopProps) {
  const navigate = useNavigate();
  const { currentLives } = useLives(profile, updateProfile);
  const wallet = profile.wallet || { oro: 0, esmeralda: 0 };
  const inventory = profile.inventory || { streakProtectors: 0, xpMultipliers: 0 };
  const unlockedAvatars = profile.unlockedAvatars || [];
  const unlockedFrames = profile.unlockedFrames || [];

  const [activeTab, setActiveTab] = useState<'pro' | 'potenciadores' | 'avatares' | 'marcos' | 'esmeraldas'>('pro');
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
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
      if (wallet.oro >= 250) {
        await updateProfile({
          wallet: { ...wallet, oro: wallet.oro - 250, esmeralda: wallet.esmeralda + 1 }
        });
        showToast('¡Has comprado 1 Esmeralda!', 'success');
      } else {
        showToast('No tienes suficiente Oro.', 'error');
      }
    } else if (item === 'buyLife') {
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

  const handleBuyEmeraldPackage = (amount: number, price: number) => {
    if (profile.uid === 'guest') return;
    setIsSimulatingPayment(true);
    setTimeout(async () => {
      await updateProfile({
        wallet: { ...wallet, esmeralda: wallet.esmeralda + amount }
      });
      setIsSimulatingPayment(false);
      showToast(`¡Compra exitosa! Recibiste ${amount} Esmeraldas.`, 'success');
    }, 2000);
  };

  const handleWatchAd = () => {
    if (profile.uid === 'guest') return;
    if (isLivesMax) {
      showToast('¡Ya tienes el máximo de vidas!', 'error');
      return;
    }
    setIsSimulatingPayment(true);
    setTimeout(async () => {
      await updateProfile({
        lives: currentLives + 1
      });
      setIsSimulatingPayment(false);
      showToast(`¡Gracias por ver el anuncio! Recibiste 1 Corazón.`, 'success');
    }, 3000);
  };

  // Conditions for boosters
  const canBuyStreak = wallet.esmeralda >= 3;
  const canBuyMultiplier = wallet.esmeralda >= 50;
  const canBuyEmerald = wallet.oro >= 250;
  const isLivesMax = currentLives >= 5;
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
            onClick={() => setActiveTab('pro')}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'pro' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
          >
            <Sparkles size={16} /> AprendePe PRO
          </button>
          <button 
            onClick={() => setActiveTab('potenciadores')}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'potenciadores' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
          >
            <Zap size={16} /> Potenciadores
          </button>
          <button 
            onClick={() => setActiveTab('avatares')}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'avatares' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
          >
            <UserCircle2 size={16} /> Avatares
          </button>
          <button 
            onClick={() => setActiveTab('marcos')}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'marcos' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
          >
            <Diamond size={16} /> Marcos
          </button>
          <button 
            onClick={() => setActiveTab('esmeraldas')}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'esmeraldas' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
          >
            <Gem size={16} /> Esmeraldas
          </button>
        </div>

        {profile.uid === 'guest' && (
           <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-4 mb-6 flex flex-col items-center text-center">
             <AlertCircle className="text-rose-500 mb-2" size={24} />
             <h3 className="font-bold text-rose-700 dark:text-rose-400">Tienda no disponible</h3>
             <p className="text-rose-600 dark:text-rose-300 text-sm mt-1 mb-3">Los invitados no pueden realizar compras. ¡Regístrate para desbloquear la tienda!</p>
             <button onClick={() => navigate('/register')} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-xl text-sm transition-colors cursor-pointer">
               Crear Cuenta
             </button>
           </div>
        )}

        {activeTab === 'pro' && (
          <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-3xl p-1 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-[23px] p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                   AprendePe <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">PRO</span>
                   <Sparkles className="text-amber-500" size={28} />
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">Desbloquea todo tu potencial con la experiencia definitiva.</p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Vidas ilimitadas <span className="line-through text-slate-400 text-sm ml-2 font-normal">5 vidas</span></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Sin anuncios <span className="line-through text-slate-400 text-sm ml-2 font-normal">Publicidad</span></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Tutor PRO y exclusivo</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Cosméticos, avatares y marcos exclusivos</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Respuestas más detalladas y personalizadas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">10 corazones de límite <span className="line-through text-slate-400 text-sm ml-2 font-normal">5 corazones</span></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Recarga rápida (5 min) <span className="line-through text-slate-400 text-sm ml-2 font-normal">30 minutos</span></span>
                  </li>
                </ul>
              </div>
              <div className="w-full md:w-72 shrink-0">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-amber-200 dark:border-amber-900/30 text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">MÁS POPULAR</div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mensual</h3>
                   <div className="flex items-baseline justify-center gap-1 mb-1">
                     <span className="text-lg font-bold text-slate-500">S/</span>
                     <span className="text-5xl font-black text-slate-900 dark:text-white">20</span>
                     <span className="text-lg font-bold text-slate-500">.00</span>
                   </div>
                   <p className="text-sm text-slate-500 mb-6">al mes</p>
                   <button className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2">
                     <Sparkles size={18} /> Obtener PRO
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  disabled={!canBuyStreak || profile.uid === 'guest'} 
                  className="w-full bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 disabled:text-slate-400 dark:disabled:text-slate-500 font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
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
                  disabled={!canBuyMultiplier || profile.uid === 'guest'} 
                  className="w-full bg-amber-50 hover:bg-amber-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 disabled:text-slate-400 dark:disabled:text-slate-500 font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
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
                  Recarga una vida global para continuar tu aprendizaje. Vidas actuales: {currentLives}/5.
                </p>
              </div>

              <div className="w-full mt-2">
                <button 
                  onClick={() => handleBuy('buyLife')} 
                  disabled={!canBuyLife || profile.uid === 'guest'} 
                  className="w-full bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 disabled:text-slate-400 dark:disabled:text-slate-500 font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
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
                          disabled={!hasEnoughGold || profile.uid === 'guest'}
                          className={`w-full py-2 flex justify-center items-center gap-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:cursor-not-allowed ${
                            hasEnoughGold && profile.uid !== 'guest'
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
                          disabled={!hasEnoughEmeralds || profile.uid === 'guest'}
                          className={`w-full py-2 flex justify-center items-center gap-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:cursor-not-allowed ${
                            hasEnoughEmeralds && profile.uid !== 'guest'
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

        {activeTab === 'esmeraldas' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Paquetes */}
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Gem className="text-emerald-500" /> Paquetes de esmeraldas recomendados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Paquete Inicial */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-3 py-1 rounded-bl-lg">PAQUETE INICIAL</div>
                  <div>
                    <div className="flex items-start justify-between mb-4 mt-2">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                        <Gem className="text-emerald-500" size={32} />
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 font-bold px-3 py-1 rounded-full text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                          <Gem size={14} className="text-emerald-500" />
                          <span>100</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">S/ 0.050 c/u</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">100 Esmeraldas</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                      Ideal para probar artículos o comprar potenciadores ocasionales.
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    <button 
                      onClick={() => handleBuyEmeraldPackage(100, 5)}
                      disabled={profile.uid === 'guest' || isSimulatingPayment} 
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2.5 rounded-xl transition-colors cursor-pointer flex justify-center items-center gap-2"
                    >
                      {isSimulatingPayment ? 'Procesando...' : <>S/ 5.00</>}
                    </button>
                  </div>
                </div>

                {/* Paquete Inter / Popular */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-1 shadow-lg shadow-indigo-500/20 h-full relative group hover:-translate-y-1 transition-transform">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md z-10 whitespace-nowrap">
                    ⭐ Más Popular
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 flex flex-col h-full justify-between pt-6">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                          <Gem className="text-indigo-500" size={32} />
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 font-bold px-3 py-1 rounded-full text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <Gem size={14} className="text-indigo-500" />
                            <span>1,000</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 font-medium">S/ 0.020 c/u</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">1,000 Esmeraldas</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                        El precio coincide con la suscripción PRO. Perfecto para cosméticos.
                      </p>
                    </div>
                    <div className="w-full mt-2">
                      <button 
                        onClick={() => handleBuyEmeraldPackage(1000, 20)}
                        disabled={profile.uid === 'guest' || isSimulatingPayment} 
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                      >
                        {isSimulatingPayment ? 'Procesando...' : 'S/ 20.00'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Paquete Premium / Ahorro */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-amber-200 dark:border-amber-900/30 flex flex-col h-full justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">🏆 MAYOR AHORRO</div>
                  <div>
                    <div className="flex items-start justify-between mb-4 mt-2">
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                        <Gem className="text-amber-500" size={32} />
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 font-bold px-3 py-1 rounded-full text-sm bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                          <Gem size={14} className="text-amber-500" />
                          <span>7,000</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">S/ 0.014 c/u</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">7,000 Esmeraldas</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                      Para estudiantes muy dedicados. El mayor valor por tu dinero.
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    <button 
                      onClick={() => handleBuyEmeraldPackage(7000, 100)}
                      disabled={profile.uid === 'guest' || isSimulatingPayment} 
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2.5 rounded-xl transition-colors cursor-pointer flex justify-center items-center gap-2"
                    >
                      {isSimulatingPayment ? 'Procesando...' : <>S/ 100.00</>}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Ads & Exchange */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Sección Inferior Izquierda: Anuncios */}
               <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Zap className="text-purple-500" /> Anuncios
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 mb-6">
                       <li className="flex gap-2 items-start"><Check size={16} className="text-purple-500 mt-0.5 shrink-0" /> Anuncios al terminar el nivel</li>
                       <li className="flex gap-2 items-start"><Check size={16} className="text-purple-500 mt-0.5 shrink-0" /> Google Ads (Mundial) y Locales</li>
                       <li className="flex gap-2 items-start"><Check size={16} className="text-purple-500 mt-0.5 shrink-0" /> Para cada corazón una sola vez se te permite ver un anuncio.</li>
                    </ul>
                  </div>
                  <button onClick={handleWatchAd} disabled={profile.uid === 'guest'} className="w-full bg-purple-50 text-purple-600 font-bold py-3 rounded-xl hover:bg-purple-100 transition-colors flex justify-center items-center gap-2 dark:bg-purple-500/20 dark:text-purple-400 dark:hover:bg-purple-500/30">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    Ver Anuncio por 1 Vida
                  </button>
               </div>

               {/* Sección Derecha: Tipo de cambio */}
               <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Diamond className="text-amber-500" /> Tipo de cambio
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
                      <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                         <li className="flex items-center justify-between">
                           <span className="font-medium">Moneda Oficial:</span>
                           <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400"><Gem size={14} /> Esmeralda</span>
                         </li>
                         <li className="flex items-center justify-between border-t border-slate-200 dark:border-slate-600 pt-3">
                           <span className="font-medium">Moneda Gratuita:</span>
                           <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400"><Diamond size={14} /> Oro</span>
                         </li>
                      </ul>
                    </div>
                    <div className="flex items-center justify-center gap-3 mb-2">
                       <div className="flex items-center gap-1 font-bold text-emerald-600"><Gem size={18}/> 1</div>
                       <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                       <div className="flex items-center gap-1 font-bold text-amber-500"><Diamond size={18}/> 250</div>
                    </div>
                    <p className="text-[11px] text-center text-rose-500 dark:text-rose-400 font-medium mb-4">* Solo se puede intercambiar Oro por Esmeraldas, no al revés.</p>
                  </div>
                  
                  <div className="w-full">
                    <button 
                      onClick={() => handleBuy('buyEmerald')} 
                      disabled={!canBuyEmerald || profile.uid === 'guest'} 
                      className="w-full bg-amber-50 text-amber-600 font-bold py-3 rounded-xl hover:bg-amber-100 transition-colors flex justify-center items-center gap-2 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Diamond size={16} /> Intercambiar 250 Oro por 1 <Gem size={16} className="text-emerald-500 ml-1" />
                    </button>
                    {!canBuyEmerald && (
                      <p className="text-xs text-rose-500 dark:text-rose-400 font-medium text-center mt-2 flex items-center justify-center gap-1">
                        <AlertCircle size={13} className="shrink-0" /> No tienes suficiente Oro
                      </p>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

      </div>

      <BottomNav activeTab="/shop" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
