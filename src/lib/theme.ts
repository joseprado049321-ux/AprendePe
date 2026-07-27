import { Level, Subject } from '../types';

export interface ThemeSetup {
  appBg: string;
  card: string;
  textHeading: string;
  textBody: string;
  buttonClass: string;
  buttonText: string;
  buttonDefault: string;
  buttonCorrect: string;
  buttonIncorrect: string;
  progressBg: string;
  progressFill: string;
  panelCorrect: string;
  panelIncorrect: string;
  panelButtonCorrect: string;
  panelButtonIncorrect: string;
  iconColor: string;
}

export const getSubjectTheme = (subject: Subject) => {
  switch (subject) {
    case 'Matemáticas': return { bg: 'bg-[var(--bg)]', text: 'text-[var(--text)]', node: 'bg-[var(--math)] border-[var(--math-s)]', activeTab: 'bg-[var(--math)]', line: 'bg-[var(--gray)]', iconBg: 'bg-[var(--math)] text-white', accentBg: 'bg-[#1cb0f6] dark:bg-[#1cb0f6]/20', textHeading: 'text-[#1cb0f6]' };
    case 'Historia': return { bg: 'bg-[var(--bg)]', text: 'text-[var(--text)]', node: 'bg-[var(--social)] border-[var(--social-s)]', activeTab: 'bg-[var(--social)]', line: 'bg-[var(--gray)]', iconBg: 'bg-[var(--social)] text-white', accentBg: 'bg-[#ff9600] dark:bg-[#ff9600]/20', textHeading: 'text-[#ff9600]' };
    case 'Comunicación': return { bg: 'bg-[var(--bg)]', text: 'text-[var(--text)]', node: 'bg-[var(--comm)] border-[var(--comm-s)]', activeTab: 'bg-[var(--comm)]', line: 'bg-[var(--gray)]', iconBg: 'bg-[var(--comm)] text-white', accentBg: 'bg-[#ce82ff] dark:bg-[#ce82ff]/20', textHeading: 'text-purple-600' };
    case 'Ciencias': return { bg: 'bg-[var(--bg)]', text: 'text-[var(--text)]', node: 'bg-[var(--science)] border-[var(--science-s)]', activeTab: 'bg-[var(--science)]', line: 'bg-[var(--gray)]', iconBg: 'bg-[var(--science)] text-white', accentBg: 'bg-[#58cc02] dark:bg-[#58cc02]/20', textHeading: 'text-[#58cc02]' };
    case 'Variado': return { bg: 'bg-[var(--bg)]', text: 'text-[var(--text)]', node: 'bg-[var(--math)] border-[var(--math-s)]', activeTab: 'bg-[var(--danger)]', line: 'bg-[var(--gray)]', iconBg: 'bg-yellow-500 text-slate-900', accentBg: 'bg-yellow-500 dark:bg-yellow-500/20', textHeading: 'text-yellow-600' };
    default: return { bg: 'bg-[var(--bg)]', text: 'text-[var(--text)]', node: 'bg-[var(--math)] border-[var(--math-s)]', activeTab: 'bg-[var(--math)]', line: 'bg-[var(--gray)]', iconBg: 'bg-[var(--math)] text-white', accentBg: 'bg-[#1cb0f6] dark:bg-[#1cb0f6]/20', textHeading: 'text-[#1cb0f6]' };
  }
};

