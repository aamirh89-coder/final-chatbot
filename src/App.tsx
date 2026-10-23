import { useState, useEffect, useRef } from 'react';
import { useChatStorage } from './hooks/useChatStorage';
import { WorkspaceTab } from './types';
import { TopNav } from './components/TopNav';
import { ConversationsDrawer } from './components/ConversationsDrawer';
import { ChatHub } from './components/ChatHub';
import { CanvasScratchpad } from './components/CanvasScratchpad';
import { SettingsStudio } from './components/SettingsStudio';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { BottomTabBar } from './components/BottomTabBar';

export default function App() {
  const {
    isInitialized,
    conversations,
    activeConversation,
    settings,
    canvasContent,
    storageStats,
    selectConversation,
    createConversation,
    addMessage,
    updateMessage,
    renameConversation,
    togglePinConversation,
    deleteConversation,
    deleteMessage,
    clearAllHistory,
    exportBackupJSON,
    importBackupJSON,
    updateSettings,
    updateCanvasContent,
  } = useChatStorage();

  const [currentTab, setCurrentTab] = useState<WorkspaceTab>('chat');
  // Open sidebar by default on desktop screens for rich studio layout
  const [drawerOpen, setDrawerOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1280 : false;
  });
  const [liveVoiceOpen, setLiveVoiceOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync theme with DOM (supports all 6 themes + system)
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.theme || 'dark';

    if (theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effectiveTheme = isSystemDark ? 'dark' : 'light';
      root.setAttribute('data-theme', effectiveTheme);
      if (isSystemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      root.setAttribute('data-theme', theme);
      if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
      }
    }
  }, [settings.theme]);

  // Global keyboard shortcuts (Cmd+B to toggle drawer)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Dedicated inference execution pipeline (prevents duplicate user messages and cleans history)
  const executeAIResponse = async (
    convId: string,
    promptText: string,
    historySnapshot: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => {
    // Add placeholder assistant message
    const assistantMsg = addMessage(convId, {
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    setIsGenerating(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Filter out empty messages or error placeholder messages from history
    const cleanHistory = historySnapshot
      .filter((m) => m && m.content && m.content.trim() && m.content !== 'No response generated.')
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    try {
      if (settings.streaming) {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: promptText,
            messages: cleanHistory,
            systemInstruction: settings.systemInstruction,
            model: settings.model,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg =
            errData.error ||
            (response.status === 500
              ? 'Server returned status 500. If deployed on Vercel, ensure GEMINI_API_KEY is set in Project Settings > Environment Variables.'
              : `HTTP error! status: ${response.status}`);
          throw new Error(errMsg);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let serverError: string | null = null;

        if (reader) {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6);
                try {
                  const data = JSON.parse(jsonStr);
                  if (data.error) {
                    serverError = data.error;
                    throw new Error(data.error);
                  }
                  if (data.text) {
                    accumulatedText += data.text;
                    updateMessage(convId, assistantMsg.id, {
                      content: accumulatedText,
                      isStreaming: true,
                    });
                  }
                  if (data.done) {
                    break;
                  }
                } catch (parseErr: any) {
                  if (parseErr.message && !parseErr.message.includes('JSON')) {
                    throw parseErr;
                  }
                }
              }
            }
          }
        }

        if (serverError) {
          updateMessage(convId, assistantMsg.id, {
            error: serverError,
            isStreaming: false,
          });
        } else if (!accumulatedText.trim()) {
          updateMessage(convId, assistantMsg.id, {
            error: 'The AI model returned an empty response. Please click Retry Request below.',
            isStreaming: false,
          });
        } else {
          updateMessage(convId, assistantMsg.id, {
            content: accumulatedText,
            isStreaming: false,
          });
        }
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: promptText,
            messages: cleanHistory,
            systemInstruction: settings.systemInstruction,
            model: settings.model,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
          }),
          signal: abortController.signal,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errMsg =
            data.error ||
            (response.status === 500
              ? 'Server returned status 500. If deployed on Vercel, ensure GEMINI_API_KEY is set in Project Settings > Environment Variables.'
              : `HTTP error! status: ${response.status}`);
          throw new Error(errMsg);
        }

        if (data.text) {
          updateMessage(convId, assistantMsg.id, {
            content: data.text,
            isStreaming: false,
          });
        } else {
          updateMessage(convId, assistantMsg.id, {
            error: 'The AI model returned an empty response. Please click Retry Request below.',
            isStreaming: false,
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateMessage(convId, assistantMsg.id, {
          isStreaming: false,
        });
      } else {
        console.error('Inference error:', err);
        updateMessage(convId, assistantMsg.id, {
          error: err.message || 'Unable to connect to Gemini API. Please click Retry Request.',
          isStreaming: false,
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Send new user prompt
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    let convId = activeConversation?.id;
    if (!convId) {
      const newConv = createConversation('New Chat');
      convId = newConv.id;
    }

    addMessage(convId, {
      role: 'user',
      content: text.trim(),
    });

    const currentMessages = activeConversation?.id === convId ? activeConversation.messages : [];
    const historySnapshot = [
      ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text.trim() },
    ];

    await executeAIResponse(convId, text.trim(), historySnapshot);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Regenerate last response without duplicating user prompt
  const handleRegenerate = async () => {
    if (!activeConversation || isGenerating) return;
    const msgs = activeConversation.messages;
    if (msgs.length === 0) return;

    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const userMsg = msgs[lastUserIndex];
    const convId = activeConversation.id;

    // Delete the assistant message that followed this user message (if present)
    if (msgs.length > lastUserIndex + 1) {
      deleteMessage(convId, msgs[lastUserIndex + 1].id);
    }

    // Build history up to and including the user message
    const historySnapshot = msgs.slice(0, lastUserIndex + 1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await executeAIResponse(convId, userMsg.content, historySnapshot);
  };

  // Edit previous user prompt and resubmit without duplicate messages
  const handleEditMessage = async (msgId: string, newContent: string) => {
    if (!activeConversation || isGenerating) return;
    const convId = activeConversation.id;
    const msgs = activeConversation.messages;
    const targetIdx = msgs.findIndex((m) => m.id === msgId);

    if (targetIdx === -1) return;

    updateMessage(convId, msgId, { content: newContent });

    for (let i = targetIdx + 1; i < msgs.length; i++) {
      deleteMessage(convId, msgs[i].id);
    }

    const historySnapshot = [
      ...msgs.slice(0, targetIdx).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: newContent },
    ];

    await executeAIResponse(convId, newContent, historySnapshot);
  };

  const handleNewChat = () => {
    createConversation('New Chat');
    setCurrentTab('chat');
    if (window.innerWidth < 1024) {
      setDrawerOpen(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface text-on-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-outline">Starting Gemini AI Studio...</span>
        </div>
      </div>
    );
  }

  // Dynamic aura glow per theme
  const auraGlow =
    settings.theme === 'light'
      ? 'from-indigo-200/40 via-purple-100/30 to-sky-100/30'
      : settings.theme === 'aurora'
      ? 'from-purple-900/40 via-fuchsia-900/25 to-cyan-900/30'
      : settings.theme === 'ocean'
      ? 'from-cyan-950/40 via-blue-900/30 to-sky-950/25'
      : settings.theme === 'emerald'
      ? 'from-emerald-950/40 via-teal-900/30 to-green-950/25'
      : settings.theme === 'sunset'
      ? 'from-rose-950/40 via-amber-950/30 to-purple-950/25'
      : 'from-indigo-900/30 via-purple-900/20 to-cyan-900/25';

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface text-on-surface font-sans relative selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Ambient Luminescent Glow Fields */}
      <div className={`fixed -top-32 left-1/4 w-[550px] h-[450px] bg-gradient-to-tr ${auraGlow} blur-[120px] pointer-events-none -z-10 rounded-full transition-colors duration-500`} />
      <div className="fixed top-1/2 -right-24 w-[450px] h-[450px] bg-gradient-to-br from-primary/10 via-tertiary/10 to-transparent blur-[130px] pointer-events-none -z-10 rounded-full transition-colors duration-500" />

      {/* Top Bar Header */}
      <TopNav
        currentTab={currentTab}
        settings={settings}
        activeTitle={activeConversation?.title}
        onToggleDrawer={() => setDrawerOpen((prev) => !prev)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setCurrentTab('settings')}
        onChangeTab={setCurrentTab}
        onUpdateSettings={updateSettings}
      />

      <div className="flex-1 flex w-full relative">
        {/* Collapsible Left Conversations Sidebar / Drawer */}
        <ConversationsDrawer
          isOpen={drawerOpen}
          currentTab={currentTab}
          onClose={() => setDrawerOpen(false)}
          conversations={conversations}
          activeId={activeConversation?.id || null}
          storageStats={storageStats}
          onSelect={(id) => {
            selectConversation(id);
            setCurrentTab('chat');
          }}
          onNewChat={handleNewChat}
          onRename={renameConversation}
          onTogglePin={togglePinConversation}
          onDelete={deleteConversation}
          onClearAll={clearAllHistory}
          onExport={exportBackupJSON}
          onChangeTab={setCurrentTab}
          onOpenLiveVoice={() => setLiveVoiceOpen(true)}
        />

        {/* Main Workspace Body */}
        <main
          className={`flex-1 flex flex-col w-full relative transition-all duration-300 ${
            drawerOpen ? 'lg:pl-[320px]' : ''
          }`}
        >
          {currentTab === 'chat' && (
            <ChatHub
              activeConversation={activeConversation}
              settings={settings}
              isGenerating={isGenerating}
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              onRegenerate={handleRegenerate}
              onEditMessage={handleEditMessage}
              onDeleteMessage={(msgId) => {
                if (activeConversation) deleteMessage(activeConversation.id, msgId);
              }}
              onSelectPrompt={(p) => handleSendMessage(p)}
            />
          )}

          {currentTab === 'canvas' && (
            <CanvasScratchpad
              content={canvasContent}
              onChange={updateCanvasContent}
              onSendToChat={(prompt) => {
                setCurrentTab('chat');
                handleSendMessage(prompt);
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsStudio
              settings={settings}
              storageStats={storageStats}
              onUpdateSettings={updateSettings}
              onExport={exportBackupJSON}
              onImport={importBackupJSON}
              onClearHistory={clearAllHistory}
              onClose={() => setCurrentTab('chat')}
            />
          )}
        </main>
      </div>

      {/* Live Voice Audio Modal */}
      <LiveVoiceModal
        isOpen={liveVoiceOpen}
        onClose={() => setLiveVoiceOpen(false)}
        settings={settings}
        onSendPrompt={(p) => {
          setCurrentTab('chat');
          handleSendMessage(p);
        }}
      />

      {/* Mobile Only Navigation Bar - Shown only when outside chat to prevent double bottom bar on mobile */}
      {currentTab !== 'chat' && (
        <div className="block lg:hidden">
          <BottomTabBar
            currentTab={currentTab}
            onChangeTab={(tab) => {
              setCurrentTab(tab);
            }}
            onOpenLiveVoice={() => setLiveVoiceOpen(true)}
          />
        </div>
      )}
    </div>
  );
}
