import { useState, useEffect, useCallback, useMemo } from 'react';
import { Conversation, ChatMessage, AppSettings, StorageStats } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'gemini_chat_conversations_v1',
  ACTIVE_ID: 'gemini_chat_active_id_v1',
  SETTINGS: 'gemini_chat_settings_v1',
  CANVAS_NOTE: 'gemini_canvas_content_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  model: 'gemini-3.1-flash-lite',
  temperature: 0.7,
  maxTokens: 2048,
  systemInstruction:
    'You are an expert full-stack developer assistant specializing in Next.js, React, TypeScript, and modern UI engineering.',
  theme: 'dark',
  streaming: true,
};

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function useChatStorage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [canvasContent, setCanvasContent] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize from LocalStorage safely on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      }

      const storedConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      let parsedConvs: Conversation[] = [];
      if (storedConvs) {
        parsedConvs = JSON.parse(storedConvs);
        if (Array.isArray(parsedConvs)) {
          setConversations(parsedConvs);
        }
      }

      const storedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
      if (storedActiveId && parsedConvs.some((c) => c.id === storedActiveId)) {
        setActiveId(storedActiveId);
      } else if (parsedConvs.length > 0) {
        setActiveId(parsedConvs[0].id);
      }

      const storedCanvas = localStorage.getItem(STORAGE_KEYS.CANVAS_NOTE);
      if (storedCanvas) {
        setCanvasContent(storedCanvas);
      }
    } catch (err) {
      console.warn('Failed to load chat history from LocalStorage:', err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync conversations to LocalStorage
  const persistConversations = useCallback((updated: Conversation[]) => {
    setConversations(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to write conversations to LocalStorage:', err);
    }
  }, []);

  // Sync settings
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      } catch (err) {
        console.error('Failed to save settings:', err);
      }
      return merged;
    });
  }, []);

  // Sync canvas
  const updateCanvasContent = useCallback((content: string) => {
    setCanvasContent(content);
    try {
      localStorage.setItem(STORAGE_KEYS.CANVAS_NOTE, content);
    } catch (err) {
      console.error('Failed to save canvas:', err);
    }
  }, []);

  // Set active conversation ID and persist
  const selectConversation = useCallback((id: string | null) => {
    setActiveId(id);
    if (id) {
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
      } catch (e) {
        console.error('Error saving active ID:', e);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(
    (initialTitle = 'New Chat'): Conversation => {
      const newConv: Conversation = {
        id: generateId(),
        title: initialTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };

      setConversations((prev) => {
        const next = [newConv, ...prev];
        persistConversations(next);
        return next;
      });
      selectConversation(newConv.id);
      return newConv;
    },
    [persistConversations, selectConversation]
  );

  // Add message to current or specific conversation
  const addMessage = useCallback(
    (convId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
      const fullMessage: ChatMessage = {
        ...message,
        id: generateId(),
        timestamp: Date.now(),
      };

      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id !== convId) return conv;

          // If title is default and this is first user message, auto-title from message
          let newTitle = conv.title;
          if (
            (conv.title === 'New Chat' || conv.messages.length === 0) &&
            message.role === 'user' &&
            message.content
          ) {
            newTitle = message.content.slice(0, 36).trim();
            if (message.content.length > 36) newTitle += '...';
          }

          return {
            ...conv,
            title: newTitle,
            updatedAt: Date.now(),
            messages: [...conv.messages, fullMessage],
          };
        });

        // Re-sort so most recently updated is near top (keeping pinned at very top)
        updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.updatedAt - a.updatedAt;
        });

        persistConversations(updated);
        return updated;
      });

      return fullMessage;
    },
    [persistConversations]
  );

  // Update a message (for streaming text append or error status)
  const updateMessage = useCallback(
    (convId: string, msgId: string, updates: Partial<ChatMessage>) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id !== convId) return conv;
          const newMessages = conv.messages.map((m) => {
            if (m.id !== msgId) return m;
            return { ...m, ...updates };
          });
          return {
            ...conv,
            updatedAt: Date.now(),
            messages: newMessages,
          };
        });
        persistConversations(updated);
        return updated;
      });
    },
    [persistConversations]
  );

  // Rename a conversation
  const renameConversation = useCallback(
    (id: string, newTitle: string) => {
      const clean = newTitle.trim() || 'Untitled Session';
      setConversations((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, title: clean, updatedAt: Date.now() } : c));
        persistConversations(updated);
        return updated;
      });
    },
    [persistConversations]
  );

  // Toggle pin
  const togglePinConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c));
        updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.updatedAt - a.updatedAt;
        });
        persistConversations(updated);
        return updated;
      });
    },
    [persistConversations]
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        persistConversations(updated);
        if (activeId === id) {
          const nextActive = updated.length > 0 ? updated[0].id : null;
          selectConversation(nextActive);
        }
        return updated;
      });
    },
    [activeId, persistConversations, selectConversation]
  );

  // Delete an individual message
  const deleteMessage = useCallback(
    (convId: string, msgId: string) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id !== convId) return conv;
          return {
            ...conv,
            updatedAt: Date.now(),
            messages: conv.messages.filter((m) => m.id !== msgId),
          };
        });
        persistConversations(updated);
        return updated;
      });
    },
    [persistConversations]
  );

  // Clear all chat history
  const clearAllHistory = useCallback(() => {
    persistConversations([]);
    selectConversation(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  }, [persistConversations, selectConversation]);

  // Export conversations to JSON backup
  const exportBackupJSON = useCallback(() => {
    const payload = {
      app: 'Gemini AI Chat Studio',
      exportedAt: new Date().toISOString(),
      version: '1.0',
      settings,
      conversations,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gemini-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [conversations, settings]);

  // Import conversations from JSON backup
  const importBackupJSON = useCallback(
    (jsonString: string): { success: boolean; message: string } => {
      try {
        const data = JSON.parse(jsonString);
        let importedConvs: Conversation[] = [];

        if (Array.isArray(data)) {
          importedConvs = data;
        } else if (data && Array.isArray(data.conversations)) {
          importedConvs = data.conversations;
          if (data.settings) {
            updateSettings(data.settings);
          }
        } else {
          return { success: false, message: 'Invalid backup file structure.' };
        }

        // Validate basic items
        const sanitized: Conversation[] = importedConvs
          .filter((c) => c && typeof c.id === 'string' && typeof c.title === 'string')
          .map((c) => ({
            id: c.id || generateId(),
            title: c.title || 'Imported Session',
            createdAt: c.createdAt || Date.now(),
            updatedAt: c.updatedAt || Date.now(),
            pinned: Boolean(c.pinned),
            messages: Array.isArray(c.messages) ? c.messages : [],
          }));

        if (sanitized.length === 0) {
          return { success: false, message: 'No valid conversation threads found.' };
        }

        persistConversations(sanitized);
        selectConversation(sanitized[0].id);
        return {
          success: true,
          message: `Successfully imported ${sanitized.length} conversations.`,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Failed to parse JSON file.',
        };
      }
    },
    [persistConversations, selectConversation, updateSettings]
  );

  // Compute storage statistics
  const storageStats = useMemo<StorageStats>(() => {
    let bytes = 0;
    let messagesCount = 0;

    for (const c of conversations) {
      messagesCount += c.messages.length;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS) || '';
      bytes = new Blob([stored]).size;
    } catch {
      bytes = 0;
    }

    const kb = bytes / 1024;
    const formattedSize = kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(kb))} KB`;
    const maxQuotaBytes = 5 * 1024 * 1024; // 5 MB standard localStorage capacity
    const percentUsed = Math.min(100, Math.max(0.5, (bytes / maxQuotaBytes) * 100));

    return {
      sessionsCount: conversations.length,
      messagesCount,
      usedBytes: bytes,
      formattedSize,
      percentUsed: parseFloat(percentUsed.toFixed(1)),
    };
  }, [conversations]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeId) || null;
  }, [conversations, activeId]);

  return {
    isInitialized,
    conversations,
    activeConversation,
    activeId,
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
  };
}
