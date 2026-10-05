import React, { useState, useEffect } from 'react';
import {
  Task,
  StreakData,
  FailureItem,
  ReflectionAnalysisResult,
  ProposedImprovement,
} from '../types';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Check,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ShieldCheck,
  Flame,
  ChevronRight,
  MessageSquareQuote,
  PenLine,
  Target,
  ListChecks,
} from 'lucide-react';

interface EveningReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  streak: StreakData;
  unresolvedFailures: FailureItem[];
  onCompleteReflection: (data: {
    nextDayTasks: Task[];
    newFailures: FailureItem[];
    overcomeFailures: Array<{ failureId: string; note: string }>;
    rawJournalText: string;
  }) => void;
}

export const EveningReflectionModal: React.FC<EveningReflectionModalProps> = ({
  isOpen,
  onClose,
  tasks,
  streak,
  unresolvedFailures,
  onCompleteReflection,
}) => {
  // 4 Steps inside the Evening flow: ①振り返り → ②分析 → ③計画 → ④確認
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [journalText, setJournalText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ReflectionAnalysisResult | null>(null);

  // Step 3 (計画) state
  const [selectedImprovements, setSelectedImprovements] = useState<ProposedImprovement[]>([]);
  const [customActionTitle, setCustomActionTitle] = useState('');

  // Step 4 (確認) state: Editable Tasks List
  const [confirmedTasks, setConfirmedTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMinutes, setEditMinutes] = useState(20);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(25);
  const [newTaskIsImprovement, setNewTaskIsImprovement] = useState(false);
  const [isAddingNewTask, setIsAddingNewTask] = useState(false);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Step 1 -> Step 2: Trigger AI Analysis
  const handleAnalyze = async () => {
    if (!journalText.trim()) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawJournalText: journalText,
          currentTasks: tasks,
          pastUnresolvedFailures: unresolvedFailures,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis API failed');
      }

      const data: ReflectionAnalysisResult = await response.json();
      setAnalysisResult(data);

      // Default selected improvements (from analysis)
      const initialSelected = (data.proposedImprovements || []).map(imp => ({
        ...imp,
        selected: true,
      }));
      setSelectedImprovements(initialSelected);

      setStep(2);
    } catch (err) {
      console.error('Failed to analyze reflection:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2 -> Step 3
  const handleGoToPlanning = () => {
    setStep(3);
  };

  // Toggle improvement selection in Step 3
  const handleToggleImprovement = (imp: ProposedImprovement) => {
    setSelectedImprovements(prev => {
      const exists = prev.some(item => item.id === imp.id);
      if (exists) {
        return prev.filter(item => item.id !== imp.id);
      } else {
        return [...prev, { ...imp, selected: true }];
      }
    });
  };

  const handleAddCustomAction = () => {
    if (!customActionTitle.trim()) return;
    const newImp: ProposedImprovement = {
      id: 'custom_act_' + Date.now(),
      targetFailure: '自由設定',
      actionTitle: customActionTitle.trim(),
      actionDetail: '自分で設定した明日やる対策',
      estimatedMinutes: 20,
      selected: true,
    };
    setSelectedImprovements(prev => [...prev, newImp]);
    setCustomActionTitle('');
  };

  // Step 3 -> Step 4: Generate task list for confirmation
  const handleGoToConfirmation = () => {
    const nextTasks: Task[] = selectedImprovements.map((imp, idx) => ({
      id: 'task_conf_' + idx + '_' + Date.now(),
      title: imp.actionTitle,
      description: imp.actionDetail || 'つまずき対策スモールステップ',
      isImprovementAction: true,
      targetFailureDescription: imp.targetFailure,
      estimatedMinutes: imp.estimatedMinutes || 20,
      category: '改善アクション',
      priority: 'high',
      completed: false,
    }));

    // Add tomorrow plans extracted from user note if any
    if (analysisResult?.extractedTomorrowPlans && analysisResult.extractedTomorrowPlans.length > 0) {
      analysisResult.extractedTomorrowPlans.forEach((plan, i) => {
        if (!nextTasks.some(t => t.title.includes(plan) || plan.includes(t.title))) {
          nextTasks.push({
            id: 'task_plan_' + i + '_' + Date.now(),
            title: plan,
            description: '前日の振り返りで計画した学習・作業',
            isImprovementAction: false,
            estimatedMinutes: 30,
            category: '予定・テスト対策',
            priority: 'medium',
            completed: false,
          });
        }
      });
    }

    setConfirmedTasks(nextTasks);
    setStep(4);
  };

  // Task editing in Step 4 (確認)
  const handleStartEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditMinutes(task.estimatedMinutes);
  };

  const handleSaveEditTask = () => {
    if (!editingTaskId || !editTitle.trim()) return;
    setConfirmedTasks(prev =>
      prev.map(t =>
        t.id === editingTaskId
          ? { ...t, title: editTitle.trim(), estimatedMinutes: Number(editMinutes) || 20 }
          : t
      )
    );
    setEditingTaskId(null);
  };

  const handleDeleteConfirmedTask = (taskId: string) => {
    setConfirmedTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleAddNewTaskToConfirmed = () => {
    if (!newTaskTitle.trim()) return;
    setConfirmedTasks(prev => [
      ...prev,
      {
        id: 'task_custom_' + Date.now(),
        title: newTaskTitle.trim(),
        description: '追加したタスク',
        isImprovementAction: newTaskIsImprovement,
        estimatedMinutes: Number(newTaskMinutes) || 20,
        category: newTaskIsImprovement ? '改善アクション' : '明日の学習',
        priority: newTaskIsImprovement ? 'high' : 'medium',
        completed: false,
      },
    ]);
    setNewTaskTitle('');
    setNewTaskIsImprovement(false);
    setIsAddingNewTask(false);
  };

  // Finalize (Step 4 -> App)
  const handleFinalizeConfirmedTasks = () => {
    const newFailures: FailureItem[] = (analysisResult?.extractedFailures || []).map(f => ({
      id: f.id,
      date: new Date().toISOString().split('T')[0],
      failure: f.failure,
      context: f.context,
      severity: f.severity,
      rootCause: f.rootCause,
      status: 'in_action' as const,
      improvementActionTitle: confirmedTasks.find(t => t.targetFailureDescription === f.failure)?.title,
    }));

    onCompleteReflection({
      nextDayTasks: confirmedTasks,
      newFailures,
      overcomeFailures: [],
      rawJournalText: journalText,
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white sm:rounded-lg shadow-xl border-0 sm:border border-[#d1d5db] w-full max-w-3xl min-h-screen sm:min-h-0 sm:my-6 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 px-5 sm:px-6 py-4 border-b border-[#d1d5db] flex items-center justify-between bg-[#f8f9fa]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#454545]">
              <span className="font-bold text-[#005bab]">夜のふりかえりノート</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 font-bold text-[#b45309]">
                <Flame className="w-3.5 h-3.5 fill-[#b45309]" aria-hidden="true" />
                <span className="tabular-nums font-mono">ストリーク: {streak.currentStreak}日連続</span>
              </span>
            </div>
            <h2 id="modal-heading" className="text-base sm:text-xl font-bold text-[#1a1a1a] mt-1 flex items-center gap-2">
              {step === 1 && (
                <>
                  <PenLine className="w-5 h-5 text-[#005bab] shrink-0" aria-hidden="true" />
                  <span>振り返り: 今日の取り組み・つまずきを入力</span>
                </>
              )}
              {step === 2 && (
                <>
                  <Sparkles className="w-5 h-5 text-[#005bab] shrink-0" aria-hidden="true" />
                  <span>AI分析: 成果・課題・予定の抽出結果</span>
                </>
              )}
              {step === 3 && (
                <>
                  <Target className="w-5 h-5 text-[#005bab] shrink-0" aria-hidden="true" />
                  <span>改善計画: 明日のアクションを選択</span>
                </>
              )}
              {step === 4 && (
                <>
                  <ListChecks className="w-5 h-5 text-[#005bab] shrink-0" aria-hidden="true" />
                  <span>確認: 明日のタスク一覧を確定</span>
                </>
              )}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-[#454545] hover:text-[#1a1a1a] hover:bg-[#e5e7eb] rounded-md transition-colors cursor-pointer"
            aria-label="モーダルを閉じる"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 4-Step Progress Indicator conforming to DADS Step Process Pattern */}
        <div className="px-5 sm:px-6 py-3 bg-white border-b border-[#e5e7eb] flex items-center justify-between text-xs sm:text-sm overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="手順進行状況">
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded ${step === 1 ? 'font-bold text-[#005bab] bg-[#eff6ff] border border-[#bfdbfe]' : 'text-[#6b7280]'}`}>
              <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
              <span>1. 振り返り</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" aria-hidden="true" />
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded ${step === 2 ? 'font-bold text-[#005bab] bg-[#eff6ff] border border-[#bfdbfe]' : 'text-[#6b7280]'}`}>
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>2. 分析</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" aria-hidden="true" />
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded ${step === 3 ? 'font-bold text-[#005bab] bg-[#eff6ff] border border-[#bfdbfe]' : 'text-[#6b7280]'}`}>
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              <span>3. 計画</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" aria-hidden="true" />
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded ${step === 4 ? 'font-bold text-[#005bab] bg-[#eff6ff] border border-[#bfdbfe]' : 'text-[#6b7280]'}`}>
              <ListChecks className="w-3.5 h-3.5" aria-hidden="true" />
              <span>4. 確認</span>
            </span>
          </div>

          <span className="text-xs text-[#6b7280] font-medium hidden md:inline">
            所要時間: 最短2分
          </span>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-6 max-h-[calc(100vh-140px)] sm:max-h-[70vh]">
          {/* STEP 1: 振り返り入力 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-md p-4 text-xs sm:text-sm text-[#1a1a1a] leading-relaxed space-y-1">
                <span className="font-bold text-[#005bab] block text-sm">
                  今日できたこと・間違えたことをそのまま率直に入力してください
                </span>
                <p className="text-[#454545]">
                  どんな勉強や作業でも構いません。取り組んだこと、スムーズにできた点、つまずいた問題やミス、明日の予定を自由に書くと、AIが自動で整理して「明日のスモールステップ」に変換します。
                </p>
              </div>

              {/* Text Area with DADS standard label and required badge */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <label htmlFor="journal-textarea" className="text-sm font-bold text-[#1a1a1a]">
                      今日のふりかえり（自由入力）
                    </label>
                    <span className="dads-badge-required">必須</span>
                  </div>
                  {journalText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setJournalText('')}
                      className="text-xs text-[#454545] hover:text-[#005bab] cursor-pointer min-h-[32px] px-1"
                    >
                      クリア
                    </button>
                  )}
                </div>
                <textarea
                  id="journal-textarea"
                  rows={8}
                  value={journalText}
                  onChange={e => setJournalText(e.target.value)}
                  placeholder="例: 今日は問題集を解いた。計算の基本はスムーズにできたが、文章題の立式で3回ミスをしてしまった。明日は文章題の解き方を復習したい。"
                  className="w-full p-3.5 border border-[#9ca3af] rounded-md text-base text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none leading-relaxed"
                  required
                  aria-required="true"
                />
                <div className="flex items-center justify-between text-xs text-[#454545] mt-1.5">
                  <span>※ 短い文章や箇条書きでも正確に分析されます</span>
                  <span className="tabular-nums font-mono font-medium">文字数: {journalText.length} 文字</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI分析結果 */}
          {step === 2 && analysisResult && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#005bab] bg-[#eff6ff] p-3 rounded-md border border-[#bfdbfe]">
                <Sparkles className="w-4 h-4 text-[#005bab] shrink-0" aria-hidden="true" />
                <span>AIが振り返りから「成功した点」「失敗した点」「明日の予定」を整理しました。</span>
              </div>

              {/* 3 Columns: 成功した点 / 失敗した点 / 明日の予定 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. 成功した点 */}
                <div className="border border-[#86efac] bg-white rounded-md p-4 shadow-xs">
                  <div className="flex items-center gap-2 text-[#007934] font-bold text-sm mb-3 pb-2 border-b border-[#e5e7eb]">
                    <CheckCircle2 className="w-4 h-4 text-[#007934] shrink-0" aria-hidden="true" />
                    <span>成功した点</span>
                  </div>
                  <ul className="space-y-2">
                    {analysisResult.extractedAchievements.map((item, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-[#1a1a1a] flex items-start gap-2 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-[#007934] shrink-0 mt-1 stroke-[3]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. 失敗した点 */}
                <div className="border border-[#fca5a5] bg-white rounded-md p-4 shadow-xs">
                  <div className="flex items-center gap-2 text-[#c9171e] font-bold text-sm mb-3 pb-2 border-b border-[#e5e7eb]">
                    <AlertCircle className="w-4 h-4 text-[#c9171e] shrink-0" aria-hidden="true" />
                    <span>失敗した点（つまずき）</span>
                  </div>
                  <ul className="space-y-2.5">
                    {analysisResult.extractedFailures.map((item, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-[#1a1a1a] flex items-start gap-2 leading-relaxed">
                        <AlertCircle className="w-3.5 h-3.5 text-[#c9171e] shrink-0 mt-1" aria-hidden="true" />
                        <div>
                          <strong className="text-[#1a1a1a] block">{item.failure}</strong>
                          <span className="block text-xs text-[#454545] mt-0.5">原因: {item.rootCause}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. 明日の予定 */}
                <div className="border border-[#bfdbfe] bg-white rounded-md p-4 shadow-xs">
                  <div className="flex items-center gap-2 text-[#005bab] font-bold text-sm mb-3 pb-2 border-b border-[#e5e7eb]">
                    <Calendar className="w-4 h-4 text-[#005bab] shrink-0" aria-hidden="true" />
                    <span>明日の予定</span>
                  </div>
                  <ul className="space-y-2">
                    {(analysisResult.extractedTomorrowPlans && analysisResult.extractedTomorrowPlans.length > 0
                      ? analysisResult.extractedTomorrowPlans
                      : ['復習・次の単元の学習をしたい']
                    ).map((plan, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-[#1a1a1a] flex items-start gap-2 leading-relaxed">
                        <Calendar className="w-3.5 h-3.5 text-[#005bab] shrink-0 mt-1" aria-hidden="true" />
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Encouragement Note */}
              <div className="bg-[#fafafa] border border-[#d1d5db] p-4 rounded-md text-xs sm:text-sm text-[#1a1a1a] flex items-start gap-3">
                <MessageSquareQuote className="w-5 h-5 text-[#005bab] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="text-[#005bab] mr-1 block text-sm mb-0.5">学習改善アドバイス:</strong>
                  <p className="text-[#454545] leading-relaxed">{analysisResult.encouragementNote}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 計画（アクション選択） */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a]">
                  明日やるアクション（改善提案）
                </h3>
                <p className="text-xs sm:text-sm text-[#454545] mt-1 leading-relaxed">
                  分析した課題やつまずきを、明日実行できる具体的な行動に落とし込みました。明日取り組みたいアクションを選択してください。
                </p>
              </div>

              {/* Action Proposal Cards */}
              <div className="space-y-3" role="group" aria-label="改善アクション候補">
                {selectedImprovements.map(imp => {
                  const isSelected = selectedImprovements.some(item => item.id === imp.id);
                  return (
                    <div
                      key={imp.id}
                      onClick={() => handleToggleImprovement(imp)}
                      className={`border-2 rounded-md p-4 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-[#005bab] bg-[#eff6ff]'
                          : 'border-[#d1d5db] hover:border-[#9ca3af] bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-6 h-6 rounded mt-0.5 flex items-center justify-center shrink-0 border-2 ${
                            isSelected
                              ? 'bg-[#005bab] border-[#005bab] text-white'
                              : 'border-[#9ca3af] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#eff6ff] text-[#005bab] border border-[#bfdbfe]">
                              改善アクション (+1pt)
                            </span>
                            <span className="text-xs text-[#454545] font-medium tabular-nums font-mono">
                              めやす約{imp.estimatedMinutes}分
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[#1a1a1a]">
                            {imp.actionTitle}
                          </h4>
                          <p className="text-xs sm:text-sm text-[#454545] mt-1 leading-relaxed">
                            {imp.actionDetail}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Action */}
              <div className="pt-2 border-t border-[#e5e7eb]">
                <div className="flex items-center gap-2 mb-1.5">
                  <label htmlFor="custom-action-input" className="text-xs sm:text-sm font-bold text-[#1a1a1a]">
                    自分でアクションを追加する
                  </label>
                  <span className="dads-badge-optional">任意</span>
                </div>
                <div className="flex gap-2">
                  <input
                    id="custom-action-input"
                    type="text"
                    value={customActionTitle}
                    onChange={e => setCustomActionTitle(e.target.value)}
                    placeholder="例: 公式を単語帳にメモして見直す"
                    className="flex-1 min-h-[44px] px-3.5 py-2 border border-[#9ca3af] rounded-md text-sm text-[#1a1a1a] focus:border-[#005bab] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAction}
                    disabled={!customActionTitle.trim()}
                    className="dads-btn-secondary min-h-[44px] text-sm shrink-0 disabled:opacity-50"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: 確認（明日のタスク確定） */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a]">
                  明日のタスクリストの確認・編集
                </h3>
                <p className="text-xs sm:text-sm text-[#454545] mt-1 leading-relaxed">
                  明日やるタスクの一覧です。タイトルや所要時間を自由に変更できます。
                </p>
              </div>

              {/* Confirmed Task List */}
              <div className="space-y-3" role="list" aria-label="確定タスク一覧">
                {confirmedTasks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="border border-[#d1d5db] rounded-md p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    role="listitem"
                  >
                    {editingTaskId === t.id ? (
                      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="flex-1 min-h-[44px] px-3 py-2 border border-[#005bab] rounded-md text-sm text-[#1a1a1a] focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editMinutes}
                            onChange={e => setEditMinutes(Number(e.target.value))}
                            className="w-20 min-h-[44px] px-2 py-2 border border-[#9ca3af] rounded-md text-sm text-center"
                          />
                          <span className="text-xs text-[#454545]">分</span>
                          <button
                            type="button"
                            onClick={handleSaveEditTask}
                            className="dads-btn-primary min-h-[40px] px-3 py-1 text-xs"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-bold text-[#6b7280] mt-0.5 tabular-nums font-mono">#{idx + 1}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {t.isImprovementAction ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-[#eff6ff] text-[#005bab] border border-[#bfdbfe]">
                                  <Sparkles className="w-3 h-3 text-[#005bab]" aria-hidden="true" />
                                  <span>つまずき改善（+1pt対象）</span>
                                </span>
                              ) : (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#f3f4f6] text-[#1a1a1a] border border-[#d1d5db]">
                                  {t.category}
                                </span>
                              )}
                              <span className="text-xs text-[#454545] font-medium tabular-nums font-mono">
                                所要時間: 約{t.estimatedMinutes}分
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-[#1a1a1a]">
                              {t.title}
                            </h4>
                            <p className="text-xs text-[#6b7280] mt-0.5">{t.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditTask(t)}
                            className="w-9 h-9 flex items-center justify-center text-[#454545] hover:text-[#005bab] rounded-md hover:bg-[#f3f4f6] cursor-pointer"
                            aria-label={`タスク「${t.title}」を編集`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteConfirmedTask(t.id)}
                            className="w-9 h-9 flex items-center justify-center text-[#6b7280] hover:text-[#c9171e] rounded-md hover:bg-[#fef2f2] cursor-pointer"
                            aria-label={`タスク「${t.title}」を削除`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Task Row */}
              {isAddingNewTask ? (
                <div className="border border-[#bfdbfe] rounded-md p-4 bg-[#eff6ff] space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="新しいタスクのタイトル"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      className="flex-1 min-h-[44px] px-3.5 py-2 border border-[#9ca3af] rounded-md text-sm bg-white text-[#1a1a1a]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="25"
                        value={newTaskMinutes}
                        onChange={e => setNewTaskMinutes(Number(e.target.value))}
                        className="w-20 min-h-[44px] px-2 py-2 border border-[#9ca3af] rounded-md text-sm text-center bg-white"
                      />
                      <span className="text-xs text-[#454545]">分</span>
                      <button
                        type="button"
                        onClick={handleAddNewTaskToConfirmed}
                        disabled={!newTaskTitle.trim()}
                        className="dads-btn-primary min-h-[44px] px-4 py-2 text-xs"
                      >
                        追加
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewTask(false)}
                        className="dads-btn-tertiary min-h-[44px] px-3 py-2 text-xs"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center pt-1">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1a1a1a] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newTaskIsImprovement}
                        onChange={e => setNewTaskIsImprovement(e.target.checked)}
                        className="w-4 h-4 rounded border-[#9ca3af] text-[#005bab] focus:ring-0"
                      />
                      <span>つまずき改善タスクにする（達成時に +1pt 獲得）</span>
                    </label>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingNewTask(true)}
                  className="w-full min-h-[44px] border-2 border-dashed border-[#d1d5db] hover:border-[#005bab] rounded-md text-sm font-bold text-[#005bab] flex items-center justify-center gap-2 cursor-pointer bg-white transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>タスクを追加する</span>
                </button>
              )}

              {/* Summary Notice */}
              <div className="bg-[#edf7ee] border border-[#86efac] rounded-md p-4 text-xs sm:text-sm text-[#007934] flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#007934] shrink-0" aria-hidden="true" />
                <span>
                  確定すると明日の「今日やること」に反映され、<strong>改善タスクを完了するごとに改善ポイント（+1pt）が付与されます。</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="sticky bottom-0 z-10 px-5 sm:px-6 py-4 border-t border-[#d1d5db] bg-white sm:bg-[#f8f9fa] flex items-center justify-between gap-3 shadow-xs">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                className="dads-btn-tertiary min-h-[44px] text-sm"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>前の手順に戻る</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="dads-btn-tertiary min-h-[44px] text-sm text-[#454545]"
              >
                あとで書く
              </button>
            )}
          </div>

          <div>
            {/* Step 1: 次へ進む (AIで分析) */}
            {step === 1 && (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !journalText.trim()}
                className="dads-btn-primary min-h-[44px] text-sm"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span>AIで分析中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>AIで分析する</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            )}

            {/* Step 2: 計画へ進む */}
            {step === 2 && (
              <button
                type="button"
                onClick={handleGoToPlanning}
                className="dads-btn-primary min-h-[44px] text-sm"
              >
                <Target className="w-4 h-4" aria-hidden="true" />
                <span>アクション計画へ</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {/* Step 3: 確認へ進む */}
            {step === 3 && (
              <button
                type="button"
                onClick={handleGoToConfirmation}
                disabled={selectedImprovements.length === 0}
                className="dads-btn-primary min-h-[44px] text-sm"
              >
                <ListChecks className="w-4 h-4" aria-hidden="true" />
                <span>タスクリストを確認</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {/* Step 4: 決定 */}
            {step === 4 && (
              <button
                type="button"
                onClick={handleFinalizeConfirmedTasks}
                disabled={confirmedTasks.length === 0}
                className="dads-btn-primary min-h-[44px] text-sm"
              >
                <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                <span>この内容で決定して明日に備える</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
