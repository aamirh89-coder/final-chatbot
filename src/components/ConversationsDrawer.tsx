import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  MessageSquare,
  MoreVertical,
  Edit2,
  Download,
  Pin,
  Trash2,
  Database,
  Trash,
  Check,
  FolderOpen,
  Edit3,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Conversation, StorageStats, WorkspaceTab } from '../types';

interface ConversationsDrawerProps {
  isOpen: boolean;
  currentTab: WorkspaceTab;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  storageStats: StorageStats;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onExport: () => void;
  onChangeTab: (tab: WorkspaceTab) => void;
  onOpenLiveVoice: () => void;
}

export const ConversationsDrawer: React.FC<ConversationsDrawerProps> = ({
  isOpen,
  currentTab,
  onClose,
  conversations,
  activeId,
  storageStats,
  onSelect,
  onNewChat,
  onRename,
  onTogglePin,
  onDelete,
  onClearAll,
  onExport,
  onChangeTab,
  onOpenLiveVoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingConv, setRenamingConv] = useState<Conversation | null>(null);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Group conversations by time category
  const grouped = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const pastWeek: Conversation[] = [];
    const older: Conversation[] = [];

    filteredConversations.forEach((c) => {
      if (c.pinned) {
        pinned.push(c);
        return;
      }
      const age = now - c.updatedAt;
      if (age < oneDay) {
        today.push(c);
      } else if (age < sevenDays) {
        pastWeek.push(c);
      } else {
        older.push(c);
      }
    });

    return { pinned, today, pastWeek, older };
  }, [filteredConversations]);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setRenamingConv(conv);
    setNewTitleInput(conv.title);
  };

  const handleSaveRename = () => {
    if (renamingConv && newTitleInput.trim()) {
      onRename(renamingConv.id, newTitleInput.trim());
      setRenamingConv(null);
    }
  };

  const handleDeleteWithPrompt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setDeleteCandidateId(id);
  };

  const confirmDelete = () => {
    if (deleteCandidateId) {
      onDelete(deleteCandidateId);
      setDeleteCandidateId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay for mobile & tablet */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden transition-opacity"
      />

      {/* Main Drawer / Sidebar Panel */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-[84vw] max-w-[320px] sm:max-w-[340px] bg-surface-container-low/95 backdrop-blur-3xl border-r border-outline-variant/25 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out"
      >
        {/* Top Header & Search */}
        <div className="p-4 flex flex-col gap-3 border-b border-outline-variant/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-secondary-container to-primary flex items-center justify-center text-on-primary shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface leading-tight">Gemini Workspace</h2>
                <p className="text-[10px] font-mono text-tertiary uppercase tracking-wider font-semibold">
                  Local Persistent Storage
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Primary Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-secondary-container via-primary-container to-tertiary-container text-on-primary text-xs font-semibold shadow-md shadow-primary-container/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Chat</span>
          </button>

          {/* Search Box */}
          <div className="relative flex items-center bg-surface-container-lowest rounded-xl px-3 py-2 text-on-surface border border-outline-variant/30 focus-within:border-primary/60 transition-colors">
            <Search className="w-3.5 h-3.5 text-outline mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats & code..."
              className="w-full bg-transparent border-0 outline-none text-xs text-on-surface placeholder:text-outline focus:ring-0 p-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="w-4 h-4 flex items-center justify-center text-outline hover:text-on-surface"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Workspace Quick Navigation Modules */}
        <div className="px-3 pt-2.5 pb-1 space-y-1 border-b border-outline-variant/15 font-mono text-xs">
          <button
            onClick={() => {
              onChangeTab('chat');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
              currentTab === 'chat'
                ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat Hub</span>
          </button>

          <button
            onClick={() => {
              onChangeTab('canvas');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
              currentTab === 'canvas'
                ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Canvas Scratchpad</span>
          </button>

          <button
            onClick={() => {
              onOpenLiveVoice();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-all"
          >
            <Radio className="w-4 h-4 text-tertiary" />
            <span>Gemini Live Voice</span>
          </button>

          <button
            onClick={() => {
              onChangeTab('settings');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
              currentTab === 'settings'
                ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Model Studio Settings</span>
          </button>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {filteredConversations.length === 0 ? (
            <div className="py-10 px-3 text-center space-y-2">
              <FolderOpen className="w-7 h-7 text-outline mx-auto stroke-1" />
              <p className="text-xs font-medium text-on-surface">No conversations yet</p>
              <p className="text-[11px] text-outline leading-tight">
                {searchQuery ? 'No matching threads found.' : 'Send a prompt to begin your session.'}
              </p>
            </div>
          ) : (
            <>
              {grouped.pinned.length > 0 && (
                <ConversationSection
                  title="Pinned"
                  count={grouped.pinned.length}
                  items={grouped.pinned}
                  activeId={activeId}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  onSelect={(id) => {
                    onSelect(id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  onRename={handleStartRename}
                  onTogglePin={onTogglePin}
                  onDelete={handleDeleteWithPrompt}
                />
              )}

              {grouped.today.length > 0 && (
                <ConversationSection
                  title="Today"
                  count={grouped.today.length}
                  items={grouped.today}
                  activeId={activeId}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  onSelect={(id) => {
                    onSelect(id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  onRename={handleStartRename}
                  onTogglePin={onTogglePin}
                  onDelete={handleDeleteWithPrompt}
                />
              )}

              {grouped.pastWeek.length > 0 && (
                <ConversationSection
                  title="Previous 7 Days"
                  count={grouped.pastWeek.length}
                  items={grouped.pastWeek}
                  activeId={activeId}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  onSelect={(id) => {
                    onSelect(id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  onRename={handleStartRename}
                  onTogglePin={onTogglePin}
                  onDelete={handleDeleteWithPrompt}
                />
              )}

              {grouped.older.length > 0 && (
                <ConversationSection
                  title="Older"
                  count={grouped.older.length}
                  items={grouped.older}
                  activeId={activeId}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  onSelect={(id) => {
                    onSelect(id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  onRename={handleStartRename}
                  onTogglePin={onTogglePin}
                  onDelete={handleDeleteWithPrompt}
                />
              )}
            </>
          )}
        </div>

        {/* Drawer Footer & Management Controls */}
        <div className="p-3.5 bg-surface-container-lowest/80 backdrop-blur-md border-t border-outline-variant/20 flex flex-col gap-2.5">
          {/* Storage Quota Gauge */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-tertiary" />
                <span>Storage: {storageStats.formattedSize} / 5 MB</span>
              </div>
              <span className="text-tertiary font-semibold">{storageStats.percentUsed}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-tertiary to-secondary rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, storageStats.percentUsed)}%` }}
              />
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onExport}
              className="py-1.5 px-2 rounded-xl bg-surface-container hover:bg-surface-bright text-on-surface text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors border border-outline-variant/20"
              title="Download backup as JSON"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="py-1.5 px-2 rounded-xl bg-error-container/20 hover:bg-error-container/40 text-error text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors border border-error/20"
              title="Permanently remove all history"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </aside>

      {/* RENAME MODAL DIALOG */}
      {renamingConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl bg-surface-container-high/95 backdrop-blur-2xl border border-outline-variant/30 shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary">
                <Edit2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Rename Conversation</h3>
                <p className="text-xs text-on-surface-variant font-mono">Update thread label for indexing</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono text-outline uppercase tracking-wider">
                Session Title
              </label>
              <input
                type="text"
                autoFocus
                value={newTitleInput}
                onChange={(e) => setNewTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') setRenamingConv(null);
                }}
                className="w-full bg-surface-container-lowest px-3 py-2 rounded-xl text-sm text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setRenamingConv(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl bg-surface-container-high/95 backdrop-blur-2xl border border-outline-variant/30 shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-error-container/40 flex items-center justify-center text-error">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Delete Conversation?</h3>
                <p className="text-xs text-on-surface-variant">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to delete this conversation thread from local memory?
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setDeleteCandidateId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 rounded-xl bg-error text-on-error text-xs font-semibold shadow-md hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR ALL MODAL */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl bg-surface-container-high/95 backdrop-blur-2xl border border-error/30 shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-error-container/50 flex items-center justify-center text-error">
                <Trash className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-error">Clear All History?</h3>
                <p className="text-xs text-on-surface-variant font-mono">Permanent wipe</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              This will remove all {conversations.length} conversation threads and messages from your
              browser Local Storage.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setConfirmClearOpen(false);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-xl bg-error text-on-error text-xs font-semibold shadow-md hover:opacity-90"
              >
                Wipe All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Sub-component for a section of conversations
interface ConversationSectionProps {
  title: string;
  count: number;
  items: Conversation[];
  activeId: string | null;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onSelect: (id: string) => void;
  onRename: (conv: Conversation, e: React.MouseEvent) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const ConversationSection: React.FC<ConversationSectionProps> = ({
  title,
  count,
  items,
  activeId,
  activeMenuId,
  setActiveMenuId,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-mono text-outline uppercase tracking-wider font-semibold">
          {title}
        </span>
        <span className="text-[10px] font-mono text-outline-variant">{count} sessions</span>
      </div>

      <div className="space-y-1">
        {items.map((conv) => {
          const isActive = conv.id === activeId;
          const isMenuOpen = activeMenuId === conv.id;
          const lastMsg = conv.messages[conv.messages.length - 1]?.content || 'Empty chat';
          const timeLabel = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
          }).format(new Date(conv.updatedAt));

          return (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group relative rounded-xl p-2.5 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-primary/10 border-primary/40 shadow-sm'
                  : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/15'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {conv.pinned ? (
                    <Pin className="w-3.5 h-3.5 text-secondary shrink-0 fill-secondary/30" />
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-outline shrink-0 group-hover:text-primary transition-colors" />
                  )}
                  <span
                    className={`text-xs font-medium truncate ${
                      isActive ? 'text-primary font-semibold' : 'text-on-surface'
                    }`}
                  >
                    {conv.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono text-outline">{timeLabel}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : conv.id);
                    }}
                    className="w-6 h-6 rounded-md hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Snippet */}
              <p className="text-[11px] text-on-surface-variant/80 truncate pl-5 mt-0.5">
                {lastMsg}
              </p>

              {/* Action Dropdown Menu */}
              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-2 top-8 z-30 w-44 rounded-xl bg-surface-container-lowest/98 backdrop-blur-2xl border border-outline-variant/30 shadow-2xl p-1.5 flex flex-col gap-0.5 text-xs text-on-surface"
                >
                  <button
                    onClick={(e) => onRename(conv, e)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-tertiary" />
                    <span>Rename</span>
                  </button>

                  <button
                    onClick={() => {
                      onTogglePin(conv.id);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-left"
                  >
                    <Pin className="w-3.5 h-3.5 text-secondary" />
                    <span>{conv.pinned ? 'Unpin' : 'Pin to top'}</span>
                  </button>

                  <div className="h-[1px] bg-outline-variant/20 my-0.5" />

                  <button
                    onClick={(e) => onDelete(conv.id, e)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-error-container/30 text-error transition-colors text-left font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
