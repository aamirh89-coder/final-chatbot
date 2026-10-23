import React, { useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  User,
  CheckCheck,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
  isLastModelMessage?: boolean;
  isGenerating?: boolean;
  onRegenerate?: () => void;
  onEditSubmit?: (newContent: string) => void;
  onDelete?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLastModelMessage,
  isGenerating,
  onRegenerate,
  onEditSubmit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy message:', e);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEditSubmit) {
      onEditSubmit(editText.trim());
      setIsEditing(false);
    }
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(message.timestamp));

  // USER MESSAGE BUBBLE - Luminescent Glass Aesthetic
  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1.5 max-w-[92%] sm:max-w-[80%] self-end group">
        <div className="flex items-end gap-2.5 justify-end w-full">
          {/* Action buttons (revealed on hover/touch) */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(!isEditing)}
              aria-label="Edit prompt"
              className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
              title="Edit & Resubmit"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopy}
              aria-label="Copy prompt"
              className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                aria-label="Delete message"
                className="p-1.5 rounded-lg hover:bg-error-container/40 text-on-surface-variant hover:text-error transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Message Bubble with glowing border */}
          <div className="relative bg-gradient-to-br from-indigo-500/20 via-purple-600/15 to-surface-container-high/90 backdrop-blur-2xl p-3.5 sm:p-4 rounded-2xl rounded-tr-sm shadow-lg shadow-indigo-950/20 text-on-surface flex flex-col gap-1.5 border border-indigo-400/30">
            {/* Ambient top highlight rim */}
            <div className="absolute top-0 right-0 w-16 h-[2px] bg-gradient-to-r from-transparent via-primary to-tertiary rounded-full opacity-80 pointer-events-none" />

            {isEditing ? (
              <div className="flex flex-col gap-2 w-full min-w-[260px] sm:min-w-[340px]">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-surface-container-lowest p-3 rounded-xl border border-primary/50 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans resize-none"
                  rows={3}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditText(message.content);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:opacity-95 shadow-sm transition-all"
                  >
                    Save & Resubmit
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-sans text-[15px] sm:text-[15.5px] text-on-surface leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            )}

            <div className="flex items-center justify-end gap-1.5 text-[11px] font-mono text-outline mt-0.5 select-none">
              <span>{formattedTime}</span>
              <CheckCheck className="w-3.5 h-3.5 text-tertiary" />
            </div>
          </div>

          {/* User Avatar with subtle ring */}
          <div className="relative shrink-0 self-start mt-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-primary-container to-secondary flex items-center justify-center shadow-md shadow-primary/25 text-on-primary">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GEMINI AI RESPONSE BUBBLE - Ethereal Intelligence Aesthetic
  return (
    <div className="flex flex-col gap-2.5 max-w-full self-start w-full group">
      {/* AI Identifier Line & Model Attribution Badge */}
      <div className="flex items-center gap-2.5 select-none">
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-secondary-container via-primary-container to-tertiary flex items-center justify-center p-1.5 shadow-md shadow-primary/20 text-on-primary border border-white/15">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-on-surface tracking-tight">Gemini</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high/90 text-on-surface-variant text-[11px] font-mono border border-outline-variant/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
            <span>Fast Flash</span>
            <span className="text-outline">•</span>
            <span className="text-tertiary font-medium">Instant</span>
          </span>
          <span className="text-[11px] font-mono text-outline select-none hidden sm:inline">
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Main Narrative Content Container */}
      <div className="flex flex-col gap-3 pl-1 sm:pl-10 w-full">
        {/* Error Callout if message failed */}
        {message.error ? (
          <div className="p-4 rounded-2xl bg-surface-container-high/90 border border-error/40 text-on-surface shadow-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div className="flex-1 text-sm space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-error text-xs uppercase tracking-wider font-mono">
                  Gemini API Notice
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-error-container/40 text-error">
                  Temporary High Demand
                </span>
              </div>
              <p className="text-on-surface-variant text-xs leading-relaxed font-sans">{message.error}</p>
              {onRegenerate && (
                <div className="pt-1">
                  <button
                    onClick={onRegenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Retry Request Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full text-on-surface">
            <MarkdownRenderer content={message.content} />
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1.5 bg-gradient-to-t from-primary via-tertiary to-cyan-400 animate-pulse rounded-xs align-middle" />
            )}
          </div>
        )}

        {/* Interactive AI Action Bar */}
        {!message.isStreaming && !message.error && (
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-outline-variant/15 text-on-surface-variant select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                aria-label="Copy response"
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:bg-surface-container-high hover:text-on-surface transition-colors text-xs font-mono"
                title="Copy full response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-tertiary" />
                    <span className="text-tertiary font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={isGenerating}
                  aria-label="Regenerate answer"
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:bg-surface-container-high hover:text-on-surface transition-colors text-xs font-mono disabled:opacity-50"
                  title="Regenerate response"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating && isLastModelMessage ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              )}

              <button
                onClick={handleCopy}
                aria-label="Share response"
                className="p-1.5 rounded-full hover:bg-surface-container-high hover:text-on-surface transition-colors hidden sm:inline-flex"
                title="Share response"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {onDelete && (
                <button
                  onClick={onDelete}
                  aria-label="Delete response"
                  className="p-1.5 rounded-full hover:bg-surface-container-high hover:text-error transition-colors"
                  title="Delete message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setLiked(liked === true ? null : true)}
                aria-label="Thumbs up"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  liked === true
                    ? 'bg-tertiary/20 text-tertiary'
                    : 'hover:bg-surface-container hover:text-tertiary text-on-surface-variant'
                }`}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLiked(liked === false ? null : false)}
                aria-label="Thumbs down"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  liked === false
                    ? 'bg-error/20 text-error'
                    : 'hover:bg-surface-container hover:text-error text-on-surface-variant'
                }`}
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
