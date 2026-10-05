import React from 'react';
import { Smartphone, Monitor, RotateCcw, ArrowLeft, Database } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'archive';
  onNavigateHome: () => void;
  onNavigateArchive: () => void;
  onOpenBackup: () => void;
  isMobilePreview: boolean;
  setIsMobilePreview: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateHome,
  onNavigateArchive: _onNavigateArchive,
  onOpenBackup,
  isMobilePreview,
  setIsMobilePreview,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#d1d5db] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Wordmark (DADS Clean Public Service Style) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left rounded-md p-1 -ml-1 transition-opacity hover:opacity-90 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#005bab]"
            aria-label="TurnOver ホームへ戻る"
          >
            <div className="w-9 h-9 rounded-md bg-[#005bab] text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-white stroke-[2.5]" aria-hidden="true" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1a1a1a] block leading-none">
                TurnOver
              </span>
              <span className="text-xs text-[#454545] font-medium hidden sm:block mt-0.5">
                学習改善ノート
              </span>
            </div>
          </button>

          {/* Context indicator if viewing archive */}
          {currentView === 'archive' && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#005bab] bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] rounded-md transition-colors cursor-pointer min-h-[36px]"
              aria-label="ホーム画面に戻る"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ホームに戻る</span>
            </button>
          )}
        </div>

        {/* Right utility: Data Backup/Restore & Preview Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBackup}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#005bab] bg-[#f0f6fc] hover:bg-[#e1ecf8] border border-[#bfdbfe] rounded-md transition-colors cursor-pointer min-h-[36px] focus:outline-none focus:ring-2 focus:ring-[#005bab]"
            title="データを文字列で保存・復元します"
            aria-label="データ保存・インポートを開く"
          >
            <Database className="w-3.5 h-3.5 text-[#005bab]" aria-hidden="true" />
            <span className="hidden sm:inline">データ保存・インポート</span>
            <span className="sm:hidden">保存/復元</span>
          </button>

          <button
            onClick={() => setIsMobilePreview(!isMobilePreview)}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#454545] bg-[#f8f9fa] hover:bg-[#f3f4f6] border border-[#d1d5db] rounded-md transition-colors cursor-pointer min-h-[36px] focus:outline-none focus:ring-2 focus:ring-[#005bab]"
            title="スマホ表示モードとPC全幅モードを切り替えます"
            aria-label={isMobilePreview ? 'PC全幅表示に切り替え' : 'スマホ実機表示に切り替え'}
          >
            {isMobilePreview ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-[#1a1a1a]" aria-hidden="true" />
                <span>PC全幅表示</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-[#1a1a1a]" aria-hidden="true" />
                <span>スマホ表示</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
