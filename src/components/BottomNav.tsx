import React from 'react';
import { Map, Trophy, BarChart3, User, Store } from 'lucide-react';
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
    { id: '/shop', label: 'Tienda', icon: Store },
    { id: '/achievements', label: 'Logros', icon: Trophy },
    { id: '/leaderboard', label: 'Ranking', icon: BarChart3 },
    { id: '/profile', label: 'Cuenta', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t-[2px] border-[#e5e5e5] dark:border-slate-800 z-50 pb-safe transition-colors">
      <div className="flex justify-around items-center w-full px-2 py-[12px] min-h-[68px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (activeTab === '/' && tab.id === '/home');
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id.replace('/', '')}`}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center justify-center transition-all duration-300 ease-in-out px-4 py-2 rounded-2xl ${
                isActive ? 'flex-row gap-2 text-[#1cb0f6] bg-[#1cb0f6]/10' : 'flex-col gap-1 text-[#afafaf] dark:text-slate-400 bg-transparent'
              }`}
            >
              <IconComponent 
                size={24} 
                className={`transition-all duration-300 ${isActive ? 'scale-110 stroke-[2.5px]' : 'scale-100 stroke-[2px]'}`}
              />
              <span className={`text-[12px] transition-all duration-300 leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
