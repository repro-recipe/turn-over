import React, { useState } from 'react';
import { Task, StreakData, UserStats, DailyRoutineTask } from '../types';
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Trash2,
  Moon,
  MessageSquareQuote,
  Edit3,
  Sparkles,
  Award,
  CheckSquare,
  Flame,
  Check,
  ArrowRight,
  Repeat,
  PenLine,
  X,
} from 'lucide-react';

interface DailyTasksViewProps {
  tasks: Task[];
  dailyRoutines: DailyRoutineTask[];
  streak: StreakData;
  stats: UserStats;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskNote: (taskId: string, note: string) => void;
  onStartReflection: () => void;
  onNavigateToArchive: () => void;
  onToggleDailyRoutine: (routineId: string) => void;
  onAddDailyRoutine: (title: string, description?: string) => void;
  onDeleteDailyRoutine: (routineId: string) => void;
  onEditDailyRoutine?: (routineId: string, title: string, description?: string) => void;
  onAdvanceToNextDay?: () => void;
}

const ROUTINE_SUGGESTIONS = [
  { title: '英単語・用語の暗記（10分）', desc: '朝やスキマ時間に単語帳を見返す' },
  { title: '教科書・参考書の音読（15分）', desc: '声に出して重要語句を定着させる' },
  { title: '計算ドリル・基礎問（10分）', desc: '毎日継続して計算の精度と速度を保つ' },
  { title: '明日の学習計画・準備（5分）', desc: '就寝前に翌日の予定と持ち物を確認' },
];

const TASK_SUGGESTIONS = [
  { title: '数学のワーク 3ページ解く', minutes: 30 },
  { title: '英語の長文読解・文法 1問', minutes: 25 },
  { title: '理科・社会の要点まとめ', minutes: 20 },
];

