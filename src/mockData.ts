import { Task, FailureItem, StreakData, UserStats, DailyRoutineTask } from './types';

// 初期状態（完全白紙）
export const INITIAL_TASKS: Task[] = [];

export const INITIAL_DAILY_ROUTINES: DailyRoutineTask[] = [];

export const INITIAL_FAILURES: FailureItem[] = [];

export const getInitialStreakData = (): StreakData => {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday

  // 今週の月曜日を起点に7日分を生成
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weeklyHistory = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = dateStr === today.toISOString().split('T')[0];
    return {
      dayName: dayNames[d.getDay()],
      date: dateStr,
      completed: false,
      isToday,
    };
  });

  return {
    currentStreak: 0,
    bestStreak: 0,
    weeklyHistory,
  };
};

export const INITIAL_STREAK: StreakData = getInitialStreakData();

export const INITIAL_USER_STATS: UserStats = {
  overcomeFailuresCount: 0,
  totalLoggedFailures: 0,
  currentStreak: 0,
  improvementPoints: 0,
};


