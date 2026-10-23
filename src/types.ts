export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  messages: ChatMessage[];
}

export interface AppSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemInstruction: string;
  theme: 'dark' | 'light' | 'aurora' | 'ocean' | 'emerald' | 'sunset' | 'system';
  streaming: boolean;
}

export type WorkspaceTab = 'chat' | 'canvas' | 'settings';

export interface StorageStats {
  sessionsCount: number;
  messagesCount: number;
  usedBytes: number;
  formattedSize: string;
  percentUsed: number;
}
