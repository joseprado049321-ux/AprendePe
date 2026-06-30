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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 transition-colors duration-500">
      <header className="flex justify-between items-center px-6 py-4 bg-[var(--bg)]/90 backdrop-blur sticky top-0 z-10 border-b-2 border-[var(--gray)] transition-colors duration-500">
        <Link to="/home" className="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-[var(--text)] flex items-center gap-2 transition-colors duration-500">
          <Trophy className="text-yellow-500" /> Ranking Global
        </h1>
        <div className="w-6" /> {/* Placeholder for alignment */}
      </header>

      <main className="w-full max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--muted)]">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="font-bold">Cargando ranking...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((u, index) => {
              const isCurrentUser = u.uid === currentUserId;
              
              // Top 3 styles
              let borderClass = 'border-[var(--gray)]';
              let badgeBg = 'bg-[var(--gray)] text-[var(--text)]';
              if (index === 0) {
                borderClass = 'border-yellow-400 border-2 bg-yellow-50 dark:bg-yellow-500/10';
                badgeBg = 'bg-yellow-400 text-yellow-900 shadow-[0_3px_0_#ca8a04]';
              } else if (index === 1) {
                borderClass = 'border-slate-300 border-2 bg-slate-50 dark:bg-slate-500/10';
                badgeBg = 'bg-slate-300 text-slate-700 shadow-[0_3px_0_#94a3b8]';
              } else if (index === 2) {
                borderClass = 'border-orange-300 border-2 bg-orange-50 dark:bg-orange-500/10';
                badgeBg = 'bg-orange-300 text-orange-900 shadow-[0_3px_0_#c2410c]';
              }

              return (
                <div 
                  key={u.uid} 
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-transform hover:-translate-y-1 ${borderClass} ${isCurrentUser ? 'ring-2 ring-[var(--math)]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${badgeBg}`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className={`font-bold ${isCurrentUser ? 'text-[var(--math)]' : 'text-[var(--text)]'}`}>
                        {u.displayName || 'Estudiante'} 
                        {isCurrentUser && ' (Tú)'}
                      </h3>
                      <p className="text-xs text-[var(--muted)] font-bold">{u.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--text)]">{u.xp || 0} XP</div>
                  </div>
                </div>
              );
            })}
            
            {users.length === 0 && (
              <div className="text-center py-12 text-[var(--muted)] font-bold">
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
