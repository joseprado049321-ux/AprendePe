import React from 'react';
import { Map, Trophy, BarChart3, User, Store, BookOpen } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';

interface BottomNavProps {
  activeTab: string;
  onChangeTab: (tabId: string) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const { playSound } = useSound();

  const handleTabClick = (tabId: string) => {
    playSound('click');
    onChangeTab(tabId);
  };

  const tabs = [
    { id: '/home', label: 'Niveles', icon: Map },
    { id: '/review', label: 'Baúl', icon: BookOpen },
    { id: '/shop', label: 'Tienda', icon: Store },
    { id: '/achievements', label: 'Logros', icon: Trophy },
    { id: '/leaderboard', label: 'Ranking', icon: BarChart3 },
    { id: '/profile', label: 'Cuenta', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 pb-safe transition-colors shadow-sm">
      <div className="flex justify-around items-center w-full max-w-xl mx-auto px-1 sm:px-2 py-2 min-h-[64px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (activeTab === '/' && tab.id === '/home');
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id.replace('/', '')}`}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center justify-center transition-all duration-300 ease-in-out px-2 sm:px-3 py-1.5 rounded-2xl cursor-pointer ${
                isActive 
                  ? 'flex-row gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 font-bold shadow-xs' 
                  : 'flex-col gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium'
              }`}
            >
              <IconComponent 
                size={20} 
                className={`transition-transform duration-300 ${isActive ? 'scale-110 stroke-[2.5px]' : 'scale-100 stroke-[2px]'}`}
              />
              <span className="text-[11px] sm:text-[12px] leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
