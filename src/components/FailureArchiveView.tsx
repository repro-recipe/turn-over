import React, { useState } from 'react';
import { FailureItem } from '../types';
import {
  CheckCircle2,
  Clock,
  Search,
  Check,
  Plus,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface FailureArchiveViewProps {
  failures: FailureItem[];
  onMarkOvercome: (failureId: string, reflection: string) => void;
  onAddFailure: (failure: Omit<FailureItem, 'id' | 'date' | 'status'>) => void;
  onBackToHome?: () => void;
}

export const FailureArchiveView: React.FC<FailureArchiveViewProps> = ({
  failures,
  onMarkOvercome,
  onAddFailure,
  onBackToHome,
}) => {
  const [filter, setFilter] = useState<'all' | 'overcome' | 'in_action' | 'unresolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [overcomingId, setOvercomingId] = useState<string | null>(null);
  const [overcomeNote, setOvercomeNote] = useState('');

  const [isAddingFailure, setIsAddingFailure] = useState(false);
  const [newFailureText, setNewFailureText] = useState('');
  const [newContextText, setNewContextText] = useState('');
  const [newRootCause, setNewRootCause] = useState('');

  const overcomeCount = failures.filter(f => f.status === 'overcome').length;
  const inActionCount = failures.filter(f => f.status === 'in_action').length;
  const unresolvedCount = failures.filter(f => f.status === 'unresolved').length;

  const filteredFailures = failures.filter(f => {
    if (filter === 'overcome' && f.status !== 'overcome') return false;
    if (filter === 'in_action' && f.status !== 'in_action') return false;
    if (filter === 'unresolved' && f.status !== 'unresolved') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.failure.toLowerCase().includes(q) ||
        f.rootCause.toLowerCase().includes(q) ||
        f.context.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleConfirmOvercome = (id: string) => {
    onMarkOvercome(id, overcomeNote.trim() || '克服完了！');
    setOvercomingId(null);
    setOvercomeNote('');
  };

  const handleCreateFailure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFailureText.trim()) return;

    onAddFailure({
      failure: newFailureText.trim(),
      context: newContextText.trim() || '日々の学習',
      severity: 'moderate',
      rootCause: newRootCause.trim() || '原因を分析中',
    });

    setNewFailureText('');
    setNewContextText('');
    setNewRootCause('');
    setIsAddingFailure(false);
  };

  return (
    <div className="space-y-6">
      {/* Back to Home Button */}
      {onBackToHome && (
        <div>
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#005bab] hover:underline cursor-pointer min-h-[40px] px-1 py-1 rounded focus:outline-none focus:ring-2 focus:ring-[#005bab]"
            aria-label="ホーム（今日やること）に戻る"
          >
            <ArrowLeft className="w-4 h-4 text-[#005bab]" aria-hidden="true" />
            <span>← ホーム（今日やること）に戻る</span>
          </button>
        </div>
      )}

      {/* Top Banner conforming to DADS Public-Service Design Standards */}
      <section className="bg-white border border-[#d1d5db] rounded-lg p-5 sm:p-6 shadow-xs" aria-labelledby="archive-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#454545] mb-1">
              <span className="font-semibold text-[#005bab]">つまずき・克服の記録</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums font-mono">合計 {failures.length}件</span>
            </div>
            <h1 id="archive-heading" className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tracking-tight">
              できるようになったこと（克服ノート）
            </h1>
            <p className="text-sm text-[#454545] mt-1 leading-relaxed">
              できなかった問題やつまずきを記録し、改善アクションを実行して克服できたら「できるようになった！」を記録します。
            </p>
          </div>

          <button
            onClick={() => setIsAddingFailure(true)}
            className="dads-btn-secondary min-h-[44px] text-sm shrink-0 self-start sm:self-auto"
            aria-label="新しいつまずきを手動で追加"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>つまずきを追加</span>
          </button>
        </div>

        {/* 3 Status Summary Columns */}
        <div className="mt-5 pt-4 border-t border-[#e5e7eb] grid grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-[#fafafa] border border-[#d1d5db] rounded-md p-3 sm:p-4">
            <span className="text-xs sm:text-sm text-[#454545] block font-medium mb-1">解決できた（克服）</span>
            <span className="text-xl sm:text-2xl font-bold text-[#007934] flex items-center gap-1.5 tabular-nums font-mono">
              <CheckCircle2 className="w-5 h-5 text-[#007934]" aria-hidden="true" />
              {overcomeCount} 件
            </span>
          </div>

          <div className="bg-[#fafafa] border border-[#d1d5db] rounded-md p-3 sm:p-4">
            <span className="text-xs sm:text-sm text-[#454545] block font-medium mb-1">いま対策中</span>
            <span className="text-xl sm:text-2xl font-bold text-[#005bab] flex items-center gap-1.5 tabular-nums font-mono">
              <Clock className="w-5 h-5 text-[#005bab]" aria-hidden="true" />
              {inActionCount} 件
            </span>
          </div>

          <div className="bg-[#fafafa] border border-[#d1d5db] rounded-md p-3 sm:p-4">
            <span className="text-xs sm:text-sm text-[#454545] block font-medium mb-1">これから対策</span>
            <span className="text-xl sm:text-2xl font-bold text-[#454545] flex items-center gap-1.5 tabular-nums font-mono">
              <AlertCircle className="w-5 h-5 text-[#6b7280]" aria-hidden="true" />
              {unresolvedCount} 件
            </span>
          </div>
        </div>
      </section>

      {/* Manual Add Form conforming to DADS Form Specifications */}
      {isAddingFailure && (
        <form
          onSubmit={handleCreateFailure}
          className="bg-white border-2 border-[#005bab] rounded-lg p-5 sm:p-6 space-y-4 shadow-sm"
          aria-labelledby="add-failure-heading"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
            <h2 id="add-failure-heading" className="text-base sm:text-lg font-bold text-[#1a1a1a]">
              つまずいた内容をメモする
            </h2>
            <button
              type="button"
              onClick={() => setIsAddingFailure(false)}
              className="text-xs text-[#454545] hover:text-[#1a1a1a] cursor-pointer min-h-[36px] px-2 py-1"
            >
              閉じる
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label htmlFor="failure-text-input" className="text-sm font-bold text-[#1a1a1a]">
                うまくいかなかったこと・間違えた点
              </label>
              <span className="dads-badge-required">必須</span>
            </div>
            <input
              id="failure-text-input"
              type="text"
              required
              aria-required="true"
              placeholder="例: 三角形の面積の公式で ÷2 を忘れて計算ミスした"
              value={newFailureText}
              onChange={e => setNewFailureText(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 border border-[#9ca3af] rounded-md text-base text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label htmlFor="failure-context-input" className="text-sm font-bold text-[#1a1a1a]">
                  教科や場面
                </label>
                <span className="dads-badge-optional">任意</span>
              </div>
              <input
                id="failure-context-input"
                type="text"
                placeholder="例: 数学の小テスト、英語長文読解"
                value={newContextText}
                onChange={e => setNewContextText(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 border border-[#9ca3af] rounded-md text-base text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label htmlFor="failure-rootcause-input" className="text-sm font-bold text-[#1a1a1a]">
                  なぜ間違えたと思うか（原因の分析）
                </label>
                <span className="dads-badge-optional">任意</span>
              </div>
              <input
                id="failure-rootcause-input"
                type="text"
                placeholder="例: 見直しをせずに次の問題へ急いでしまった"
                value={newRootCause}
                onChange={e => setNewRootCause(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 border border-[#9ca3af] rounded-md text-base text-[#1a1a1a] bg-white focus:border-[#005bab] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#e5e7eb]">
            <button
              type="button"
              onClick={() => setIsAddingFailure(false)}
              className="dads-btn-tertiary min-h-[44px]"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="dads-btn-primary min-h-[44px]"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>登録する</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar conforming to DADS Specifications */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d1d5db] pb-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="克服ノートフィルター">
          <button
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-md cursor-pointer border transition-colors ${
              filter === 'all'
                ? 'bg-[#005bab] text-white border-[#005bab]'
                : 'bg-white text-[#454545] border-[#d1d5db] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]'
            }`}
          >
            すべて ({failures.length})
          </button>
          <button
            role="tab"
            aria-selected={filter === 'overcome'}
            onClick={() => setFilter('overcome')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-md cursor-pointer border transition-colors inline-flex items-center gap-1.5 ${
              filter === 'overcome'
                ? 'bg-[#005bab] text-white border-[#005bab]'
                : 'bg-white text-[#454545] border-[#d1d5db] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>解決できた ({overcomeCount})</span>
          </button>
          <button
            role="tab"
            aria-selected={filter === 'in_action'}
            onClick={() => setFilter('in_action')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-md cursor-pointer border transition-colors inline-flex items-center gap-1.5 ${
              filter === 'in_action'
                ? 'bg-[#005bab] text-white border-[#005bab]'
                : 'bg-white text-[#454545] border-[#d1d5db] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>対策中 ({inActionCount})</span>
          </button>
          <button
            role="tab"
            aria-selected={filter === 'unresolved'}
            onClick={() => setFilter('unresolved')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-md cursor-pointer border transition-colors inline-flex items-center gap-1.5 ${
              filter === 'unresolved'
                ? 'bg-[#005bab] text-white border-[#005bab]'
                : 'bg-white text-[#454545] border-[#d1d5db] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>これから ({unresolvedCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <label htmlFor="failure-search-input" className="sr-only">
            つまずきを検索
          </label>
          <Search className="w-4 h-4 text-[#6b7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="failure-search-input"
            type="search"
            placeholder="つまずきを検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full min-h-[40px] pl-9 pr-3 py-1.5 border border-[#9ca3af] rounded-md text-sm bg-white text-[#1a1a1a] focus:border-[#005bab] focus:outline-none"
          />
        </div>
      </div>

      {/* Failure Cards List */}
      <section className="space-y-4" aria-label="つまずき一覧">
        {filteredFailures.length === 0 ? (
          <div className="bg-white border border-[#d1d5db] rounded-lg p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#f3f4f6] border border-[#d1d5db] flex items-center justify-center mx-auto text-[#454545]">
              <CheckCircle2 className="w-6 h-6 text-[#1a1a1a]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1a1a1a]">
                {searchQuery
                  ? '該当するつまずきは見つかりませんでした'
                  : '記録されたつまずき・課題はまだありません'}
              </h2>
              <p className="text-xs sm:text-sm text-[#454545] mt-1.5 leading-relaxed">
                毎晩のふりかえりを書くと、AIが今日つまずいた箇所を自動でここに整理・蓄積します。「つまずきを追加」から直接入力することも可能です。
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => setIsAddingFailure(true)}
                className="dads-btn-primary min-h-[44px] text-sm"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>つまずきを手動で追加する</span>
              </button>
            )}
          </div>
        ) : (
          filteredFailures.map(item => {
            const isOvercome = item.status === 'overcome';
            const isInAction = item.status === 'in_action';

            return (
              <article
                key={item.id}
                className={`bg-white border rounded-md p-5 transition-all shadow-xs ${
                  isOvercome
                    ? 'border-[#86efac] bg-[#fafafa]'
                    : isInAction
                    ? 'border-[#bfdbfe]'
                    : 'border-[#d1d5db]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#454545]">
                      <span className="tabular-nums font-mono">{item.date}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#1a1a1a]">{item.context}</span>
                      <span aria-hidden="true">·</span>
                      {isOvercome ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[#007934] bg-[#edf7ee] border border-[#86efac] px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#007934]" aria-hidden="true" />
                          <span>解決できた！</span>
                        </span>
                      ) : isInAction ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[#005bab] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-0.5 rounded">
                          <Clock className="w-3.5 h-3.5 text-[#005bab]" aria-hidden="true" />
                          <span>いま対策中</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#454545] bg-[#f3f4f6] border border-[#d1d5db] px-2 py-0.5 rounded">
                          <AlertCircle className="w-3.5 h-3.5 text-[#6b7280]" aria-hidden="true" />
                          <span>これから対策</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] leading-snug">
                      {item.failure}
                    </h3>

                    <div className="text-xs sm:text-sm text-[#454545]">
                      <strong className="text-[#1a1a1a]">原因の分析: </strong>
                      <span>{item.rootCause}</span>
                    </div>

                    {/* Improvement Action */}
                    {item.improvementActionTitle && (
                      <div className="mt-2.5 p-3 bg-[#fafafa] rounded-md border border-[#e5e7eb] text-xs sm:text-sm space-y-1">
                        <span className="font-bold text-[#005bab] block">
                          立てた改善アクション：
                        </span>
                        <p className="text-[#1a1a1a] font-semibold">
                          {item.improvementActionTitle}
                        </p>
                        {item.improvementActionDetail && (
                          <p className="text-[#454545]">
                            {item.improvementActionDetail}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Overcome reflection */}
                    {isOvercome && (
                      <div className="mt-2.5 p-3 bg-[#edf7ee] rounded-md border border-[#86efac] text-xs sm:text-sm space-y-1">
                        <span className="font-bold text-[#007934] block">
                          できるようになった成果：
                        </span>
                        <p className="text-[#1a1a1a] font-semibold">
                          {item.overcomeReflection}
                        </p>
                        {item.praiseNote && (
                          <p className="text-[#007934] text-xs mt-0.5 font-medium">
                            {item.praiseNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Overcome Action Button */}
                  {!isOvercome && (
                    <div className="shrink-0 pt-1">
                      {overcomingId === item.id ? (
                        <div className="bg-white border-2 border-[#005bab] rounded-lg p-4 shadow-sm w-full sm:w-80 space-y-3 text-sm">
                          <label htmlFor={`overcome-input-${item.id}`} className="font-bold text-[#1a1a1a] block">
                            できるようになった感想をメモ：
                          </label>
                          <input
                            id={`overcome-input-${item.id}`}
                            type="text"
                            value={overcomeNote}
                            onChange={e => setOvercomeNote(e.target.value)}
                            placeholder="例: 見直しを意識したら全問正解できた！"
                            className="w-full min-h-[40px] px-3 py-2 border border-[#9ca3af] rounded-md text-sm text-[#1a1a1a] focus:border-[#005bab] focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setOvercomingId(null)}
                              className="dads-btn-tertiary min-h-[36px] py-1 text-xs"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmOvercome(item.id)}
                              className="dads-btn-primary min-h-[36px] py-1 text-xs"
                            >
                              解決済みにする (+1pt)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOvercomingId(item.id);
                            setOvercomeNote('');
                          }}
                          className="dads-btn-secondary min-h-[44px] text-xs sm:text-sm font-bold w-full sm:w-auto"
                          aria-label={`「${item.failure}」を解決済みに記録する`}
                        >
                          <Check className="w-4 h-4" aria-hidden="true" />
                          <span>できるようになった！</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
