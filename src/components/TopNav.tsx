import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Settings,
  Sparkles,
  ChevronDown,
  Sun,
  Moon,
  MessageSquare,
  Edit3,
  Radio,
  Check,
  Zap,
} from 'lucide-react';
import { AppSettings, WorkspaceTab } from '../types';

interface TopNavProps {
  currentTab: WorkspaceTab;
  settings: AppSettings;
  activeTitle?: string;
  onToggleDrawer: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onChangeTab: (tab: WorkspaceTab) => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Instant ⚡',
    desc: 'Sub-second streaming, free-tier optimized',
    recommended: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Flagship',
    desc: 'Deep multi-turn context & complex code',
    recommended: false,
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    tag: 'Pro',
    desc: 'Deep architectural reasoning',
    recommended: false,
  },
];

const THEME_OPTIONS = [
  { id: 'dark', name: 'Midnight Dark', color: '#818cf8', icon: Moon },
  { id: 'light', name: 'Premium Light', color: '#4f46e5', icon: Sun },
  { id: 'aurora', name: 'Glass Aurora', color: '#c084fc', icon: Sparkles },
  { id: 'ocean', name: 'Ocean Blue', color: '#38bdf8', icon: Zap },
  { id: 'emerald', name: 'Emerald Matrix', color: '#34d399', icon: Check },
  { id: 'sunset', name: 'Sunset Glow', color: '#fb7185', icon: Sun },
] as const;

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  settings,
  activeTitle,
  onToggleDrawer,
  onNewChat,
  onOpenSettings,
  onChangeTab,
  onUpdateSettings,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const selectedModel =
    AVAILABLE_MODELS.find((m) => m.id === settings.model) || AVAILABLE_MODELS[0];

  return (
    <header className="sticky top-0 w-full z-40 bg-surface-container-lowest/85 backdrop-blur-2xl border-b border-outline-variant/20 shadow-[0_4px_24px_rgba(0,0,0,0.18)] select-none">
      <div className="h-14 sm:h-16 px-2.5 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 w-full">
        {/* Left Zone: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={onToggleDrawer}
            aria-label="Toggle chat drawer"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
            title="Toggle sidebar (⌘B)"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={onNewChat}
          >
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-secondary via-primary to-tertiary flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-on-primary animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-base font-bold text-on-surface leading-tight tracking-tight">
                Gemini AI
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-tertiary leading-none font-medium">
                Studio
              </span>
            </div>
          </div>

          {activeTitle && (
            <div className="hidden md:flex items-center gap-2 pl-3 ml-2 border-l border-outline-variant/30 text-xs text-on-surface-variant max-w-[200px] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary/80 shrink-0" />
              <span className="truncate">{activeTitle}</span>
            </div>
          )}
        </div>

        {/* Center Zone: Workspace Navigation Tabs (visible from md up) */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-surface-container-low/90 rounded-2xl border border-outline-variant/20 shadow-inner text-xs font-mono">
          <button
            onClick={() => onChangeTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-medium ${
              currentTab === 'chat'
                ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Hub</span>
          </button>

          <button
            onClick={() => onChangeTab('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-medium ${
              currentTab === 'canvas'
                ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Canvas</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-medium ${
              currentTab === 'settings'
                ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Model Studio</span>
          </button>
        </div>

        {/* Right Zone: Controls & Dropdowns */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setModelDropdownOpen((prev) => !prev);
                setThemeDropdownOpen(false);
              }}
              aria-label="Model Selector"
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-surface-container-high/90 hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 transition-all text-xs font-mono shadow-xs group"
            >
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0" />
              <span className="font-semibold text-on-surface truncate max-w-[85px] sm:max-w-none">
                {selectedModel.name}
              </span>
              <span className="hidden sm:inline px-1.5 py-0.2 rounded bg-tertiary/20 text-tertiary text-[10px] font-semibold">
                {selectedModel.tag}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-outline transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {modelDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setModelDropdownOpen(false)}
                />
                <div className="absolute right-0 top-11 sm:top-12 z-50 w-72 rounded-2xl bg-surface-container-lowest/98 backdrop-blur-2xl border border-outline-variant/30 shadow-2xl p-2 flex flex-col gap-1 text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-mono text-outline uppercase tracking-wider">
                    Select Inference Engine
                  </div>
                  {AVAILABLE_MODELS.map((m) => {
                    const isSelected = settings.model === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          onUpdateSettings({ model: m.id });
                          setModelDropdownOpen(false);
                        }}
                        className={`flex items-start justify-between gap-2 p-2.5 rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/15 border border-primary/30 text-on-surface'
                            : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-on-surface">{m.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-container-highest text-tertiary font-medium">
                              {m.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-outline leading-tight">{m.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            aria-label="New Chat"
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-secondary-container via-primary-container to-tertiary text-on-primary shadow-xs hover:opacity-95 active:scale-95 transition-all"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-on-primary" />
          </button>

          {/* 6-Theme Palette Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setThemeDropdownOpen((prev) => !prev);
                setModelDropdownOpen(false);
              }}
              aria-label="Theme Menu"
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              title="Change theme palette"
            >
              {settings.theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : settings.theme === 'aurora' ? (
                <Sparkles className="w-4 h-4 text-purple-400" />
              ) : settings.theme === 'ocean' ? (
                <Zap className="w-4 h-4 text-cyan-400" />
              ) : settings.theme === 'emerald' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : settings.theme === 'sunset' ? (
                <Sun className="w-4 h-4 text-rose-400" />
              ) : (
                <Moon className="w-4 h-4 text-primary" />
              )}
            </button>

            {themeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setThemeDropdownOpen(false)}
                />
                <div className="absolute right-0 top-11 sm:top-12 z-50 w-52 rounded-2xl bg-surface-container-lowest/98 backdrop-blur-2xl border border-outline-variant/30 shadow-2xl p-1.5 flex flex-col gap-0.5 text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-mono text-outline uppercase tracking-wider">
                    Color Themes (6)
                  </div>
                  {THEME_OPTIONS.map((t) => {
                    const isSelected = settings.theme === t.id;
                    const IconComp = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ theme: t.id as any });
                          setThemeDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="text-xs">{t.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Model Studio & Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
