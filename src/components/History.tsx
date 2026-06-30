import React from 'react';
import { UserProfile } from '../types';
import { Clock } from 'lucide-react';
import { getSubjectTheme } from '../lib/theme';

interface HistoryProps {
  profile: UserProfile;
}

export default function History({ profile }: HistoryProps) {
  const history = profile.history || [];

  if (history.length === 0) {
    return (
      <section className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl transition-colors shadow-sm dark:shadow-none text-center">
        <Clock size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aún no hay historial</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Tus últimas lecciones aparecerán aquí. ¡Comienza a aprender para ganar experiencia!
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl transition-colors shadow-sm dark:shadow-none overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="text-indigo-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Últimas 10 lecciones</h2>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-4 px-4 font-bold">Fecha</th>
              <th className="py-4 px-4 font-bold">Tema</th>
              <th className="py-4 px-4 font-bold text-right">XP Obtenido</th>
            </tr>
          </thead>
          <tbody>
            {history.map((lesson) => {
              const theme = getSubjectTheme(lesson.subject);
              const dateObj = new Date(lesson.date);
              
              const today = new Date();
              const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();
              const formattedDate = isToday 
                ? `Hoy, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <tr key={lesson.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {formattedDate}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${theme.accentBg} ${theme.textHeading} bg-opacity-10 dark:bg-opacity-20`}>
                      {lesson.subject}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    +{lesson.xpEarned} XP
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
