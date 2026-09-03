export type Level = 'Inicial' | 'Primaria' | 'Secundaria';
export type Subject = 'Matemáticas' | 'Historia' | 'Comunicación' | 'Ciencias';

export interface SubTheme {
  id: string;
  name: string;
  requiredXP: number;     // XP required to COMPLETE this node and unlock the next
  cnebCompetence: string; // Official CNEB competence
  promptTopic: string;    // Instruction for Gemini
}

export interface Biome {
  id: string;
  name: string;
  bgGradient: string;     // Tailwind gradient classes for procedural generation
  fadeGradient?: string;  // Gradient for smooth transition at the bottom
  pathColor: string;      // Color for the path connecting nodes
  subThemes: SubTheme[];
}

export interface UserDiagnostic {
  level: Level;
  score: number;
  completedAt: string;
}

export interface QuestionCache {
  id?: string;
  userId: string;
  theme: Subject;
  level: Level;
  questions: Question[];
  createdAt: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_in_the_blanks';

export interface Question {
  id: string;
  type?: QuestionType; // Optional for backward compatibility, defaults to multiple_choice
  text: string;
  options: string[]; // Still used for true/false or choices
  correctAnswerIndex: number;
  explanation: string;
  subject?: Subject;
  cnebCompetence?: string;
  // Specific fields for fill_in_the_blanks
  blankSentence?: string; // e.g. "El perro ___ (correr) rápido."
  correctWords?: string[]; // e.g. ["corre"]
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  conditionType: 'streak' | 'points' | 'perfect_lesson' | 'first_lesson' | 'survivor';
  conditionValue: number;
  difficulty: 'Fácil' | 'Medio' | 'Difícil' | 'Épico';
  rewardType: 'oro' | 'esmeralda';
  rewardAmount: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
  isClaimed: boolean;
}

export interface LessonHistory {
  id: string;
  date: string;
  subject: Subject;
  xpEarned: number;
  accuracyPercentage?: number;
  livesLost?: number;
}

export interface MistakeItem {
  id: string;
  question: Question;
  subject: Subject;
  level: Level;
  failedAt: string;
  userAnswerIndex: number;
  mastered: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  streak: number;
  perfectLessonsStreak?: number;
  lives?: number;
  livesUpdatedAt?: string;
  lastActive: string | null;
  points: number;
  xp: number;
  unlockedLevels?: Record<string, number>;
  lastSelectedCourse?: string;
  unlockedAchievements: (UnlockedAchievement | string)[];
  avatar?: string;
  avatarFrame?: string;
  unlockedAvatars?: string[];
  unlockedFrames?: string[];
  level: Level;
  educationalStage?: 'Inicial' | 'Primaria' | 'Secundaria';
  grade?: string;
  selfAssessedLevel?: string;
  diagnosticScore?: number;
  diagnosticLevel?: Level;
  hasCompletedDiagnostic?: boolean;
  theme?: 'light' | 'dark';
  tutor?: string;
  parentalPin?: string;
  parentalEmail?: string;
  hasCompletedTour?: boolean;
  showCNEBCompetencies?: boolean;
  notificationsEnabled?: boolean;
  dailyReminderTime?: string;
  history?: LessonHistory[];
  mistakeBank?: MistakeItem[];
  wallet?: {
    oro: number;
    esmeralda: number;
  };
  inventory?: {
    streakProtectors: number;
    xpMultipliers: number;
  };
  isPro?: boolean;
  difficultyModifier?: number;
}