export const getTheme = (level: Level): ThemeSetup => {
  switch (level) {
    case 'Inicial':
      return {
        appBg: 'bg-transparent min-h-screen font-playful',
        card: 'bg-white dark:bg-slate-800 rounded-[2rem] border-4 border-b-8 border-sky-300 dark:border-slate-700 shadow-xl p-8',
        textHeading: 'text-4xl font-bold text-sky-600 dark:text-sky-400',
        textBody: 'text-2xl text-slate-700 dark:text-slate-200 font-semibold tracking-wide',
        buttonClass: 'rounded-[1.5rem] border-4 border-b-[8px] active:border-b-4 active:translate-y-[4px] transition-all p-6 w-full flex items-center justify-center',
        buttonText: 'text-2xl font-bold tracking-wide text-center',
        buttonDefault: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 border-b-slate-300 dark:border-b-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 relative top-0 text-slate-600 dark:text-white',
        buttonCorrect: 'bg-green-600 dark:bg-green-500 border-green-700 dark:border-green-600 text-white',
        buttonIncorrect: 'bg-red-600 dark:bg-red-500 border-red-700 dark:border-red-600 text-white',
        progressBg: 'bg-slate-200/60 dark:bg-slate-700 h-5 rounded-full overflow-hidden',
        progressFill: 'bg-green-600 dark:bg-green-500 h-full rounded-full transition-all duration-500 ease-out',
        panelCorrect: 'bg-green-600 dark:bg-green-500 text-white px-6 py-8 flex flex-col sm:flex-row gap-6 justify-between items-center',
        panelIncorrect: 'bg-red-600 dark:bg-red-500 text-white px-6 py-8 flex flex-col sm:flex-row gap-6 justify-between items-center',
        panelButtonCorrect: 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-500 rounded-[1.5rem] py-4 px-10 text-2xl font-bold border-4 border-b-[8px] border-green-100 dark:border-slate-700 active:translate-y-[4px] active:border-b-4 w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-700',
        panelButtonIncorrect: 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-500 rounded-[1.5rem] py-4 px-10 text-2xl font-bold border-4 border-b-[8px] border-red-100 dark:border-slate-700 active:translate-y-[4px] active:border-b-4 w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-700',
        iconColor: 'text-amber-400',
      };
    case 'Primaria':
      return {
        appBg: 'bg-transparent min-h-screen font-sans',
        card: 'bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-6',
        textHeading: 'text-2xl font-bold text-slate-800 dark:text-white',
        textBody: 'text-xl text-slate-800 dark:text-slate-200',
        buttonClass: 'rounded-xl border-2 border-b-4 active:border-b-2 active:translate-y-[2px] transition-all p-4 w-full flex items-center justify-center',
        buttonText: 'text-lg font-semibold text-center',
        buttonDefault: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 border-b-slate-300 dark:border-b-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white',
        buttonCorrect: 'bg-green-600 dark:bg-green-500 border-green-700 dark:border-green-600 text-white',
        buttonIncorrect: 'bg-red-600 dark:bg-red-500 border-red-700 dark:border-red-600 text-white',
        progressBg: 'bg-slate-200 dark:bg-slate-700 h-3 flex overflow-hidden rounded-full',
        progressFill: 'bg-indigo-500 h-full transition-all duration-300 ease-out',
        panelCorrect: 'bg-green-600 dark:bg-green-500 text-white px-6 py-6 shadow-lg flex flex-col sm:flex-row gap-4 justify-between items-center',
        panelIncorrect: 'bg-red-600 dark:bg-red-500 text-white px-6 py-6 shadow-lg flex flex-col sm:flex-row gap-4 justify-between items-center',
        panelButtonCorrect: 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-500 rounded-xl py-3 px-8 text-lg font-bold border-2 border-b-4 border-green-100 dark:border-slate-700 active:translate-y-[2px] active:border-b-2 w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-700',
        panelButtonIncorrect: 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-500 rounded-xl py-3 px-8 text-lg font-bold border-2 border-b-4 border-red-100 dark:border-slate-700 active:translate-y-[2px] active:border-b-2 w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-700',
        iconColor: 'text-indigo-500',
      };
    case 'Secundaria':
      return {
        appBg: 'bg-transparent min-h-screen font-sans',
        card: 'bg-white/5 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl',
        textHeading: 'text-3xl sm:text-4xl font-light text-slate-800 dark:text-white leading-tight',
        textBody: 'text-lg sm:text-xl font-medium text-slate-700 dark:text-slate-300',
        buttonClass: 'group relative p-4 sm:p-6 rounded-2xl transition-all border-2 text-left flex items-center justify-start gap-4 w-full backdrop-blur-md',
        buttonText: 'text-lg sm:text-xl font-medium',
        buttonDefault: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white cursor-pointer',
        buttonCorrect: 'bg-green-600 dark:bg-green-500 border-green-500 text-white',
        buttonIncorrect: 'bg-red-600 dark:bg-red-500 border-red-500 text-white',
        progressBg: 'bg-slate-200 dark:bg-slate-800 h-4 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700',
        progressFill: 'bg-indigo-500 h-full shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out',
        panelCorrect: 'bg-green-600 dark:bg-green-500 text-white backdrop-blur-xl border-t border-emerald-500/30 px-6 sm:px-10 py-8 flex flex-col sm:flex-row gap-6 justify-between items-center relative z-50',
        panelIncorrect: 'bg-red-600 dark:bg-red-500 text-white backdrop-blur-xl border-t border-rose-500/30 px-6 sm:px-10 py-8 flex flex-col sm:flex-row gap-6 justify-between items-center relative z-50',
        panelButtonCorrect: 'px-10 py-4 bg-white dark:bg-slate-800 text-green-700 dark:text-green-500 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 text-lg cursor-pointer w-full sm:w-auto',
        panelButtonIncorrect: 'px-10 py-4 bg-white dark:bg-slate-800 text-red-700 dark:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold rounded-2xl shadow-lg shadow-rose-500/30 transition-all transform hover:scale-105 active:scale-95 text-lg cursor-pointer w-full sm:w-auto',
        iconColor: 'text-indigo-400',
      };
  }
};
