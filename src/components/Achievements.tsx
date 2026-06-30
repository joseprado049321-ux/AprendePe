import React from 'react';
import { UserProfile } from '../types';
import { ACHIEVEMENTS } from '../lib/achievements';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';

interface AchievementsProps {
  profile: UserProfile;
}

export default function Achievements({ profile }: AchievementsProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 transition-colors duration-500">
      <header className="flex justify-between items-center px-6 py-4 bg-[var(--bg)]/90 backdrop-blur sticky top-0 z-10 border-b-2 border-[var(--gray)] transition-colors duration-500">
        <h1 className="text-xl font-bold text-[var(--text)] transition-colors duration-500">Tus Logros</h1>
      </header>

      <main className="w-full max-w-md mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map(ach => {
            const unlocked = profile.unlockedAchievements.includes(ach.id);
            return (
              <div 
                key={ach.id} 
                className={`flex flex-col items-center p-4 rounded-xl text-center border-2 transition-all ${
                  unlocked 
                    ? 'bg-[#1cb0f6]/10 border-[#1cb0f6] shadow-[0_4px_0_#1cb0f6]' 
                    : 'bg-[var(--gray)] border-[var(--gray)] opacity-60 grayscale'
                }`}
              >
                <div className="text-4xl mb-3">{ach.icon}</div>
                <h3 className={`font-bold text-[14px] leading-tight mb-1 ${unlocked ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>
                  {ach.title}
                </h3>
                <p className="text-[12px] text-[var(--muted)]">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav activeTab="/achievements" onChangeTab={(tab) => navigate(tab)} />
    </div>
  );
}
