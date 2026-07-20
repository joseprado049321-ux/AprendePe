import { Achievement, UnlockedAchievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    title: 'Primer Paso',
    description: 'Completa tu primera lección.',
    icon: '🎓',
    conditionType: 'first_lesson',
    conditionValue: 1,
    difficulty: 'Fácil',
    rewardType: 'oro',
    rewardAmount: 50
  },
  {
    id: 'streak_3',
    title: 'En Racha',
    description: 'Alcanza una racha de 3 días.',
    icon: '🔥',
    conditionType: 'streak',
    conditionValue: 3,
    difficulty: 'Fácil',
    rewardType: 'oro',
    rewardAmount: 100
  },
  {
    id: 'streak_7',
    title: 'Semana Perfecta',
    description: 'Estudia 7 días seguidos.',
    icon: '📅',
    conditionType: 'streak',
    conditionValue: 7,
    difficulty: 'Medio',
    rewardType: 'esmeralda',
    rewardAmount: 1
  },
  {
    id: 'streak_14',
    title: 'Maratón',
    description: 'Estudia 14 días seguidos.',
    icon: '🏃',
    conditionType: 'streak',
    conditionValue: 14,
    difficulty: 'Difícil',
    rewardType: 'esmeralda',
    rewardAmount: 2
  },
  {
    id: 'points_100',
    title: 'Buscador de Conocimiento',
    description: 'Acumula 100 puntos XP.',
    icon: '⭐',
    conditionType: 'points',
    conditionValue: 100,
    difficulty: 'Fácil',
    rewardType: 'oro',
    rewardAmount: 50
  },
  {
    id: 'points_500',
    title: 'Erudito',
    description: 'Acumula 500 puntos XP.',
    icon: '🧠',
    conditionType: 'points',
    conditionValue: 500,
    difficulty: 'Medio',
    rewardType: 'oro',
    rewardAmount: 200
  },
  {
    id: 'points_2500',
    title: 'Mente Maestra',
    description: 'Acumula 2500 puntos XP.',
    icon: '🌌',
    conditionType: 'points',
    conditionValue: 2500,
    difficulty: 'Épico',
    rewardType: 'esmeralda',
    rewardAmount: 10
  },
  {
    id: 'perfect_lesson',
    title: 'Sin Errores',
    description: 'Completa una lección sin equivocarte.',
    icon: '✨',
    conditionType: 'perfect_lesson',
    conditionValue: 1,
    difficulty: 'Fácil',
    rewardType: 'oro',
    rewardAmount: 50
  },
  {
    id: 'survivor',
    title: 'Sobreviviente',
    description: 'Termina una lección manteniendo tus 5 vidas intactas.',
    icon: '🛡️',
    conditionType: 'survivor',
    conditionValue: 5,
    difficulty: 'Medio',
    rewardType: 'oro',
    rewardAmount: 150
  }
];

export const checkAchievements = (
  currentAchievements: (UnlockedAchievement | string)[],
  stats: { streak: number; points: number; isPerfectLesson?: boolean; isFirstLesson?: boolean; livesLeft?: number }
): UnlockedAchievement[] => {
  const newAchievements: UnlockedAchievement[] = [];
  
  // Extract IDs to easily check if unlocked
  const unlockedIds = currentAchievements.map(ach => typeof ach === 'string' ? ach : ach.id);

  ACHIEVEMENTS.forEach((achievement) => {
    if (!unlockedIds.includes(achievement.id)) {
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
        case 'survivor':
          isUnlocked = (stats.livesLeft !== undefined) && (stats.livesLeft >= achievement.conditionValue);
          break;
      }

      if (isUnlocked) {
        newAchievements.push({
          id: achievement.id,
          unlockedAt: new Date().toISOString(),
          isClaimed: false
        });
      }
    }
  });

  return newAchievements;
};
