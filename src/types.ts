export type Level = 'Inicial' | 'Primaria' | 'Secundaria';
export type Subject = 'Matemáticas' | 'Historia' | 'Comunicación' | 'Ciencias' | 'Variado';

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

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  subject?: Subject;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  conditionType: 'streak' | 'points' | 'perfect_lesson' | 'first_lesson';
  conditionValue: number;
}

export interface LessonHistory {
  id: string;
  date: string;
  subject: Subject;
  xpEarned: number;
  accuracyPercentage?: number;
  livesLost?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  streak: number;
  perfectLessonsStreak?: number;
  lives?: number;
  lastActive: string | null;
  points: number;
  xp: number;
  unlockedLevels?: Record<string, number>;
  lastSelectedCourse?: string;
  unlockedAchievements: string[];
  level: Level;
  educationalStage?: 'Inicial' | 'Primaria' | 'Secundaria';
  grade?: string;
  selfAssessedLevel?: string;
  diagnosticScore?: number;
  diagnosticLevel?: Level;
  hasCompletedDiagnostic?: boolean;
  theme?: 'light' | 'dark';
  weeklyGoals?: { targetXP: number; currentXP: number; resetDate: string; tasksCompleted?: number; };
  hasCompletedTour?: boolean;
  notificationsEnabled?: boolean;
  dailyReminderTime?: string;
  history?: LessonHistory[];
  wallet?: {
    oro: number;
    esmeralda: number;
  };
  inventory?: {
    streakProtectors: number;
    xpMultipliers: number;
  };
}
