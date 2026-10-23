import React, { useState } from 'react';
import {
  FileText,
  Code2,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Download,
  Eye,
  Edit3,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface CanvasScratchpadProps {
  content: string;
  onChange: (value: string) => void;
  onSendToChat: (prompt: string) => void;
}

const TEMPLATES = [
  {
    title: 'Next.js 14 API Route',
    snippet: `// app/api/gemini/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });
    return NextResponse.json({ text: response.text });
  } catch (err: any) {
    return NextResponse.json({ error: "Inference failed" }, { status: 500 });
  }
}`,
  },
  {
    title: 'React Storage Hook',
    snippet: `import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}`,
  },
  {
    title: 'Architecture RFC',
    snippet: `# Architectural RFC: Resilient Gemini Inference Stream

## Objective
Establish a zero-leak server-side gateway to handle high-concurrency client streams with automatic backoff.

## Key Invariants
- Secrets strictly confined to Node runtime host
- Native Server-Sent Events (SSE) pipe
- Client-side storage resilience up to 5MB`,
  },
];

export const CanvasScratchpad: React.FC<CanvasScratchpadProps> = ({
  content,
  onChange,
  onSendToChat,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'edit' : 'split';
  });
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy canvas:', e);
    }
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-canvas-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefineWithGemini = () => {
    if (!content.trim()) return;
    const prompt = `Review and improve the following code/notes from my Canvas workspace, offering architecture insights and optimizations:\n\n\`\`\`markdown\n${content}\n\`\`\``;
    onSendToChat(prompt);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-4 h-[calc(100vh-140px)]">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container/80 backdrop-blur-xl border border-outline-variant/20 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-sm">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface leading-tight">Canvas Scratchpad</h2>
            <p className="text-[10px] font-mono text-outline uppercase tracking-wider">
              Markdown & Code Workspace
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-outline-variant/15 text-xs font-mono">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
              viewMode === 'edit'
                ? 'bg-surface-container-high text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
              viewMode === 'preview'
                ? 'bg-surface-container-high text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
              viewMode === 'split'
                ? 'bg-surface-container-high text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefineWithGemini}
            disabled={!content.trim()}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-secondary-container via-primary-container to-tertiary-container text-on-primary text-xs font-semibold shadow-md shadow-primary-container/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40"
            title="Send canvas draft to Gemini for code review & enhancement"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Refine in Chat</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/20"
            title="Copy all canvas text"
          >
            {copied ? <Check className="w-4 h-4 text-tertiary" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleExport}
            className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/20"
            title="Download as .md"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => onChange('')}
            className="p-2 rounded-xl bg-surface-container-high hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors border border-outline-variant/20"
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Starter Templates */}
      {!content && (
        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
          <span className="text-[11px] font-mono text-outline uppercase tracking-wider block">
            Insert Starter Template:
          </span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tmpl, i) => (
              <button
                key={i}
                onClick={() => onChange(tmpl.snippet)}
                className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-medium text-on-surface border border-outline-variant/30 transition-all text-left"
              >
                + {tmpl.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor & Preview Split Panel */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Code / Markdown Input */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`flex flex-col h-full rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-inner overflow-hidden ${
              viewMode === 'edit' ? 'md:col-span-2' : ''
            }`}
          >
            <div className="h-8 px-3.5 bg-surface-container flex items-center justify-between text-[11px] font-mono text-outline border-b border-outline-variant/15 select-none">
              <span>MARKDOWN SOURCE</span>
              <span>{content.length} characters</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Draft prompts, paste code snippets, or document architecture notes here..."
              className="flex-1 w-full bg-transparent p-4 font-mono text-xs sm:text-sm text-on-surface outline-none resize-none leading-relaxed placeholder:text-outline"
            />
          </div>
        )}

        {/* Live Formatted Markdown Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex flex-col h-full rounded-2xl bg-surface-container-low/70 backdrop-blur-xl border border-outline-variant/20 shadow-md overflow-hidden ${
              viewMode === 'preview' ? 'md:col-span-2' : ''
            }`}
          >
            <div className="h-8 px-3.5 bg-surface-container flex items-center justify-between text-[11px] font-mono text-outline border-b border-outline-variant/15 select-none">
              <span>LIVE RENDERED OUTPUT</span>
              <span className="text-tertiary">Real-time</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <div className="h-full flex items-center justify-center text-outline text-xs font-mono">
                  Markdown preview will render here automatically...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
