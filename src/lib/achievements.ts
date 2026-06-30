import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    title: 'Primer Paso',
    description: 'Completa tu primera lección.',
    icon: '🎓',
    conditionType: 'first_lesson',
    conditionValue: 1,
  },
  {
    id: 'streak_3',
    title: 'En Racha',
    description: 'Alcanza una racha de 3 días.',
    icon: '🔥',
    conditionType: 'streak',
    conditionValue: 3,
  },
  {
    id: 'streak_7',
    title: 'Semana Perfecta',
    description: 'Estudia 7 días seguidos.',
    icon: '📅',
    conditionType: 'streak',
    conditionValue: 7,
  },
  {
    id: 'points_100',
    title: 'Buscador de Conocimiento',
    description: 'Acumula 100 puntos XP.',
    icon: '⭐',
    conditionType: 'points',
    conditionValue: 100,
  },
  {
    id: 'points_500',
    title: 'Erudito',
    description: 'Acumula 500 puntos XP.',
    icon: '🧠',
    conditionType: 'points',
    conditionValue: 500,
  },
  {
    id: 'perfect_lesson',
    title: 'Sin Errores',
    description: 'Completa una lección sin equivocarte.',
    icon: '✨',
    conditionType: 'perfect_lesson',
    conditionValue: 1,
  }
];

export const checkAchievements = (
  currentAchievements: string[],
  stats: { streak: number; points: number; isPerfectLesson?: boolean; isFirstLesson?: boolean }
): string[] => {
  const newAchievements: string[] = [];

  ACHIEVEMENTS.forEach((achievement) => {
    if (!currentAchievements.includes(achievement.id)) {
      let isUnlocked = false;

      switch (achievement.conditionType) {
        case 'streak':
          isUnlocked = stats.streak >= achievement.conditionValue;
          break;
        case 'points':
          isUnlocked = stats.points >= achievement.conditionValue;
          break;
        case 'perfect_lesson':
          isUnlocked = !!stats.isPerfectLesson;
          break;
        case 'first_lesson':
          isUnlocked = !!stats.isFirstLesson || stats.points > 0;
          break;
      }

      if (isUnlocked) {
        newAchievements.push(achievement.id);
      }
    }
  });

  return newAchievements;
};
