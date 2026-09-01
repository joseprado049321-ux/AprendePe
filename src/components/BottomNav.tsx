import React from 'react';
import { Map, Trophy, BarChart3, User, Store, BookOpen } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';
import { motion } from 'motion/react';

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
    <nav className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 z-50 pb-safe transition-colors shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
      <div className="flex justify-start sm:justify-around items-center w-full max-w-xl mx-auto px-4 py-3 min-h-[72px] overflow-x-auto no-scrollbar gap-2 sm:gap-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (activeTab === '/' && tab.id === '/home');
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id.replace('/', '')}`}
              onClick={() => handleTabClick(tab.id)}
              aria-label={tab.label}
              className={`relative flex items-center justify-center transition-all duration-500 ease-out px-4 py-2.5 rounded-2xl cursor-pointer flex-col gap-1 shrink-0 w-[75px] sm:w-[85px] z-10 group ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl shadow-sm border border-indigo-100/50 dark:border-indigo-800/30 -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                />
              )}
              <IconComponent 
                size={isActive ? 24 : 22} 
                className={`transition-all duration-500 ${isActive ? '-translate-y-1 scale-110 stroke-[2.5px]' : 'scale-100 stroke-[2px] group-hover:scale-105 group-hover:-translate-y-0.5'}`}
              />
              <span className={`text-[11px] leading-none transition-all duration-500 font-semibold ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
