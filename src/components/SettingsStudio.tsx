import React, { useRef, useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Monitor,
  CheckCircle,
  Radio,
  Zap,
} from 'lucide-react';
import { AppSettings, StorageStats } from '../types';

interface SettingsStudioProps {
  settings: AppSettings;
  storageStats: StorageStats;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onExport: () => void;
  onImport: (jsonString: string) => { success: boolean; message: string };
  onClearHistory: () => void;
  onClose: () => void;
}

const DEFAULT_PERSONA =
  'You are an expert full-stack developer assistant specializing in Next.js, React, TypeScript, and modern UI engineering.';

export const SettingsStudio: React.FC<SettingsStudioProps> = ({
  settings,
  storageStats,
  onUpdateSettings,
  onExport,
  onImport,
  onClearHistory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = onImport(content);
        showToast(res.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6 text-on-surface">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-highest border border-primary/40 text-primary text-xs font-mono shadow-xl animate-bounce">
          <CheckCircle className="w-4 h-4 text-tertiary" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative bg-surface-container-low rounded-2xl p-4 sm:p-5 shadow-md border border-outline-variant/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-32 bg-primary/10 blur-3xl pointer-events-none rounded-full" />
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-on-surface">Model Studio</h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono font-semibold">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono">
                Runtime hyperparameters & client memory state
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-tertiary">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Section 1: API & Model Configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-base font-bold tracking-tight text-on-surface">
            API & Model Configuration
          </h3>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 sm:p-5 shadow-sm space-y-5 border border-outline-variant/20">
          {/* Target Model Radios */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface uppercase tracking-wider font-mono">
                Target Architecture
              </label>
              <span className="text-[11px] font-mono text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full font-medium">
                Gemini 3.8
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Gemini 3.8 Flash */}
              <div
                onClick={() => {
                  onUpdateSettings({ model: 'gemini-3.8-flash' });
                  showToast('Active model changed to Gemini 3.8 Flash');
                }}
                className={`relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  settings.model === 'gemini-3.8-flash'
                    ? 'bg-surface-container-high border-primary/50 shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container-high/60 border-outline-variant/20'
                }`}
              >
                <Radio
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    settings.model === 'gemini-3.8-flash' ? 'text-primary fill-primary' : 'text-outline'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-on-surface">Gemini 3.8 Flash</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary">
                      Fast
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Flagship free-tier model with deep context & code capabilities.
                  </p>
                </div>
              </div>

              {/* Gemini 3.1 Flash Lite */}
              <div
                onClick={() => {
                  onUpdateSettings({ model: 'gemini-3.1-flash-lite' });
                  showToast('Active model changed to Gemini 3.1 Flash Lite');
                }}
                className={`relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  settings.model === 'gemini-3.1-flash-lite'
                    ? 'bg-surface-container-high border-tertiary/50 shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container-high/60 border-outline-variant/20'
                }`}
              >
                <Radio
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    settings.model === 'gemini-3.1-flash-lite' ? 'text-tertiary fill-tertiary' : 'text-outline'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-on-surface">Gemini 3.1 Lite</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-tertiary/20 text-tertiary">
                      Ultra-Fast
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Lightweight, high-availability model resilient during traffic spikes.
                  </p>
                </div>
              </div>

              {/* Gemini 4 Argon */}
              <div
                onClick={() => {
                  onUpdateSettings({ model: 'gemini-4-argon' });
                  showToast('Active model changed to Gemini 4 Argon');
                }}
                className={`relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  settings.model === 'gemini-4-argon'
                    ? 'bg-surface-container-high border-secondary/50 shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container-high/60 border-outline-variant/20'
                }`}
              >
                <Radio
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    settings.model === 'gemini-4-argon' ? 'text-secondary fill-secondary' : 'text-outline'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-on-surface">Gemini 4 Argon</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container">
                      Pro
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Complex multi-turn analytical reasoning and deep synthesis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Server-Side Protected Key Card */}
          <div className="rounded-xl bg-surface-container-lowest p-3.5 border border-outline-variant/20 shadow-inner flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-tertiary" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-mono font-medium text-on-surface">GEMINI_API_KEY</span>
                <span className="text-[10px] font-mono bg-primary-container/20 text-primary px-2 py-0.5 rounded-full">
                  Server Protected
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Loaded securely via runtime host (<code className="text-primary font-mono">server.ts</code>). Secrets are zero-leaked and never exposed to browser memory.
              </p>
            </div>
          </div>

          {/* Streaming Mode Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <label className="text-xs font-semibold text-on-surface block">
                Real-Time SSE Token Streaming
              </label>
              <p className="text-[11px] text-on-surface-variant">
                Stream words progressively as Gemini outputs tokens.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ streaming: !settings.streaming });
                showToast(`Streaming ${!settings.streaming ? 'enabled' : 'disabled'}`);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.streaming ? 'bg-primary' : 'bg-surface-variant'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.streaming ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-on-surface block">
                  Temperature
                </label>
                <p className="text-[11px] text-on-surface-variant">Balanced creativity & precision</p>
              </div>
              <span className="font-mono text-xs font-semibold bg-surface-container-high px-2 py-0.5 rounded-lg text-primary border border-outline-variant/30">
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] font-mono text-outline">
              <span>0.0 (Deterministic)</span>
              <span>1.0 (Inventive)</span>
            </div>
          </div>

          {/* Max Output Tokens Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-on-surface block">
                  Max Output Tokens
                </label>
                <p className="text-[11px] text-on-surface-variant">Upper constraint per completion</p>
              </div>
              <span className="font-mono text-xs font-semibold bg-surface-container-high px-2 py-0.5 rounded-lg text-secondary border border-outline-variant/30">
                {settings.maxTokens}
              </span>
            </div>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={settings.maxTokens}
              onChange={(e) => onUpdateSettings({ maxTokens: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-secondary"
            />
            <div className="flex justify-between text-[10px] font-mono text-outline">
              <span>256</span>
              <span>4096</span>
              <span>8192</span>
            </div>
          </div>

          {/* System Instructions / Persona Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface block">
                System Persona & Instructions
              </label>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ systemInstruction: DEFAULT_PERSONA });
                  showToast('Persona instructions reset to default.');
                }}
                className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
            <div className="relative rounded-xl bg-surface-container-lowest p-2.5 border border-outline-variant/30 focus-within:border-primary/50 transition-colors">
              <textarea
                rows={3}
                value={settings.systemInstruction}
                onChange={(e) => onUpdateSettings({ systemInstruction: e.target.value })}
                placeholder="Define custom model behavior instructions..."
                className="w-full bg-transparent font-mono text-xs text-on-surface resize-none focus:outline-none placeholder:text-outline leading-relaxed"
              />
              <div className="flex justify-between items-center pt-1 text-[10px] font-mono text-outline">
                <span>Appended to model system prologue</span>
                <span>{settings.systemInstruction.length} chars</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Local Storage & Data Management */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-base font-bold tracking-tight text-on-surface">
            Local Storage & Data
          </h3>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 border border-outline-variant/20">
          {/* Quota Health Meter */}
          <div className="bg-surface-container-low rounded-xl p-3.5 space-y-2 border border-outline-variant/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-on-surface">Client Storage Quota</span>
              <span className="text-xs font-mono font-semibold text-tertiary">
                {storageStats.formattedSize} / 5 MB
              </span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-secondary to-tertiary rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, storageStats.percentUsed)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="bg-surface-container p-2 rounded-lg border border-outline-variant/10">
                <span className="block text-base font-bold text-on-surface">
                  {storageStats.sessionsCount}
                </span>
                <span className="block text-[10px] text-outline">Sessions</span>
              </div>
              <div className="bg-surface-container p-2 rounded-lg border border-outline-variant/10">
                <span className="block text-base font-bold text-on-surface">
                  {storageStats.messagesCount}
                </span>
                <span className="block text-[10px] text-outline">Messages</span>
              </div>
              <div className="bg-surface-container p-2 rounded-lg border border-outline-variant/10">
                <span className="block text-base font-bold text-tertiary">
                  {Math.round(storageStats.usedBytes / 1024)}
                </span>
                <span className="block text-[10px] text-outline">Kilobytes</span>
              </div>
            </div>
          </div>

          {/* Quick Storage Actions */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExport}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-medium transition-all border border-outline-variant/30"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-medium transition-all border border-outline-variant/30"
              >
                <Upload className="w-3.5 h-3.5 text-tertiary" />
                <span>Import Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
                  onClearHistory();
                  showToast('All chat history wiped from local storage.');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-error-container/30 hover:bg-error-container/50 text-error text-xs font-semibold transition-all border border-error/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Chat History</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Appearance & Interaction */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-base font-bold tracking-tight text-on-surface">
            Appearance & Interaction
          </h3>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 border border-outline-variant/20">
          {/* Theme Palette Switcher with 6 Themes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface block uppercase tracking-wider font-mono">
                Interface Color Themes
              </label>
              <span className="text-[11px] font-mono text-primary font-medium capitalize">
                Active: {settings.theme}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'dark',
                  name: 'Midnight Dark',
                  desc: 'Deep obsidian with ethereal purple glow',
                  bg: '#090a0f',
                  border: '#32364a',
                  dots: ['#818cf8', '#d0bcff', '#38bdf8'],
                },
                {
                  id: 'light',
                  name: 'Premium Light',
                  desc: 'Clean alabaster glass with crisp slate text',
                  bg: '#f8fafc',
                  border: '#cbd5e1',
                  dots: ['#4f46e5', '#7c3aed', '#0284c7'],
                },
                {
                  id: 'aurora',
                  name: 'Glass Aurora',
                  desc: 'Astral violet with magenta & cyan shimmer',
                  bg: '#09071a',
                  border: '#372b7d',
                  dots: ['#c084fc', '#f472b6', '#22d3ee'],
                },
                {
                  id: 'ocean',
                  name: 'Ocean Blue',
                  desc: 'Deep maritime navy with electric cyan',
                  bg: '#06121f',
                  border: '#274d7c',
                  dots: ['#38bdf8', '#60a5fa', '#2dd4bf'],
                },
                {
                  id: 'emerald',
                  name: 'Emerald Matrix',
                  desc: 'Forest jade with mint & cyber seafoam',
                  bg: '#051510',
                  border: '#225646',
                  dots: ['#34d399', '#6ee7b7', '#a7f3d0'],
                },
                {
                  id: 'sunset',
                  name: 'Sunset Glow',
                  desc: 'Dusky twilight with rose gold & amber',
                  bg: '#180e1a',
                  border: '#573661',
                  dots: ['#fb7185', '#f59e0b', '#c084fc'],
                },
              ].map((themeItem) => {
                const isSelected = settings.theme === themeItem.id;
                return (
                  <div
                    key={themeItem.id}
                    onClick={() => {
                      onUpdateSettings({ theme: themeItem.id as any });
                      showToast(`${themeItem.name} theme activated.`);
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-surface-container-high border-primary ring-1 ring-primary/40 shadow-sm'
                        : 'bg-surface-container-low hover:bg-surface-container-high/60 border-outline-variant/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Swatch Preview Pill */}
                      <div
                        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center shadow-xs border"
                        style={{ backgroundColor: themeItem.bg, borderColor: themeItem.border }}
                      >
                        <div className="flex items-center -space-x-1">
                          {themeItem.dots.map((d, i) => (
                            <span
                              key={i}
                              className="w-2 h-2 rounded-full ring-1 ring-black/40"
                              style={{ backgroundColor: d }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-on-surface block truncate">
                          {themeItem.name}
                        </span>
                        <span className="text-[10px] text-on-surface-variant truncate block">
                          {themeItem.desc}
                        </span>
                      </div>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* System Theme Option */}
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ theme: 'system' });
                showToast('System auto-match activated.');
              }}
              className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono transition-all ${
                settings.theme === 'system'
                  ? 'bg-surface-container-high border-primary text-primary font-semibold'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border-outline-variant/20'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Sync Automatically with OS System Theme</span>
            </button>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-on-surface block">
              Interaction Shortcuts
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-outline-variant/15">
                <span className="text-on-surface-variant">Send Message</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-container-high text-primary shadow-xs border border-outline-variant/30">
                  Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-outline-variant/15">
                <span className="text-on-surface-variant">Insert Multiline Linebreak</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                    Shift
                  </kbd>
                  <span className="text-outline">+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                    Enter
                  </kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-outline-variant/15">
                <span className="text-on-surface-variant">Open Thread Drawer</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-container-high text-secondary shadow-xs border border-outline-variant/30">
                  ⌘ Cmd + B
                </kbd>
              </div>
            </div>
          </div>

          {/* Engine Spec Footer */}
          <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-tertiary shrink-0 animate-pulse" />
              <p className="text-[11px] font-mono text-on-surface-variant truncate">
                Gemini 3.8 Flash • Node Express SSE • React 19
              </p>
            </div>
            <span className="text-[10px] font-mono text-primary bg-primary/20 px-2 py-0.5 rounded shrink-0 font-semibold">
              STABLE
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
