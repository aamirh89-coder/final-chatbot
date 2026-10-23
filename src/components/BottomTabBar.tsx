import React from 'react';
import { MessageSquare, Edit3, Radio, Sliders } from 'lucide-react';
import { WorkspaceTab } from '../types';

interface BottomTabBarProps {
  currentTab: WorkspaceTab;
  onChangeTab: (tab: WorkspaceTab) => void;
  onOpenLiveVoice: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onChangeTab,
  onOpenLiveVoice,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-2xl border-t border-outline-variant/15 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] select-none pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-14 px-3 sm:px-4 max-w-md mx-auto">
        {/* Chat Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('chat')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-mono font-medium ${
            currentTab === 'chat'
              ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
        </button>

        {/* Canvas Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('canvas')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-mono font-medium ${
            currentTab === 'canvas'
              ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Canvas</span>
        </button>

        {/* Live Audio Tab */}
        <button
          type="button"
          onClick={onOpenLiveVoice}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-tertiary transition-all text-xs font-mono font-medium group"
        >
          <Radio className="w-4 h-4 group-hover:animate-pulse text-tertiary" />
          <span>Live</span>
        </button>

        {/* Studio / Settings Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('settings')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-mono font-medium ${
            currentTab === 'settings'
              ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Studio</span>
        </button>
      </div>
    </nav>
  );
};
