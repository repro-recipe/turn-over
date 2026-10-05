import React, { useState, useEffect } from 'react';
import { Task, DailyRoutineTask, FailureItem, StreakData, UserStats } from '../types';
import {
  X,
  Copy,
  Check,
  Download,
  Upload,
  Database,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';

export interface AppBackupPayload {
  app: 'TurnOver';
  version: number;
  exportedAt: string;
  data: {
    tasks: Task[];
    dailyRoutines: DailyRoutineTask[];
    failures: FailureItem[];
    streak: StreakData;
    stats: UserStats;
  };
}

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  dailyRoutines: DailyRoutineTask[];
  failures: FailureItem[];
  streak: StreakData;
  stats: UserStats;
  onImportData: (payload: AppBackupPayload['data']) => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  tasks,
  dailyRoutines,
  failures,
  streak,
  stats,
  onImportData,
}) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<AppBackupPayload['data'] | null>(null);

  // Generate the formatted JSON export string
  const exportPayload: AppBackupPayload = {
    app: 'TurnOver',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      tasks,
      dailyRoutines,
      failures,
      streak,
      stats,
    },
  };

  const exportString = JSON.stringify(exportPayload, null, 2);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  // Download as .json file
  const handleDownloadFile = () => {
    const blob = new Blob([exportString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `turnover_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Validate import text when it changes
  const handleImportTextChange = (text: string) => {
    setImportText(text);
    setImportError(null);
    setPreviewData(null);

    if (!text.trim()) return;

    try {
      const parsed = JSON.parse(text);
      // Support either full payload with { data: { ... } } or direct { tasks, ... }
      const payloadData = parsed.data ? parsed.data : parsed;

      if (!payloadData || typeof payloadData !== 'object') {
        throw new Error('データ形式が不正です。');
      }

      // Check required fields
      if (!Array.isArray(payloadData.tasks) && !Array.isArray(payloadData.failures)) {
        throw new Error('TurnOverの有効なバックアップデータが見つかりません。');
      }

      setPreviewData(payloadData as AppBackupPayload['data']);
    } catch (err: any) {
      setImportError(err.message || 'JSON形式の解析に失敗しました。');
      setPreviewData(null);
    }
  };

  // Perform import
  const handleExecuteImport = () => {
    if (!previewData) return;

    if (
      confirm(
        '現在のデータがインポートされたデータで上書きされます。よろしいですか？'
      )
    ) {
      onImportData(previewData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white rounded-lg shadow-xl border border-[#d1d5db] w-full max-w-2xl my-6 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#d1d5db] flex items-center justify-between bg-[#f8f9fa]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#005bab]">
              <Database className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="backup-modal-title" className="text-base sm:text-lg font-bold text-[#1a1a1a]">
                データ保存・インポート（バックアップ）
              </h2>
              <span className="text-xs text-[#454545]">
                テキスト文字列で手軽に保存・復元できます
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-[#454545] hover:text-[#1a1a1a] hover:bg-[#e5e7eb] rounded-md transition-colors cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Switcher conforming to DADS Segmented pattern */}
        <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-[#e5e7eb] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('export')}
            className={`min-h-[40px] px-4 py-1.5 text-xs sm:text-sm font-bold rounded-md cursor-pointer transition-colors border inline-flex items-center gap-2 ${
              tab === 'export'
                ? 'bg-[#005bab] text-white border-[#005bab]'
                : 'bg-white text-[#454545] border-[#d1d5db] hover:bg-[#f3f4f6]'
            }`}
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            <span>データ文字列の保存（エクスポート）</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('import')}
            className={`min-h-[40px] px-4 py-1.5 text-xs sm:text-sm font-bold rounded-md cursor-pointer transition-colors border inline-flex items-center gap-2 ${
              tab === 'import'
                ? 'bg-[#005bab] text-white border-[#005bab]'
                : 'bg-white text-[#454545] border-[#d1d5db] hover:bg-[#f3f4f6]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>データ文字列の復元（インポート）</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {tab === 'export' ? (
            <div className="space-y-4">
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-md p-3.5 text-xs sm:text-sm text-[#1a1a1a] leading-relaxed">
                <span className="font-bold text-[#005bab] block mb-0.5">
                  現在の学習データを文字列として書き出しました
                </span>
                <p className="text-[#454545]">
                  下のテキストエリア内の文字列をコピーして、メモ帳やメッセージアプリなどに貼り付けて保管できます。別の端末やブラウザでも、インポート画面にこの文字列を貼り付けるだけで復元できます。
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="export-textarea" className="text-xs sm:text-sm font-bold text-[#1a1a1a]">
                    バックアップデータ文字列（JSON）
                  </label>
                  <span className="text-xs text-[#6b7280]">
                    タスク: {tasks.length}件 / 習慣: {dailyRoutines.length}件 / 克服ノート: {failures.length}件
                  </span>
                </div>
                <textarea
                  id="export-textarea"
                  readOnly
                  rows={9}
                  value={exportString}
                  onClick={e => (e.target as HTMLTextAreaElement).select()}
                  className="w-full p-3 font-mono text-xs text-[#1a1a1a] bg-[#fafafa] border border-[#9ca3af] rounded-md focus:outline-none focus:border-[#005bab]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="dads-btn-secondary min-h-[44px] text-xs sm:text-sm"
                >
                  <Download className="w-4 h-4 text-[#005bab]" aria-hidden="true" />
                  <span>ファイルとして保存 (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="dads-btn-primary min-h-[44px] text-xs sm:text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white stroke-[3]" aria-hidden="true" />
                      <span>コピーしました！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" aria-hidden="true" />
                      <span>文字列をクリップボードにコピー</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#fffbeb] border border-[#fde68a] rounded-md p-3.5 text-xs sm:text-sm text-[#1a1a1a] leading-relaxed">
                <span className="font-bold text-[#b45309] block mb-0.5">
                  保存したデータ文字列を貼り付けて復元
                </span>
                <p className="text-[#454545]">
                  エクスポートで保存した文字列（またはJSONファイルの内容）を下の枠内に貼り付けてください。実行すると現在のデータが復元データに置き換わります。
                </p>
              </div>

              <div>
                <label htmlFor="import-textarea" className="text-xs sm:text-sm font-bold text-[#1a1a1a] block mb-1.5">
                  データ文字列を貼り付け
                </label>
                <textarea
                  id="import-textarea"
                  rows={8}
                  value={importText}
                  onChange={e => handleImportTextChange(e.target.value)}
                  placeholder="例: { &quot;app&quot;: &quot;TurnOver&quot;, &quot;data&quot;: { ... } }"
                  className="w-full p-3 font-mono text-xs text-[#1a1a1a] bg-white border border-[#9ca3af] rounded-md focus:outline-none focus:border-[#005bab]"
                />
              </div>

              {/* Error state */}
              {importError && (
                <div className="flex items-center gap-2 p-3 bg-[#fef2f2] border border-[#fca5a5] rounded-md text-xs sm:text-sm text-[#c9171e]">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Valid Preview Summary */}
              {previewData && (
                <div className="bg-[#edf7ee] border border-[#86efac] rounded-md p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#007934]">
                    <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                    <span>有効なデータが確認できました。復元準備完了：</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#1a1a1a] pt-1">
                    <div className="bg-white p-2 rounded border border-[#86efac]">
                      <span className="text-[#454545] block text-[11px]">タスク</span>
                      <strong className="text-sm font-bold">{previewData.tasks?.length || 0}件</strong>
                    </div>
                    <div className="bg-white p-2 rounded border border-[#86efac]">
                      <span className="text-[#454545] block text-[11px]">デイリー習慣</span>
                      <strong className="text-sm font-bold">{previewData.dailyRoutines?.length || 0}件</strong>
                    </div>
                    <div className="bg-white p-2 rounded border border-[#86efac]">
                      <span className="text-[#454545] block text-[11px]">克服ノート</span>
                      <strong className="text-sm font-bold">{previewData.failures?.length || 0}件</strong>
                    </div>
                    <div className="bg-white p-2 rounded border border-[#86efac]">
                      <span className="text-[#454545] block text-[11px]">改善ポイント</span>
                      <strong className="text-sm font-bold">{previewData.stats?.improvementPoints || 0} pt</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="dads-btn-tertiary min-h-[44px] text-xs sm:text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  disabled={!previewData}
                  onClick={handleExecuteImport}
                  className={`dads-btn-primary min-h-[44px] text-xs sm:text-sm ${
                    !previewData ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 text-white" aria-hidden="true" />
                  <span>インポートを実行（データを復元）</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