export const DailyTasksView: React.FC<DailyTasksViewProps> = ({
  tasks,
  dailyRoutines,
  streak,
  stats,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateTaskNote,
  onStartReflection,
  onNavigateToArchive,
  onToggleDailyRoutine,
  onAddDailyRoutine,
  onDeleteDailyRoutine,
  onEditDailyRoutine,
  onAdvanceToNextDay,
}) => {
  const [filter, setFilter] = useState<'all' | 'improvements' | 'completed'>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMinutes, setNewMinutes] = useState(25);
  const [isImprovement, setIsImprovement] = useState(false);
  const [targetFailure, setTargetFailure] = useState('');

  // Daily Routine creation and edit state
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDesc, setRoutineDesc] = useState('');

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editRoutineTitle, setEditRoutineTitle] = useState('');
  const [editRoutineDesc, setEditRoutineDesc] = useState('');

  const [editingNoteTaskId, setEditingNoteTaskId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  const completedCount = tasks.filter(t => t.completed).length;
  const improvementTasks = tasks.filter(t => t.isImprovementAction);
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const completedRoutinesCount = dailyRoutines.filter(r => r.completedToday).length;

  const filteredTasks = tasks.filter(task => {
    if (filter === 'improvements') return task.isImprovementAction;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      isImprovementAction: isImprovement,
      targetFailureDescription: isImprovement && targetFailure.trim() ? targetFailure.trim() : undefined,
      estimatedMinutes: Number(newMinutes) || 25,
      category: isImprovement ? '改善アクション' : '今日の学習',
      priority: isImprovement ? 'high' : 'medium',
    });

    setNewTitle('');
    setNewDesc('');
    setNewMinutes(25);
    setIsImprovement(false);
    setTargetFailure('');
    setIsAddingTask(false);
  };

  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitle.trim()) return;

    onAddDailyRoutine(routineTitle.trim(), routineDesc.trim());
    setRoutineTitle('');
    setRoutineDesc('');
    setIsAddingRoutine(false);
  };

  const handleStartEditRoutine = (routine: DailyRoutineTask) => {
    setEditingRoutineId(routine.id);
    setEditRoutineTitle(routine.title);
    setEditRoutineDesc(routine.description || '');
  };

  const handleSaveEditRoutine = (routineId: string) => {
    if (!editRoutineTitle.trim()) return;
    if (onEditDailyRoutine) {
      onEditDailyRoutine(routineId, editRoutineTitle.trim(), editRoutineDesc.trim());
    }
    setEditingRoutineId(null);
  };

  const handleSaveNote = (taskId: string) => {
    onUpdateTaskNote(taskId, tempNote.trim());
    setEditingNoteTaskId(null);
    setTempNote('');
  };

  const formattedPoints = Number.isInteger(stats.improvementPoints || 0)
    ? (stats.improvementPoints || 0).toString()
    : (stats.improvementPoints || 0).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Home Navigation Hub: 2 Clear Cards for Evening Reflection and Improvement Points */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="学習ナビゲーション">
        {/* Card 1: 夜のふりかえり */}
        <div className="bg-white border border-[#d1d5db] rounded-lg p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                <Flame className="w-3.5 h-3.5 fill-[#b45309] text-[#b45309]" aria-hidden="true" />
                <span className="tabular-nums font-mono">{streak.currentStreak}</span>
                <span>日連続</span>
                {streak.bestStreak > 0 && (
                  <span className="text-[#92400e] text-[11px] font-normal ml-0.5">
                    (最高: {streak.bestStreak}日)
                  </span>
                )}
              </span>
              <span className="text-xs text-[#454545] font-medium">
                {streak.weeklyHistory.filter(d => d.completed).length} / 7日達成
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#1a1a1a] flex items-center gap-2">
              <Moon className="w-5 h-5 text-[#005bab]" aria-hidden="true" />
              <span>夜のふりかえりノート</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#454545] mt-1 leading-relaxed">
              今日できたことやつまずきを記録すると、AIが原因を分析して翌日の改善タスクを自動生成します。
            </p>

            {/* Weekly stamps */}
            <div className="grid grid-cols-7 gap-1.5 mt-3 pt-3 border-t border-[#e5e7eb]">
              {streak.weeklyHistory.map((day, idx) => (
                <div
                  key={idx}
                  className={`py-1.5 px-0.5 rounded text-center border transition-all ${
                    day.completed
                      ? 'bg-[#edf7ee] border-[#86efac] text-[#007934]'
                      : day.isToday
                      ? 'bg-white border-2 border-[#005bab] text-[#005bab] shadow-xs'
                      : 'bg-[#fafafa] border-[#e5e7eb] text-[#6b7280]'
                  }`}
                >
                  <span className="text-[11px] font-bold block">{day.dayName}</span>
                  <div className="w-4 h-4 mx-auto flex items-center justify-center my-0.5">
                    {day.completed ? (
                      <Check className="w-3.5 h-3.5 text-[#007934] stroke-[3]" aria-hidden="true" />
                    ) : day.isToday ? (
                      <Flame className="w-3.5 h-3.5 text-[#b45309] fill-[#b45309]" aria-hidden="true" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e5e7eb] flex flex-col gap-2">
            <button
              onClick={onStartReflection}
              className="dads-btn-primary w-full min-h-[44px] text-sm flex items-center justify-center gap-2"
              aria-label="夜のふりかえりノートを始める"
            >
              <Moon className="w-4 h-4 text-white" aria-hidden="true" />
              <span>夜のふりかえりを始める（翌日へ）</span>
            </button>

            {onAdvanceToNextDay && (
              <button
                type="button"
                onClick={onAdvanceToNextDay}
                className="text-xs text-[#454545] hover:text-[#005bab] hover:underline text-center cursor-pointer min-h-[28px] py-1 transition-colors flex items-center justify-center gap-1"
                title="ふりかえりを書かずに直接次の日に進みます"
              >
                <span>ふりかえりをスキップして次の日に進む</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: 改善ポイント（克服ノート） */}
        <div className="bg-white border border-[#d1d5db] rounded-lg p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded bg-[#eff6ff] text-[#005bab] border border-[#bfdbfe]">
                <Sparkles className="w-3.5 h-3.5 text-[#005bab]" aria-hidden="true" />
                <span>改善ステータス</span>
              </span>
              <span className="text-xs text-[#454545] font-medium">
                克服済み {stats.overcomeFailuresCount} 件
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#1a1a1a] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#005bab]" aria-hidden="true" />
              <span>改善ポイント・克服ノート</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#454545] mt-1 leading-relaxed">
              つまずき克服で+1pt、デイリータスクを3日以上継続すると達成ごとに+0.5pt獲得できます。
            </p>

            <div className="mt-4 pt-3 border-t border-[#e5e7eb] flex items-center gap-4 bg-[#fafafa] p-3 rounded-md border border-[#e5e7eb]">
              <div className="flex-1">
                <span className="text-xs text-[#454545] block font-medium">累計獲得ポイント</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#005bab] tabular-nums font-mono">
                    {formattedPoints}
                  </span>
                  <span className="text-sm font-bold text-[#005bab]">pt</span>
                </div>
              </div>
              <div className="border-l border-[#d1d5db] pl-4">
                <span className="text-xs text-[#454545] block font-medium">解決した課題</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-bold text-[#007934] tabular-nums font-mono">
                    {stats.overcomeFailuresCount}
                  </span>
                  <span className="text-xs text-[#454545] font-medium">件克服</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e5e7eb]">
            <button
              onClick={onNavigateToArchive}
              className="dads-btn-secondary w-full min-h-[44px] text-sm flex items-center justify-center gap-2"
              aria-label="改善ポイントと克服ノートを開く"
            >
              <span>改善ポイント・克服ノートを見る</span>
              <ArrowRight className="w-4 h-4 text-[#005bab]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 毎日の習慣（デイリータスク）Section */}
      <section className="bg-white border border-[#d1d5db] rounded-lg p-5 sm:p-6 shadow-xs space-y-4" aria-labelledby="daily-routine-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5e7eb]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded bg-[#eff6ff] text-[#005bab] border border-[#bfdbfe]">
                <Repeat className="w-3.5 h-3.5 text-[#005bab]" aria-hidden="true" />
                <span>毎日行う習慣</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#b45309] bg-[#fffbeb] border border-[#fde68a] px-2 py-0.5 rounded">
                <Flame className="w-3 h-3 fill-[#b45309]" aria-hidden="true" />
                <span>3日連続達成で毎回 +0.5pt</span>
              </span>
            </div>
            <h2 id="daily-routine-heading" className="text-lg sm:text-xl font-bold text-[#1a1a1a] mt-1">
              デイリータスク（毎日の習慣）
            </h2>
            <p className="text-xs sm:text-sm text-[#454545] mt-0.5">
              毎日継続して3日以上行うことで、1回達成ごとに0.5ポイント手に入ります。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            {dailyRoutines.length > 0 && (
              <span className="text-xs text-[#454545] font-medium hidden sm:inline">
                本日: <strong className="text-[#1a1a1a] tabular-nums font-mono">{completedRoutinesCount} / {dailyRoutines.length}</strong> 完了
              </span>
            )}
            <button
              onClick={() => setIsAddingRoutine(true)}
              className="dads-btn-secondary min-h-[44px] text-sm shrink-0"
              aria-label="新しいデイリータスクを追加する"
            >
              <Plus className="w-4 h-4 text-[#005bab]" aria-hidden="true" />
              <span>デイリータスクを追加</span>
            </button>
          </div>
        </div>

        {/* Inline Add Daily Routine Form */}
        {isAddingRoutine && (
          <form
            onSubmit={handleCreateRoutine}
            className="bg-[#fafafa] border-2 border-[#005bab] rounded-lg p-4 sm:p-5 space-y-3.5 animate-in fade-in"
            aria-labelledby="add-routine-heading"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb]">
              <h3 id="add-routine-heading" className="text-sm sm:text-base font-bold text-[#1a1a1a]">
                新しいデイリー習慣を登録
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingRoutine(false)}
                className="text-xs text-[#454545] hover:text-[#1a1a1a] cursor-pointer min-h-[36px] px-2"
              >
                閉じる
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div>
              <span className="text-xs font-semibold text-[#454545] block mb-1.5">
                よく使われる習慣例（タップで入力）：
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ROUTINE_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setRoutineTitle(sug.title);
                      setRoutineDesc(sug.desc);
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-white hover:bg-[#eff6ff] hover:text-[#005bab] border border-[#d1d5db] transition-colors cursor-pointer text-[#1a1a1a]"
                  >
                    + {sug.title}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="routine-title-input" className="text-xs sm:text-sm font-bold text-[#1a1a1a]">
                  習慣タスク名
                </label>
                <span className="dads-badge-required">必須</span>
              </div>
              <input
                id="routine-title-input"
                type="text"
                placeholder="例: 英単語の暗記 10分、教科書の音読、寝る前の準備"
                value={routineTitle}
                onChange={e => setRoutineTitle(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 border border-[#9ca3af] rounded-md text-sm text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none"
                required
                aria-required="true"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="routine-desc-input" className="text-xs sm:text-sm font-bold text-[#1a1a1a]">
                  習慣化のコツ・メモ
                </label>
                <span className="dads-badge-optional">任意</span>
              </div>
              <input
                id="routine-desc-input"
                type="text"
                placeholder="例: 朝起きてすぐに机に向かう、寝る前にスマホを見ない"
                value={routineDesc}
                onChange={e => setRoutineDesc(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 border border-[#9ca3af] rounded-md text-sm text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingRoutine(false)}
                className="dads-btn-tertiary min-h-[40px] text-xs sm:text-sm"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="dads-btn-primary min-h-[40px] text-xs sm:text-sm"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>デイリー習慣を保存</span>
              </button>
            </div>
          </form>
        )}

        {/* Daily Routines List */}
        {dailyRoutines.length === 0 ? (
          <div className="text-center py-7 px-5 bg-[#fafafa] border border-dashed border-[#d1d5db] rounded-lg space-y-3">
            <div className="w-12 h-12 rounded-full bg-white border border-[#d1d5db] flex items-center justify-center mx-auto text-[#005bab]">
              <Repeat className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1a1a1a]">
                登録されたデイリータスクはまだありません
              </h3>
              <p className="text-xs text-[#454545] mt-1 max-w-md mx-auto leading-relaxed">
                英単語や計算練習など、毎日行いたい学習習慣を登録しましょう。継続して3日以上達成すると毎回0.5pt獲得できます！
              </p>
            </div>

            {/* Quick Add Suggestions */}
            <div className="pt-2 max-w-lg mx-auto">
              <span className="text-xs font-semibold text-[#454545] block mb-2">
                ワンタップですぐに登録できる習慣の例：
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {ROUTINE_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => onAddDailyRoutine(sug.title, sug.desc)}
                    className="p-2.5 rounded-md bg-white border border-[#d1d5db] hover:border-[#005bab] hover:bg-[#eff6ff] transition-all text-left cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-[#1a1a1a] group-hover:text-[#005bab] block">
                      + {sug.title}
                    </span>
                    <span className="text-[11px] text-[#6b7280] block mt-0.5 line-clamp-1">
                      {sug.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsAddingRoutine(true)}
                className="dads-btn-primary min-h-[44px] text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>自分でデイリータスクを登録する</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dailyRoutines.map(routine => {
              const isOverThree = routine.streakCount >= 3;
              const isTwo = routine.streakCount === 2;
              const isEditingThis = editingRoutineId === routine.id;

              if (isEditingThis) {
                return (
                  <div key={routine.id} className="border-2 border-[#005bab] bg-white rounded-lg p-3.5 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#005bab]">デイリータスクを編集</span>
                      <button
                        onClick={() => setEditingRoutineId(null)}
                        className="text-xs text-[#6b7280] hover:text-[#1a1a1a]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editRoutineTitle}
                      onChange={e => setEditRoutineTitle(e.target.value)}
                      placeholder="習慣タスク名"
                      className="w-full text-sm min-h-[38px] px-2.5 border border-[#9ca3af] rounded-md"
                    />
                    <input
                      type="text"
                      value={editRoutineDesc}
                      onChange={e => setEditRoutineDesc(e.target.value)}
                      placeholder="メモ（任意）"
                      className="w-full text-xs min-h-[34px] px-2.5 border border-[#d1d5db] rounded-md"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingRoutineId(null)}
                        className="dads-btn-tertiary min-h-[32px] py-1 px-2.5 text-xs"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditRoutine(routine.id)}
                        className="dads-btn-primary min-h-[32px] py-1 px-3 text-xs"
                      >
                        更新
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={routine.id}
                  className={`border rounded-lg p-3.5 transition-all flex items-start justify-between gap-3 shadow-2xs ${
                    routine.completedToday
                      ? 'bg-[#f7faf7] border-[#86efac]'
                      : 'bg-white border-[#d1d5db] hover:border-[#9ca3af]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Checkbox button */}
                    <button
                      onClick={() => onToggleDailyRoutine(routine.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-md cursor-pointer shrink-0 -ml-1 -mt-1 text-[#454545] hover:text-[#005bab] transition-colors focus:outline-none focus:ring-2 focus:ring-[#005bab]"
                      aria-label={
                        routine.completedToday
                          ? `デイリー習慣「${routine.title}」を未完了に戻す`
                          : `デイリー習慣「${routine.title}」を完了にする`
                      }
                    >
                      {routine.completedToday ? (
                        <CheckCircle2 className="w-7 h-7 text-[#007934] fill-[#edf7ee]" aria-hidden="true" />
                      ) : (
                        <Circle className="w-7 h-7 text-[#9ca3af] hover:text-[#005bab]" aria-hidden="true" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      {/* Streak Badges according to rule: 3+ days awards 0.5pt */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {isOverThree ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b45309] bg-[#fffbeb] border border-[#fde68a] px-2 py-0.5 rounded">
                            <Flame className="w-3 h-3 fill-[#b45309]" aria-hidden="true" />
                            <span>{routine.streakCount}日連続達成中（+0.5pt対象）</span>
                          </span>
                        ) : isTwo ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005bab] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-0.5 rounded">
                            <span>2日連続（あと1日で+0.5pt！）</span>
                          </span>
                        ) : routine.streakCount === 1 ? (
                          <span className="text-[11px] font-semibold text-[#454545] bg-[#f3f4f6] border border-[#d1d5db] px-2 py-0.5 rounded">
                            1日目（継続中）
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#6b7280] bg-[#fafafa] border border-[#e5e7eb] px-2 py-0.5 rounded">
                            3日連続で+0.5pt
                          </span>
                        )}

                        {routine.completedToday && (
                          <span className="text-[11px] font-bold text-[#007934] bg-[#edf7ee] border border-[#86efac] px-1.5 py-0.5 rounded">
                            本日完了
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-bold leading-snug truncate ${
                          routine.completedToday ? 'text-[#6b7280] line-through' : 'text-[#1a1a1a]'
                        }`}
                      >
                        {routine.title}
                      </h3>

                      {routine.description && (
                        <p className="text-xs text-[#454545] mt-0.5 line-clamp-2">
                          {routine.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleStartEditRoutine(routine)}
                      className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:text-[#005bab] transition-colors cursor-pointer rounded-md"
                      aria-label={`デイリータスク「${routine.title}」を編集`}
                    >
                      <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onDeleteDailyRoutine(routine.id)}
                      className="w-8 h-8 flex items-center justify-center text-[#9ca3af] hover:text-[#c9171e] transition-colors cursor-pointer rounded-md"
                      aria-label={`デイリータスク「${routine.title}」を削除`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Section: 今日やること（タスク実行） */}
      <section className="bg-white border border-[#d1d5db] rounded-lg p-5 sm:p-6 shadow-xs space-y-5" aria-labelledby="tasks-heading">
        {/* Header & Progress Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e7eb]">
          <div className="flex-1 min-w-0">
            <h1 id="tasks-heading" className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
              今日やること（アクション実行）
            </h1>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-[#454545] mt-1">
              <span>
                進捗: <strong className="text-[#1a1a1a] tabular-nums font-mono">{completedCount} / {tasks.length} 件 達成</strong> ({progressPercent}%)
              </span>
            </div>

            {/* DADS Progress Bar */}
            <div className="w-full bg-[#e5e7eb] rounded-full h-2.5 overflow-hidden mt-2.5">
              <div
                className="bg-[#007934] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          <button
            onClick={() => setIsAddingTask(true)}
            className="dads-btn-primary min-h-[44px] text-sm shrink-0 self-start sm:self-auto"
            aria-label="新しいタスクを追加する"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>タスクを追加</span>
          </button>
        </div>

        {/* Filter Tabs conforming to DADS Segmented Button Pattern */}
        <div className="flex items-center border-b border-[#d1d5db] pb-3 gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="タスクフィルター">
          <button
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-md cursor-pointer whitespace-nowrap transition-colors border ${
              filter === 'all'
                ? 'bg-[#005bab] text-white border-[#005bab]'
                : 'bg-white text-[#454545] border-[#d1d5db] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]'
            }`}
          >
            すべて ({tasks.length})
          </button>
          <button
            role="tab"
            aria-selected={filter === 'improvements'}
            onClick={() => setFilter('improvements')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-md cursor-pointer whitespace-nowrap transition-colors border inline-flex items-center gap-1.5 ${
              filter === 'improvements'
                ? 'bg-[#005bab] text-white border-[#005bab]'
                : 'bg-white text-[#454545] border-[#d1d5db] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>改善タスク ({improvementTasks.length})</span>
          </button>
          <button
            role="tab"
            aria-selected={filter === 'completed'}
            onClick={() => setFilter('completed')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-md cursor-pointer whitespace-nowrap transition-colors border ${
              filter === 'completed'
                ? 'bg-[#005bab] text-white border-[#005bab]'
                : 'bg-white text-[#454545] border-[#d1d5db] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]'
            }`}
          >
            完了済み ({completedCount})
          </button>
        </div>

        {/* Add Task Inline Form */}
        {isAddingTask && (
          <form
            onSubmit={handleCreateTask}
            className="bg-white border-2 border-[#005bab] rounded-lg p-5 space-y-4 shadow-sm"
            aria-labelledby="add-task-heading"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
              <h3 id="add-task-heading" className="text-base font-bold text-[#1a1a1a]">
                新しいタスクを追加
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="text-xs text-[#454545] hover:text-[#1a1a1a] cursor-pointer min-h-[36px] px-2 py-1"
              >
                閉じる
              </button>
            </div>

            {/* Quick suggestions for tasks */}
            <div>
              <span className="text-xs font-semibold text-[#454545] block mb-1.5">
                よくある学習タスク例：
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TASK_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNewTitle(sug.title);
                      setNewMinutes(sug.minutes);
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-[#f3f4f6] hover:bg-[#eff6ff] hover:text-[#005bab] border border-[#d1d5db] transition-colors cursor-pointer text-[#1a1a1a]"
                  >
                    + {sug.title} ({sug.minutes}分)
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label htmlFor="task-title-input" className="text-sm font-bold text-[#1a1a1a]">
                  タスク名
                </label>
                <span className="dads-badge-required">必須</span>
              </div>
              <input
                id="task-title-input"
                type="text"
                placeholder="例: 数学のワーク p.30〜32 を解く"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 border border-[#9ca3af] rounded-md text-base text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none"
                required
                aria-required="true"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label htmlFor="task-desc-input" className="text-sm font-bold text-[#1a1a1a]">
                  スモールステップ・メモ
                </label>
                <span className="dads-badge-optional">任意</span>
              </div>
              <input
                id="task-desc-input"
                type="text"
                placeholder="例: 公式を確かめながら解く、途中式を省かない"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 border border-[#9ca3af] rounded-md text-base text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:w-auto">
                <div className="flex items-center gap-2 mb-1.5">
                  <label htmlFor="task-minutes-input" className="text-sm font-bold text-[#1a1a1a]">
                    めやす所要時間（分）
                  </label>
                  <span className="dads-badge-optional">任意</span>
                </div>
                <input
                  id="task-minutes-input"
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={newMinutes}
                  onChange={e => setNewMinutes(Number(e.target.value))}
                  className="w-full sm:w-32 min-h-[44px] px-3.5 py-2.5 border border-[#9ca3af] rounded-md text-base text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none"
                />
              </div>

              <div className="pt-0 sm:pt-6">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-[#1a1a1a] cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={isImprovement}
                    onChange={e => setIsImprovement(e.target.checked)}
                    className="w-5 h-5 rounded border-[#9ca3af] text-[#005bab] focus:ring-0 cursor-pointer"
                  />
                  <span>つまずき改善タスクにする（達成で +1pt）</span>
                </label>
              </div>
            </div>

            {isImprovement && (
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-md p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <label htmlFor="target-failure-input" className="text-sm font-bold text-[#005bab]">
                    克服したい課題・前回のつまずき
                  </label>
                  <span className="dads-badge-optional">任意</span>
                </div>
                <input
                  id="target-failure-input"
                  type="text"
                  placeholder="例: 途中式で符号の計算ミスをした"
                  value={targetFailure}
                  onChange={e => setTargetFailure(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 border border-[#9ca3af] rounded-md text-base text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#e5e7eb]">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="dads-btn-tertiary min-h-[44px]"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="dads-btn-primary min-h-[44px]"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>タスクを追加する</span>
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        <div className="space-y-3" aria-label="タスク一覧">
          {filteredTasks.length === 0 ? (
            <div className="bg-[#fafafa] border border-[#d1d5db] rounded-lg p-8 sm:p-10 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-white border border-[#d1d5db] flex items-center justify-center mx-auto text-[#454545]">
                <CheckSquare className="w-6 h-6 text-[#1a1a1a]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1a1a1a]">
                  {filter === 'all'
                    ? '本日のタスクはまだ登録されていません'
                    : filter === 'improvements'
                    ? '改善タスクはまだありません'
                    : '完了したタスクはまだありません'}
                </h3>
                <p className="text-xs sm:text-sm text-[#454545] mt-1.5 leading-relaxed">
                  {filter === 'all'
                    ? '「タスクを追加」から今日やることを登録するか、上の「夜のふりかえり」を行うとAIがつまずきを分析して明日の改善タスクを自動提案します。'
                    : '該当するタスクはありません。'}
                </p>
              </div>

              {/* Quick suggestions when totally empty */}
              {filter === 'all' && (
                <div className="pt-2 text-left bg-white p-3.5 rounded-md border border-[#e5e7eb] max-w-sm mx-auto">
                  <span className="text-xs font-semibold text-[#454545] block mb-2">
                    ワンタップですぐに本日の学習を追加：
                  </span>
                  <div className="space-y-1.5">
                    {TASK_SUGGESTIONS.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          onAddTask({
                            title: sug.title,
                            description: '本日の学習タスク',
                            isImprovementAction: false,
                            estimatedMinutes: sug.minutes,
                            category: '今日の学習',
                            priority: 'medium',
                          })
                        }
                        className="w-full text-xs p-2 rounded bg-[#f8f9fa] hover:bg-[#eff6ff] hover:text-[#005bab] border border-[#d1d5db] transition-colors cursor-pointer text-left flex items-center justify-between"
                      >
                        <span className="font-medium">+ {sug.title}</span>
                        <span className="text-[11px] text-[#6b7280]">{sug.minutes}分</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filter === 'all' && (
                <div className="pt-1">
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="dads-btn-primary min-h-[44px] text-sm"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>タスクを直接入力して追加</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredTasks.map(task => {
              const isEditingNote = editingNoteTaskId === task.id;

              return (
                <article
                  key={task.id}
                  className={`bg-white border rounded-md p-4 sm:p-5 transition-all shadow-xs ${
                    task.completed
                      ? 'border-[#e5e7eb] bg-[#fafafa] text-[#6b7280]'
                      : 'border-[#d1d5db] hover:border-[#9ca3af]'
                  }`}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Checkbox button */}
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="w-11 h-11 flex items-center justify-center rounded-md cursor-pointer shrink-0 -ml-1 -mt-1 text-[#454545] hover:text-[#005bab] transition-colors focus:outline-none focus:ring-2 focus:ring-[#005bab]"
                      aria-label={task.completed ? `${task.title} を未完了に戻す` : `${task.title} を完了にする`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#007934] fill-[#edf7ee]" aria-hidden="true" />
                      ) : (
                        <Circle className="w-7 h-7 sm:w-8 sm:h-8 text-[#9ca3af] hover:text-[#005bab]" aria-hidden="true" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#454545] mb-1.5">
                        {task.isImprovementAction ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[#005bab] bg-[#eff6ff] border border-[#bfdbfe] px-2.5 py-0.5 rounded text-xs">
                            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>改善アクション (+1pt)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center font-semibold text-[#1a1a1a] bg-[#f3f4f6] border border-[#d1d5db] px-2.5 py-0.5 rounded text-xs">
                            {task.category}
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-[#454545] tabular-nums font-mono font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#6b7280]" aria-hidden="true" />
                          {task.estimatedMinutes}分
                        </span>

                        {task.completed && (
                          <span className="font-bold text-[#007934] bg-[#edf7ee] border border-[#86efac] px-2 py-0.5 rounded text-xs">
                            完了済み
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-base sm:text-lg font-bold leading-snug ${
                          task.completed ? 'text-[#6b7280] line-through' : 'text-[#1a1a1a]'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-xs sm:text-sm text-[#454545] mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {task.isImprovementAction && task.targetFailureDescription && (
                        <div className="mt-2.5 p-3 bg-[#fafafa] border border-[#e5e7eb] rounded-md text-xs sm:text-sm text-[#1a1a1a] space-y-1">
                          <span className="font-bold block text-xs text-[#454545]">
                            克服したい課題:
                          </span>
                          <p className="text-[#1a1a1a] font-medium">{task.targetFailureDescription}</p>
                        </div>
                      )}

                      {/* Daytime Note Section */}
                      <div className="mt-3.5 pt-3 border-t border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3">
                        {task.userNote ? (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#1a1a1a] bg-[#fafafa] px-3 py-1.5 rounded-md border border-[#d1d5db]">
                            <MessageSquareQuote className="w-4 h-4 text-[#005bab] shrink-0" aria-hidden="true" />
                            <span>メモ: {task.userNote}</span>
                            <button
                              onClick={() => {
                                setEditingNoteTaskId(task.id);
                                setTempNote(task.userNote || '');
                              }}
                              className="text-[#005bab] hover:underline font-bold text-xs ml-2 cursor-pointer min-h-[32px] px-1"
                            >
                              修正
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNoteTaskId(task.id);
                              setTempNote('');
                            }}
                            className="text-xs sm:text-sm text-[#454545] hover:text-[#005bab] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                          >
                            <Edit3 className="w-4 h-4 text-[#6b7280]" aria-hidden="true" />
                            <span>ひとことメモを追加（夜のふりかえりに自動反映）</span>
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="w-9 h-9 flex items-center justify-center text-[#6b7280] hover:text-[#c9171e] transition-colors cursor-pointer ml-auto rounded-md"
                          aria-label={`タスク「${task.title}」を削除`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Edit Note Inline Area */}
                      {isEditingNote && (
                        <div className="mt-3 p-3.5 bg-[#f0f6fc] border border-[#bfdbfe] rounded-md space-y-2.5">
                          <label htmlFor={`task-note-${task.id}`} className="block text-xs sm:text-sm font-bold text-[#1a1a1a]">
                            実行中に気づいた点や難しかった点をメモ：
                          </label>
                          <input
                            id={`task-note-${task.id}`}
                            type="text"
                            value={tempNote}
                            onChange={e => setTempNote(e.target.value)}
                            placeholder="例: 途中式を丁寧に書いたらスムーズに解けた！"
                            className="w-full text-sm min-h-[44px] px-3 py-2 border border-[#9ca3af] rounded-md focus:outline-none focus:border-[#005bab] bg-white text-[#1a1a1a]"
                          />
                          <div className="flex justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => setEditingNoteTaskId(null)}
                              className="dads-btn-tertiary min-h-[36px] py-1 text-xs"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveNote(task.id)}
                              className="dads-btn-primary min-h-[36px] py-1 text-xs"
                            >
                              保存する
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
