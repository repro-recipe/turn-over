/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  INITIAL_TASKS,
  INITIAL_FAILURES,
  INITIAL_STREAK,
  INITIAL_USER_STATS,
  INITIAL_DAILY_ROUTINES,
} from './mockData';
import { Task, FailureItem, StreakData, UserStats, DailyRoutineTask } from './types';
import { Header } from './components/Header';
import { DailyTasksView } from './components/DailyTasksView';
import { EveningReflectionModal } from './components/EveningReflectionModal';
import { FailureArchiveView } from './components/FailureArchiveView';
import { DataBackupModal, AppBackupPayload } from './components/DataBackupModal';
import {
  CheckCircle2,
  RotateCcw,
  Smartphone,
  X,
  Database,
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'archive'>('home');
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // Core application state with localStorage persistence
  const [tasks, setTasks] = useState<Task[]>(() => {
    const isClean = localStorage.getItem('turnover_v5_prod_clean');
    if (!isClean) {
      localStorage.setItem('turnover_v5_prod_clean', 'true');
      localStorage.removeItem('turnover_tasks');
      localStorage.removeItem('turnover_failures');
      localStorage.removeItem('turnover_stats');
      localStorage.removeItem('turnover_streak');
      localStorage.removeItem('turnover_daily_routines');
      return INITIAL_TASKS;
    }
    const saved = localStorage.getItem('turnover_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [failures, setFailures] = useState<FailureItem[]>(() => {
    const isClean = localStorage.getItem('turnover_v5_prod_clean');
    if (!isClean) return INITIAL_FAILURES;
    const saved = localStorage.getItem('turnover_failures');
    return saved ? JSON.parse(saved) : INITIAL_FAILURES;
  });

  const [streak, setStreak] = useState<StreakData>(() => {
    const isClean = localStorage.getItem('turnover_v5_prod_clean');
    if (!isClean) return INITIAL_STREAK;
    const saved = localStorage.getItem('turnover_streak');
    return saved ? JSON.parse(saved) : INITIAL_STREAK;
  });

  const [stats, setStats] = useState<UserStats>(() => {
    const isClean = localStorage.getItem('turnover_v5_prod_clean');
    if (!isClean) return INITIAL_USER_STATS;
    const saved = localStorage.getItem('turnover_stats');
    return saved ? JSON.parse(saved) : INITIAL_USER_STATS;
  });

  // Daily recurring habit tasks
  const [dailyRoutines, setDailyRoutines] = useState<DailyRoutineTask[]>(() => {
    const isClean = localStorage.getItem('turnover_v5_prod_clean');
    if (!isClean) return INITIAL_DAILY_ROUTINES;
    const saved = localStorage.getItem('turnover_daily_routines');
    if (saved) {
      try {
        const parsed: DailyRoutineTask[] = JSON.parse(saved);
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        return parsed.map(routine => {
          if (!routine.lastCompletedDate) {
            return { ...routine, completedToday: false, pointAwardedToday: false };
          }
          if (routine.lastCompletedDate === todayStr) {
            return { ...routine, completedToday: true };
          }
          if (routine.lastCompletedDate === yesterdayStr) {
            return { ...routine, completedToday: false, pointAwardedToday: false };
          }
          // Missed more than 1 day: streak reset
          return {
            ...routine,
            completedToday: false,
            pointAwardedToday: false,
            streakCount: 0,
          };
        });
      } catch {
        return INITIAL_DAILY_ROUTINES;
      }
    }
    return INITIAL_DAILY_ROUTINES;
  });

  useEffect(() => {
    localStorage.setItem('turnover_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('turnover_failures', JSON.stringify(failures));
  }, [failures]);

  useEffect(() => {
    localStorage.setItem('turnover_streak', JSON.stringify(streak));
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('turnover_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('turnover_daily_routines', JSON.stringify(dailyRoutines));
  }, [dailyRoutines]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle Daily Routine Task completion and award 0.5 points if streak >= 3
  const handleToggleDailyRoutine = (routineId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let pointsDelta = 0;
    let toastMsg = '';

    setDailyRoutines(prev =>
      prev.map(r => {
        if (r.id === routineId) {
          if (!r.completedToday) {
            // Completing for today
            let nextStreak = 1;
            if (r.lastCompletedDate === yesterdayStr || r.streakCount === 0) {
              nextStreak = (r.streakCount || 0) + 1;
            } else if (r.lastCompletedDate === todayStr) {
              nextStreak = r.streakCount;
            } else {
              nextStreak = 1;
            }

            const awardsPoint = nextStreak >= 3;
            if (awardsPoint) {
              pointsDelta = 0.5;
              toastMsg = `「${r.title}」${nextStreak}日連続達成！0.5ポイント獲得しました！`;
            } else {
              const remaining = 3 - nextStreak;
              toastMsg = `「${r.title}」を完了しました（現在${nextStreak}日連続。あと${remaining}日で毎回+0.5pt獲得！）`;
            }

            return {
              ...r,
              completedToday: true,
              streakCount: nextStreak,
              lastCompletedDate: todayStr,
              pointAwardedToday: awardsPoint,
            };
          } else {
            // Un-completing (undo)
            if (r.pointAwardedToday) {
              pointsDelta = -0.5;
              toastMsg = `「${r.title}」の完了を取り消しました（-0.5pt）`;
            } else {
              toastMsg = `「${r.title}」の完了を取り消しました`;
            }
            return {
              ...r,
              completedToday: false,
              streakCount: Math.max(0, (r.streakCount || 1) - 1),
              pointAwardedToday: false,
            };
          }
        }
        return r;
      })
    );

    if (pointsDelta !== 0) {
      setStats(prev => {
        const nextPts = Math.max(0, Number(((prev.improvementPoints || 0) + pointsDelta).toFixed(1)));
        return {
          ...prev,
          improvementPoints: nextPts,
        };
      });
    }

    if (toastMsg) {
      showToast(toastMsg);
    }
  };

  const handleAddDailyRoutine = (title: string, description?: string) => {
    const newRoutine: DailyRoutineTask = {
      id: 'routine_' + Date.now(),
      title: title.trim(),
      description: description?.trim(),
      streakCount: 0,
      completedToday: false,
      createdAt: new Date().toISOString(),
    };
    setDailyRoutines(prev => [newRoutine, ...prev]);
    showToast('新しいデイリータスクを登録しました（毎日継続3日以上で0.5pt獲得）');
  };

  const handleDeleteDailyRoutine = (routineId: string) => {
    setDailyRoutines(prev => prev.filter(r => r.id !== routineId));
    showToast('デイリータスクを削除しました');
  };

  const handleEditDailyRoutine = (routineId: string, title: string, description?: string) => {
    setDailyRoutines(prev =>
      prev.map(r =>
        r.id === routineId
          ? { ...r, title: title.trim(), description: description?.trim() }
          : r
      )
    );
    showToast('デイリータスクを更新しました');
  };

  // Toggle Task Completion and award improvement point
  const handleToggleTask = (taskId: string) => {
    let earnedPoint = false;
    let revokedPoint = false;

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          if (t.isImprovementAction) {
            if (nextCompleted) {
              earnedPoint = true;
            } else {
              revokedPoint = true;
            }
          }
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted
              ? new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
              : undefined,
          };
        }
        return t;
      })
    );

    if (earnedPoint) {
      setStats(prev => {
        const nextPts = (prev.improvementPoints || 0) + 1;
        showToast(`改善アクション達成！+1ポイント獲得（累計: ${nextPts}pt）`);
        return {
          ...prev,
          improvementPoints: nextPts,
          overcomeFailuresCount: prev.overcomeFailuresCount + 1,
        };
      });
    } else if (revokedPoint) {
      setStats(prev => ({
        ...prev,
        improvementPoints: Math.max(0, (prev.improvementPoints || 0) - 1),
        overcomeFailuresCount: Math.max(0, prev.overcomeFailuresCount - 1),
      }));
    }
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'completed'>) => {
    const created: Task = {
      ...newTask,
      id: 'task_' + Date.now(),
      completed: false,
    };
    setTasks(prev => [created, ...prev]);
    showToast('新しいタスクを追加しました');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast('タスクを削除しました');
  };

  const handleUpdateTaskNote = (taskId: string, note: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, userNote: note } : t))
    );
    showToast('ひとことメモを保存しました（夜のふりかえりに反映されます）');
  };

  // Mark Failure Overcome
  const handleMarkOvercome = (failureId: string, reflectionNote: string) => {
    setFailures(prev =>
      prev.map(f => {
        if (f.id === failureId) {
          return {
            ...f,
            status: 'overcome',
            overcomeDate: new Date().toISOString().split('T')[0],
            overcomeReflection: reflectionNote,
            praiseNote: '苦手と正面から向き合い、改善のアクションを完了しました！',
          };
        }
        return f;
      })
    );

    setStats(prev => ({
      ...prev,
      overcomeFailuresCount: prev.overcomeFailuresCount + 1,
      improvementPoints: (prev.improvementPoints || 0) + 1,
    }));

    showToast('克服ノートに記録しました！おめでとうございます (+1pt)');
  };

  // Complete Evening Reflection -> Advance to Next Day!
  const handleCompleteReflection = (data: {
    nextDayTasks: Task[];
    newFailures: FailureItem[];
    overcomeFailures: Array<{ failureId: string; note: string }>;
    rawJournalText: string;
  }) => {
    // 1. Advance Streak: Always increment streak by 1 upon completing reflection
    const newStreak = streak.currentStreak + 1;
    const newBest = Math.max(streak.bestStreak || 0, newStreak);

    // Update weekly history: complete the active day, and advance 'isToday' to the next day
    const currentIndex = streak.weeklyHistory.findIndex(d => d.isToday);
    const targetIdx = currentIndex !== -1 ? currentIndex : 0;
    const nextIdx = (targetIdx + 1) % streak.weeklyHistory.length;

    const updatedWeeklyHistory = streak.weeklyHistory.map((day, idx) => {
      if (idx === targetIdx) {
        return { ...day, completed: true, isToday: false };
      }
      if (idx === nextIdx) {
        return {
          ...day,
          completed: nextIdx === 0 ? false : day.completed,
          isToday: true,
        };
      }
      // If cycle restarted to 0, reset all other days
      if (nextIdx === 0) {
        return { ...day, completed: false, isToday: false };
      }
      return day;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedStreakData: StreakData = {
      currentStreak: newStreak,
      bestStreak: newBest,
      lastReflectionDate: todayStr,
      weeklyHistory: updatedWeeklyHistory,
    };
    setStreak(updatedStreakData);

    // 2. Advance Daily Routines to the next day:
    // If completed before reflection: streak is maintained, unchecked for new day.
    // If not completed: streak resets to 0, unchecked for new day.
    setDailyRoutines(prev =>
      prev.map(r => ({
        ...r,
        completedToday: false,
        pointAwardedToday: false,
        streakCount: r.completedToday ? r.streakCount : 0,
      }))
    );

    // 3. Replace tasks with confirmed next-day tasks (all unchecked)
    setTasks(data.nextDayTasks.map(t => ({ ...t, completed: false })));

    // 4. Update failures
    const existingFailures = [...failures];
    const toAdd = data.newFailures.filter(
      nf => !existingFailures.some(ef => ef.failure === nf.failure)
    );
    let updatedFailures = [...toAdd, ...existingFailures];

    data.overcomeFailures.forEach(ov => {
      updatedFailures = updatedFailures.map(f => {
        if (f.id === ov.failureId) {
          return {
            ...f,
            status: 'overcome',
            overcomeDate: new Date().toISOString().split('T')[0],
            overcomeReflection: ov.note,
          };
        }
        return f;
      });
    });
    setFailures(updatedFailures);

    // 5. Update user stats
    setStats(prev => ({
      ...prev,
      currentStreak: newStreak,
      overcomeFailuresCount: prev.overcomeFailuresCount + data.overcomeFailures.length,
      totalLoggedFailures: prev.totalLoggedFailures + toAdd.length,
    }));

    showToast(`ふりかえり完了！次の日に進みました（継続 ${newStreak}日目）。明日のタスクを準備しました！`);
    setCurrentView('home');
  };

  // Direct Next-Day manual progression
  const handleAdvanceToNextDay = () => {
    if (confirm('夜のふりかえりを完了し、次の日に進みますか？\n（未完了のデイリー習慣はリセットされ、新しい1日が始まります）')) {
      handleCompleteReflection({
        nextDayTasks: tasks.filter(t => !t.completed).map(t => ({ ...t, completed: false })),
        newFailures: [],
        overcomeFailures: [],
        rawJournalText: '翌日に進む',
      });
    }
  };

  // Import Backup Data String
  const handleImportData = (importedData: AppBackupPayload['data']) => {
    if (importedData.tasks) setTasks(importedData.tasks);
    if (importedData.dailyRoutines) setDailyRoutines(importedData.dailyRoutines);
    if (importedData.failures) setFailures(importedData.failures);
    if (importedData.streak) setStreak(importedData.streak);
    if (importedData.stats) setStats(importedData.stats);
    showToast('データを正常にインポートしました！');
  };

  const handleResetData = () => {
    if (confirm('登録したタスク、ストリーク、つまずき記録、デイリータスクを初期化（白紙に戻す）しますか？')) {
      localStorage.clear();
      localStorage.setItem('turnover_v4_clean', 'true');
      setTasks([]);
      setFailures([]);
      setStreak(INITIAL_STREAK);
      setStats(INITIAL_USER_STATS);
      setDailyRoutines(INITIAL_DAILY_ROUTINES);
      showToast('データを初期化しました');
    }
  };

  const handleAddFailure = (newFailure: Omit<FailureItem, 'id' | 'date' | 'status'>) => {
    const item: FailureItem = {
      ...newFailure,
      id: 'f_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      status: 'unresolved',
    };
    setFailures(prev => [item, ...prev]);
    showToast('新しいつまずきを記録しました');
  };

  // Render Inner Content
  const renderAppContent = () => (
    <>
      {/* Clean Single-Bar Top Header */}
      <Header
        currentView={currentView}
        onNavigateHome={() => setCurrentView('home')}
        onNavigateArchive={() => setCurrentView('archive')}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        isMobilePreview={isMobilePreview}
        setIsMobilePreview={setIsMobilePreview}
      />

      {/* Main View Area */}
      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-12">
        {currentView === 'home' && (
          <DailyTasksView
            tasks={tasks}
            dailyRoutines={dailyRoutines}
            streak={streak}
            stats={stats}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTaskNote={handleUpdateTaskNote}
            onStartReflection={() => setIsReflectionModalOpen(true)}
            onNavigateToArchive={() => setCurrentView('archive')}
            onToggleDailyRoutine={handleToggleDailyRoutine}
            onAddDailyRoutine={handleAddDailyRoutine}
            onDeleteDailyRoutine={handleDeleteDailyRoutine}
            onEditDailyRoutine={handleEditDailyRoutine}
            onAdvanceToNextDay={handleAdvanceToNextDay}
          />
        )}

        {currentView === 'archive' && (
          <FailureArchiveView
            failures={failures}
            onMarkOvercome={handleMarkOvercome}
            onAddFailure={handleAddFailure}
            onBackToHome={() => setCurrentView('home')}
          />
        )}
      </main>

      {/* Accessible Footer conforming to DADS guidelines */}
      <footer className="border-t border-[#d1d5db] bg-white py-5 text-center text-xs text-[#454545]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-medium">
            TurnOver - 失敗を明日の行動に変える学習改善ノート
          </span>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="flex items-center gap-1.5 text-[#005bab] hover:underline cursor-pointer min-h-[36px] px-2 font-semibold"
              aria-label="データ文字列の保存・インポート"
            >
              <Database className="w-3.5 h-3.5" aria-hidden="true" />
              <span>データ保存・インポート</span>
            </button>
            <span className="text-[#d1d5db]" aria-hidden="true">|</span>
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 text-[#454545] hover:text-[#1a1a1a] hover:underline cursor-pointer min-h-[36px] px-2"
              aria-label="保存された学習データを初期化する"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>初期化（白紙に戻す）</span>
            </button>
          </div>
        </div>
      </footer>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] flex flex-col font-sans">
      {/* DADS Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#005bab] focus:text-white focus:font-bold focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        本文へスキップ
      </a>

      {/* Toast Notification conforming to DADS Notification Banner Guidelines */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-[#1a1a1a] text-white text-xs sm:text-sm px-4 py-3 rounded-md shadow-xl flex items-center gap-3 border border-[#454545] max-w-md animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2 className="w-5 h-5 text-[#86efac] shrink-0" aria-hidden="true" />
          <span className="flex-1 font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/70 hover:text-white p-1 rounded cursor-pointer"
            aria-label="通知を閉じる"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Responsive View Mode */}
      {isMobilePreview ? (
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 bg-[#e5e7eb]">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-[#1a1a1a] bg-white px-3 py-1.5 rounded-md shadow-xs inline-flex items-center gap-1.5 border border-[#d1d5db]">
              <Smartphone className="w-4 h-4 text-[#005bab]" aria-hidden="true" />
              <span>スマホ実機プレビュー表示（幅390px）</span>
            </span>
          </div>

          {/* Smartphone Frame Container */}
          <div className="w-[390px] h-[844px] bg-[#f8f9fa] border-8 border-[#1a1a1a] rounded-[36px] shadow-2xl overflow-hidden flex flex-col relative">
            <div className="flex-1 overflow-y-auto flex flex-col">
              {renderAppContent()}
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
          {renderAppContent()}
        </div>
      )}

      {/* Evening Reflection Modal */}
      <EveningReflectionModal
        isOpen={isReflectionModalOpen}
        onClose={() => setIsReflectionModalOpen(false)}
        tasks={tasks}
        streak={streak}
        unresolvedFailures={failures.filter(f => f.status !== 'overcome')}
        onCompleteReflection={handleCompleteReflection}
      />

      {/* Data Backup & Import Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        tasks={tasks}
        dailyRoutines={dailyRoutines}
        failures={failures}
        streak={streak}
        stats={stats}
        onImportData={handleImportData}
      />
    </div>
  );
}
