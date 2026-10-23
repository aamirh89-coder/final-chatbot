import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  Square,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  Bolt,
  Code2,
  Palette,
  Bug,
  GitBranch,
  Shield,
  Save,
  ChevronDown,
  CornerDownLeft,
} from 'lucide-react';
import { Conversation, AppSettings } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatHubProps {
  activeConversation: Conversation | null;
  settings: AppSettings;
  isGenerating: boolean;
  onSendMessage: (text: string) => void;
  onStopGeneration: () => void;
  onRegenerate: () => void;
  onEditMessage: (msgId: string, newContent: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onSelectPrompt: (promptText: string) => void;
}

const SUGGESTIONS = [
  {
    category: 'Architecture',
    icon: Bolt,
    iconColor: 'text-tertiary',
    title: 'Explain Next.js 14 App Router vs Pages Router with server components',
    tagColor: 'text-tertiary',
  },
  {
    category: 'React • TS',
    icon: Code2,
    iconColor: 'text-primary',
    title: 'Write a TypeScript hook for Local Storage persistence with SSR safety',
    tagColor: 'text-primary',
  },
  {
    category: 'Design Systems',
    icon: Palette,
    iconColor: 'text-secondary',
    title: 'Create an ethereal glassmorphism Tailwind color palette and tokens',
    tagColor: 'text-secondary',
  },
  {
    category: 'Debugging',
    icon: Bug,
    iconColor: 'text-error',
    title: 'Debug an async API edge timeout error in Next.js route handlers',
    tagColor: 'text-error',
  },
];

export const ChatHub: React.FC<ChatHubProps> = ({
  activeConversation,
  settings,
  isGenerating,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onEditMessage,
  onDeleteMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation?.messages || [];
  const hasMessages = messages.length > 0;

  // Auto-scroll to bottom smoothly on new content if close to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages, isGenerating, showScrollBottom, scrollToBottom]);

  // Track scroll position to show floating "Scroll to bottom" button
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  // Adjust textarea height automatically up to 120px
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    // Force instant scroll to bottom on submission
    setTimeout(() => scrollToBottom('smooth'), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceToggle = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsRecording(false);
    }
  };

  // Greeting by hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning, Architect'
      : currentHour < 18
      ? 'Good afternoon, Architect'
      : 'Good evening, Architect';

  return (
    <div className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] max-w-4xl mx-auto px-2 sm:px-6 overflow-hidden relative">
      {/* Scrollable Conversation Stream or Hero Welcome */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-1 sm:px-2 pt-3 sm:pt-6 pb-2 space-y-6 scroll-smooth"
      >
        {!hasMessages ? (
          /* ZERO-STATE / HERO SECTION */
          <div className="flex flex-col items-center text-center max-w-xl mx-auto pt-2 sm:pt-8 pb-4 select-none">
            {/* Ambient Aura Emblem */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-4 sm:mb-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-secondary via-primary to-tertiary opacity-35 blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-surface-container-high/85 backdrop-blur-2xl flex items-center justify-center shadow-2xl border border-white/15">
                <Sparkles className="w-10 h-10 sm:w-11 sm:h-11 text-primary animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-tertiary animate-ping" />
              <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-secondary" />
            </div>

            {/* Active Model Ribbon Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-xl border border-outline-variant/30 shadow-xs mb-3 sm:mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
              </span>
              <span className="font-mono text-xs text-tertiary font-semibold tracking-wide">
                {settings.model}
              </span>
              <span className="text-outline text-xs">•</span>
              <span className="font-mono text-[11px] text-on-surface-variant font-medium">
                Live Sub-Second Stream
              </span>
            </div>

            {/* Personalized Greeting */}
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-on-surface mb-2">
              {greeting}
            </h1>
            <p className="text-xs sm:text-sm max-w-md text-on-surface-variant leading-relaxed mb-6 sm:mb-8 px-2">
              Explore complex code architectures, build scalable UI systems, or debug edge workflows with Gemini.
            </p>

            {/* Suggested Prompts Grid */}
            <div className="w-full flex flex-col gap-2 mb-6 sm:mb-8 text-left">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[11px] font-mono text-outline uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Suggested Prompts
                </span>
                <span className="text-[11px] font-mono text-outline-variant">Tap to launch</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSendMessage(item.title)}
                      className="group relative w-full text-left p-3 rounded-2xl bg-surface-container/70 hover:bg-surface-container-high/80 active:scale-[0.99] transition-all duration-200 border border-outline-variant/25 shadow-xs backdrop-blur-xl overflow-hidden cursor-pointer flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 border border-outline-variant/30 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors shadow-xs mt-0.5">
                        <IconComponent className={`w-4 h-4 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-[10px] font-mono font-semibold ${item.tagColor}`}>
                            {item.category}
                          </span>
                          <span className="text-xs text-outline group-hover:text-primary transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </div>
                        <p className="text-xs text-on-surface font-medium line-clamp-2 leading-snug">
                          {item.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trust and Safety Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-on-surface-variant">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high/50 border border-outline-variant/20 shadow-xs">
                <Bolt className="w-3 h-3 text-tertiary" />
                <span>Zero-Latency Stream</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high/50 border border-outline-variant/20 shadow-xs">
                <Shield className="w-3 h-3 text-primary" />
                <span>Server-Side Protected Key</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high/50 border border-outline-variant/20 shadow-xs">
                <Save className="w-3 h-3 text-secondary" />
                <span>Browser Local Storage</span>
              </div>
            </div>
          </div>
        ) : (
          /* CONVERSATION STREAM */
          <div className="flex flex-col gap-6">
            {/* Session Breadcrumb Watermark */}
            <div className="flex items-center justify-between py-1.5 border-b border-outline-variant/15 text-xs font-mono text-on-surface-variant select-none">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high/70 border border-outline-variant/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  <span>Session #{activeConversation?.id ? activeConversation.id.slice(0, 8) : 'active'}</span>
                </span>
                <span className="truncate max-w-[180px] sm:max-w-xs">{activeConversation?.title || 'Active Chat'}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSendMessage('Continue and expand with further architectural details.')}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors disabled:opacity-40"
                  title="Branch conversation"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Continue</span>
                </button>
              </div>
            </div>

            {/* Render Message List */}
            {messages.map((message, index) => {
              const isLastModel =
                message.role === 'assistant' && index === messages.length - 1;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLastModelMessage={isLastModel}
                  isGenerating={isGenerating}
                  onRegenerate={isLastModel ? onRegenerate : undefined}
                  onEditSubmit={
                    message.role === 'user'
                      ? (newText) => onEditMessage(message.id, newText)
                      : undefined
                  }
                  onDelete={() => onDeleteMessage(message.id)}
                />
              );
            })}

            {/* Generative Pulsing Indicator */}
            {isGenerating && (
              <div className="flex items-center gap-3 pl-1 sm:pl-10 py-1.5 text-xs font-mono text-on-surface-variant">
                <div className="w-7 h-7 rounded-xl bg-surface-container-high flex items-center justify-center border border-white/10 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-tertiary animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="italic font-medium text-on-surface">Gemini is synthesizing</span>
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-bounce" style={{ animationDelay: '180ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '360ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Indicator Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          aria-label="Scroll to bottom"
          className="absolute bottom-20 right-6 sm:right-8 z-20 w-9 h-9 rounded-full bg-surface-container-high/95 text-on-surface hover:text-primary shadow-lg border border-outline-variant/40 flex items-center justify-center transition-all animate-bounce backdrop-blur-md active:scale-95"
          title="Scroll to latest message"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* ANCHORED CHAT PROMPT INPUT BAR */}
      <div className="shrink-0 w-full pt-1 pb-3 sm:pb-4 px-1 pb-[env(safe-area-inset-bottom,0.75rem)] z-30">
        <form
          onSubmit={handleSubmit}
          className="w-full flex items-end gap-1.5 sm:gap-2 p-2 sm:p-2.5 bg-surface-container-low/95 backdrop-blur-3xl rounded-2xl sm:rounded-3xl border border-outline-variant/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
        >
          {/* Attach text / prompt snippet */}
          <button
            type="button"
            onClick={() => {
              const sample = prompt('Paste code snippet or prompt notes:');
              if (sample) {
                setInputText((prev) => (prev ? `${prev}\n\n\`\`\`\n${sample}\n\`\`\`` : `\`\`\`\n${sample}\n\`\`\``));
                textareaRef.current?.focus();
              }
            }}
            aria-label="Attach code or snippet"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-outline hover:text-on-surface rounded-xl hover:bg-surface-container transition-colors shrink-0"
            title="Attach text snippet or code block"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Dynamic Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Gemini anything... (Enter to send, Shift+Enter for newline)"
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm sm:text-[15px] text-on-surface placeholder:text-outline py-2 max-h-32 focus:ring-0 leading-relaxed font-sans"
          />

          {/* Voice Dictation Button */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            aria-label="Voice input"
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
              isRecording
                ? 'bg-error text-on-error animate-pulse'
                : 'text-outline hover:text-on-surface hover:bg-surface-container'
            }`}
            title={isRecording ? 'Listening... click to stop' : 'Voice input'}
          >
            {isRecording ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Send / Stop Action Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              aria-label="Stop generation"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-error-container text-on-error-container hover:bg-error-container/80 flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 font-mono text-xs"
              title="Stop response generation"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Send message"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                inputText.trim()
                  ? 'bg-gradient-to-tr from-secondary-container via-primary-container to-tertiary text-on-primary shadow-[0_0_16px_rgba(128,131,255,0.45)] hover:opacity-95 active:scale-95'
                  : 'bg-surface-container-high text-outline cursor-not-allowed'
              }`}
              title="Send message"
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-on-primary" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-mono text-outline select-none">
          <span className="truncate">Gemini can make mistakes. Verify critical code before production.</span>
          <span className="hidden sm:inline-flex items-center gap-1 shrink-0">
            <CornerDownLeft className="w-2.5 h-2.5" /> Enter to send
          </span>
        </div>
      </div>
    </div>
  );
};
