export interface Task {
  id: string;
  title: string;
  description: string;
  isImprovementAction: boolean;
  overcomesFailureId?: string;
  targetFailureDescription?: string;
  estimatedMinutes: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  completedAt?: string;
  userNote?: string;
  improvementPointAwarded?: boolean;
}

export interface FailureItem {
  id: string;
  date: string;
  failure: string;
  context: string;
  severity: 'minor' | 'moderate' | 'critical';
  rootCause: string;
  status: 'unresolved' | 'in_action' | 'overcome';
  improvementActionTitle?: string;
  improvementActionDetail?: string;
  overcomeDate?: string;
  overcomeReflection?: string;
  praiseNote?: string;
}

export interface StreakData {
  currentStreak: number; // 現在の連続学習日数
  bestStreak: number; // 最高連続日数
  lastReflectionDate?: string; // 最後にふりかえりを完了した日付 (YYYY-MM-DD)
  weeklyHistory: Array<{
    dayName: string; // '月', '火', etc.
    date: string; // YYYY-MM-DD
    completed: boolean;
    isToday: boolean;
  }>;
}

export interface DailyRoutineTask {
  id: string;
  title: string;
  description?: string;
  streakCount: number; // 連続達成日数
  completedToday: boolean;
  lastCompletedDate?: string; // YYYY-MM-DD
  pointAwardedToday?: boolean; // 今日0.5pt獲得済みか
  createdAt: string;
}

export interface UserStats {
  overcomeFailuresCount: number;
  totalLoggedFailures: number;
  currentStreak: number;
  improvementPoints: number; // 改善できた個数＝ポイント
}

export interface TaskMatch {
  taskId: string;
  status: 'completed' | 'not_completed' | 'ambiguous';
  evidence: string;
}

export interface FollowUpQuestion {
  questionId: string;
  relatedTaskId?: string;
  taskTitle?: string;
  questionText: string;
  options: string[];
  userAnswer?: string;
}

export interface ProposedImprovement {
  id: string;
  targetFailure: string;
  actionTitle: string;
  actionDetail: string;
  estimatedMinutes: number;
  selected: boolean;
}

export interface ReflectionAnalysisResult {
  extractedAchievements: string[];
  extractedFailures: Array<{
    id: string;
    failure: string;
    context: string;
    severity: 'minor' | 'moderate' | 'critical';
    rootCause: string;
  }>;
  extractedTomorrowPlans: string[]; // 明日の予定（例: 数学のテスト勉強をしたい）
  taskMatches: TaskMatch[];
  followUpQuestions: FollowUpQuestion[];
  proposedImprovements: ProposedImprovement[];
  encouragementNote: string;
}
