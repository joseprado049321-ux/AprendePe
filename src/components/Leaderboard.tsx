import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Loader2, ArrowLeft, Shield } from 'lucide-react';
import BottomNav from './BottomNav';

interface LeaderboardProps {
  profile: UserProfile;
}

const LEAGUES = [
  { id: 'bronce', name: 'Bronce', minXp: 0, maxXp: 199, icon: '🥉', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800' },
  { id: 'plata', name: 'Plata', minXp: 200, maxXp: 499, icon: '🥈', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
  { id: 'oro', name: 'Oro', minXp: 500, maxXp: 999, icon: '🥇', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800' },
  { id: 'zafiro', name: 'Zafiro', minXp: 1000, maxXp: 1999, icon: '💎', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'diamante', name: 'Diamante', minXp: 2000, maxXp: Infinity, icon: '👑', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800' }
];

function getLeagueByXp(xp: number) {
  return LEAGUES.find(l => xp >= l.minXp && xp <= l.maxXp) || LEAGUES[0];
}

export default function Leaderboard({ profile }: LeaderboardProps) {
  const userLeague = getLeagueByXp(profile.xp || 0);
  const [activeTab, setActiveTab] = useState(userLeague.id);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const activeLeague = LEAGUES.find(l => l.id === activeTab) || LEAGUES[0];
  const isGuest = profile.uid === 'guest';

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      if (isGuest) {
        const mockData: UserProfile[] = [
          { uid: 'mock1', displayName: 'Estudiante Estrella', xp: 2500, level: 'Secundaria', streak: 5, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock2', displayName: 'Lector Veloz', xp: 1800, level: 'Primaria', streak: 3, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock3', displayName: 'Matemático Pro', xp: 1200, level: 'Secundaria', streak: 1, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock4', displayName: 'Científico', xp: 900, level: 'Secundaria', streak: 2, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock5', displayName: 'Explorador', xp: 750, level: 'Primaria', streak: 1, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock6', displayName: 'Genio', xp: 350, level: 'Secundaria', streak: 0, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock7', displayName: 'Curioso', xp: 150, level: 'Inicial', streak: 0, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'guest', displayName: 'Invitado (Tú)', xp: profile.xp || 0, level: 'Inicial', streak: 0, lastActive: '', points: 0, unlockedAchievements: [], email: '' }
        ];
        // Filter by league manually for mock data
        let filteredMock = mockData.filter(u => u.xp >= activeLeague.minXp && u.xp <= activeLeague.maxXp);
        filteredMock.sort((a, b) => b.xp - a.xp);
        setUsers(filteredMock);
        setLoading(false);
        return;
      }

      try {
        const url = `/api/leaderboard?minXp=${activeLeague.minXp}&maxXp=${activeLeague.maxXp === Infinity ? 'Infinity' : activeLeague.maxXp}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching leaderboard');
        
        const data = await response.json();
        setUsers(data as UserProfile[]);
      } catch (err) {
        console.error('Error fetching leaderboard', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, [activeTab, activeLeague.minXp, activeLeague.maxXp, isGuest, profile.xp]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-24 transition-colors duration-500">
      <header className="flex justify-between items-center px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 transition-colors duration-500">
        <Link to="/home" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-500">
          <Shield className="text-indigo-500" /> Ligas Semanales
        </h1>
        <div className="w-6" /> {/* Placeholder for alignment */}
      </header>

      <div className="relative flex-1 flex flex-col">
        <div className={isGuest ? 'blur-md opacity-40 select-none grayscale pointer-events-none' : ''}>
          {/* Tabs de Ligas */}
          <div className="w-full overflow-x-auto bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-[61px] z-10 scrollbar-hide">
            <div className="flex w-max min-w-full px-2 py-3">
              {LEAGUES.map(league => (
                <button
                  key={league.id}
                  onClick={() => setActiveTab(league.id)}
                  className={`flex-1 flex flex-col items-center justify-center min-w-[80px] px-2 py-2 rounded-xl transition-all mx-1 ${activeTab === league.id ? `${league.bg} ${league.color} scale-105 shadow-sm font-bold` : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <span className="text-2xl mb-1">{league.icon}</span>
                  <span className="text-[10px] uppercase tracking-wider">{league.name}</span>
                </button>
              ))}
            </div>
          </div>

          <main className="w-full max-w-md mx-auto px-4 py-6">
            <div className={`mb-6 p-4 rounded-2xl border ${activeLeague.bg} ${activeLeague.border} text-center`}>
              <h2 className={`font-black text-xl ${activeLeague.color} mb-1 flex items-center justify-center gap-2`}>
                 {activeLeague.icon} Liga {activeLeague.name}
              </h2>
              <p className="text-sm opacity-80 text-slate-700 dark:text-slate-300">
                 {activeLeague.maxXp === Infinity ? `De ${activeLeague.minXp} XP en adelante` : `De ${activeLeague.minXp} a ${activeLeague.maxXp} XP`}
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-bold">Cargando la liga...</p>
              </div>
            ) : (
              <div className="flex flex-col relative h-full min-h-[400px]">
                {users.map((u, index) => {
                  const isCurrentUser = u.uid === profile.uid;
                  
                  // Top 3 styles inside the league
                  let cardBg = 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm';
                  let badgeBg = 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
                  if (index === 0) {
                    cardBg = 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-400/80 dark:border-amber-400/60 text-slate-900 dark:text-white shadow-sm';
                    badgeBg = 'bg-amber-400 text-amber-950 shadow-[0_2px_0_#b45309] font-black';
                  } else if (index === 1) {
                    cardBg = 'bg-slate-500/10 dark:bg-slate-500/15 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white shadow-sm';
                    badgeBg = 'bg-slate-300 text-slate-900 shadow-[0_2px_0_#64748b] font-black';
                  } else if (index === 2) {
                    cardBg = 'bg-orange-500/10 dark:bg-orange-500/15 border-orange-400/80 dark:border-orange-400/60 text-slate-900 dark:text-white shadow-sm';
                    badgeBg = 'bg-orange-400 text-orange-950 shadow-[0_2px_0_#c2410c] font-black';
                  }

                  return (
                    <div 
                      key={u.uid} 
                      className={`flex items-center justify-between p-4 mb-3 rounded-2xl border transition-all hover:-translate-y-0.5 ${cardBg} ${isCurrentUser ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-md' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${badgeBg}`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className={`font-bold text-sm sm:text-base ${isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                            {u.displayName || 'Estudiante'} 
                            {isCurrentUser && ' (Tú)'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{u.level}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{u.xp || 0} XP</div>
                      </div>
                    </div>
                  );
                })}
                
                {users.length === 0 && !isGuest && (
                  <div className="text-center py-12 text-slate-400 font-bold">
                    Nadie ha alcanzado esta liga todavía. ¡Conviértete en el primero!
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {isGuest && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center max-w-sm mx-auto w-full pointer-events-auto">
              <Shield className="text-indigo-500 mx-auto mb-3" size={32} />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Compite en Ligas</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Crea una cuenta para subir de rango y ver quiénes lideran cada liga.</p>
              <button onClick={() => navigate('/register')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer">
                Crear Cuenta Gratis
              </button>
            </div>
          </div>
        )}
      </div>


      <BottomNav activeTab="/leaderboard" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
