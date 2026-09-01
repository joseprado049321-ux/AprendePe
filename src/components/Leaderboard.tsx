import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Loader2, ArrowLeft } from 'lucide-react';
import BottomNav from './BottomNav';

interface LeaderboardProps {
  currentUserId: string;
}

export default function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLeaderboard() {
      if (currentUserId === 'guest') {
        const mockData: UserProfile[] = [
          { uid: 'mock1', displayName: 'Estudiante Estrella', xp: 2500, level: 'Secundaria', streak: 5, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock2', displayName: 'Lector Veloz', xp: 1800, level: 'Primaria', streak: 3, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock3', displayName: 'Matemático Pro', xp: 1200, level: 'Secundaria', streak: 1, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock4', displayName: 'Científico', xp: 900, level: 'Secundaria', streak: 2, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock5', displayName: 'Explorador', xp: 750, level: 'Primaria', streak: 1, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock6', displayName: 'Genio', xp: 600, level: 'Secundaria', streak: 0, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'mock7', displayName: 'Curioso', xp: 450, level: 'Inicial', streak: 0, lastActive: '', points: 0, unlockedAchievements: [], email: '' },
          { uid: 'guest', displayName: 'Invitado (Tú)', xp: 0, level: 'Inicial', streak: 0, lastActive: '', points: 0, unlockedAchievements: [], email: '' }
        ];
        // Sort descending by xp
        mockData.sort((a, b) => b.xp - a.xp);
        setUsers(mockData);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id,
        })) as UserProfile[];
        setUsers(data);
      } catch (err) {
        console.error('Error fetching leaderboard', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [currentUserId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-24 transition-colors duration-500">
      <header className="flex justify-between items-center px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 transition-colors duration-500">
        <Link to="/home" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-500">
          <Trophy className="text-amber-500" /> Ranking Global
        </h1>
        <div className="w-6" /> {/* Placeholder for alignment */}
      </header>

      <main className="w-full max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="font-bold">Cargando ranking...</p>
          </div>
        ) : (
          <div className="flex flex-col relative">
            {users.map((u, index) => {
              const isCurrentUser = u.uid === currentUserId;
              const isGuestBlurred = currentUserId === 'guest' && index > 2;
              
              // Top 3 styles
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
                  className={`flex items-center justify-between p-4 mb-3 rounded-2xl border transition-all ${isGuestBlurred ? 'blur-md opacity-40 select-none grayscale' : 'hover:-translate-y-0.5'} ${cardBg} ${isCurrentUser ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-md' : ''}`}
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
            
            {currentUserId === 'guest' && (
              <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 flex flex-col items-center justify-end pb-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center max-w-sm mx-auto w-full">
                  <Trophy className="text-amber-500 mx-auto mb-3" size={32} />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Desbloquea el Ranking</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Crea una cuenta para competir con otros estudiantes y ver tu posición real.</p>
                  <button onClick={() => navigate('/register')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer">
                    Crear Cuenta Gratis
                  </button>
                </div>
              </div>
            )}
            
            {users.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-bold">
                Aún no hay usuarios en el ranking. ¡Sé el primero!
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav activeTab="/leaderboard" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
