import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parse blocks: code blocks, lists, quotes, paragraphs
  const blocks = React.useMemo(() => parseMarkdownToBlocks(content), [content]);

  return (
    <div className="space-y-3.5 text-on-surface leading-relaxed text-[15px] break-words">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={idx}
              language={block.language || 'text'}
              code={block.content}
            />
          );
        }

        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h1 key={idx} className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface mt-4 mb-2">
                <InlineText text={block.content} />
              </h1>
            );
          }
          if (block.level === 2) {
            return (
              <h2 key={idx} className="text-lg sm:text-xl font-semibold tracking-tight text-on-surface mt-3 mb-1.5">
                <InlineText text={block.content} />
              </h2>
            );
          }
          return (
            <h3 key={idx} className="text-base font-semibold text-on-surface mt-2 mb-1">
              <InlineText text={block.content} />
            </h3>
          );
        }

        if (block.type === 'list') {
          const isOrdered = block.ordered;
          const ListTag = isOrdered ? 'ol' : 'ul';
          const listStyle = isOrdered ? 'list-decimal' : 'list-disc';

          return (
            <ListTag key={idx} className={`pl-5 space-y-1.5 ${listStyle} text-on-surface-variant`}>
              {block.items?.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  <InlineText text={item} />
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'quote') {
          return (
            <div
              key={idx}
              className="pl-4 py-1 border-l-2 border-primary/50 bg-primary/5 rounded-r-lg text-on-surface-variant italic"
            >
              <InlineText text={block.content} />
            </div>
          );
        }

        if (block.type === 'hr') {
          return <hr key={idx} className="border-t border-outline-variant/30 my-4" />;
        }

        return (
          <p key={idx} className="leading-relaxed text-on-surface">
            <InlineText text={block.content} />
          </p>
        );
      })}
    </div>
  );
};

// Interactive Code Block with line numbering, language tag, and copy feedback
interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  const lines = code.replace(/\n$/, '').split('\n');

  return (
    <div className="w-full my-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl overflow-hidden font-mono text-[13px]">
      {/* Code Header Bar */}
      <div className="h-9 px-3.5 bg-surface-container/90 flex items-center justify-between border-b border-outline-variant/20 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-tertiary" />
          <span className="text-tertiary-fixed font-medium text-xs lowercase">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy code"
          className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all text-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-tertiary animate-pulse" />
              <span className="text-tertiary font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Lines with Highlighting */}
      <div className="p-3.5 overflow-x-auto space-y-0.5 leading-relaxed bg-[#0d0e13]">
        {lines.map((line, lIdx) => (
          <div key={lIdx} className="flex gap-3">
            <span className="text-outline-variant/60 select-none w-5 text-right font-mono text-xs shrink-0">
              {lIdx + 1}
            </span>
            <div className="text-on-surface break-normal whitespace-pre flex-1">
              {highlightSyntax(line, language)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Inline Markdown parser (bold, italic, code, links)
const InlineText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Split by code, bold, italic, links
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      elements.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-primary border border-outline-variant/30 font-mono text-[13px]"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      elements.push(
        <strong key={key++} className="font-semibold text-on-surface">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
    if (italicMatch) {
      elements.push(
        <em key={key++} className="italic text-on-surface-variant">
          {italicMatch[2]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Link: [label](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      elements.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-tertiary underline decoration-tertiary/40 hover:decoration-tertiary transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Plain text until next token
    const nextTokenIdx = remaining.search(/[`*_[\]]/);
    if (nextTokenIdx === -1) {
      elements.push(remaining);
      break;
    } else if (nextTokenIdx > 0) {
      elements.push(remaining.slice(0, nextTokenIdx));
      remaining = remaining.slice(nextTokenIdx);
    } else {
      // Single delimiter char that didn't match a rule
      elements.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }

  return <>{elements}</>;
};

// Syntax highlighting tokenizer
function highlightSyntax(line: string, _language: string): React.ReactNode {
  if (!line) return <span>&nbsp;</span>;

  // Simple token regex matching keywords, strings, comments, numbers
  const tokens: Array<{ type: string; value: string }> = [];
  const regex =
    /(\/\/.*$)|(".*?"|'.*?'|`.*?`)|(\b(?:import|export|from|return|function|const|let|var|if|else|try|catch|async|await|class|new|interface|type|extends|implements|default)\b)|(\b(?:true|false|null|undefined|NaN|void|number|string|boolean|any|unknown)\b)|(\b\d+\b)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: line.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      tokens.push({ type: 'comment', value: match[1] });
    } else if (match[2]) {
      tokens.push({ type: 'string', value: match[2] });
    } else if (match[3]) {
      tokens.push({ type: 'keyword', value: match[3] });
    } else if (match[4]) {
      tokens.push({ type: 'literal', value: match[4] });
    } else if (match[5]) {
      tokens.push({ type: 'number', value: match[5] });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({ type: 'text', value: line.slice(lastIndex) });
  }

  return tokens.map((token, i) => {
    switch (token.type) {
      case 'comment':
        return (
          <span key={i} className="text-outline italic">
            {token.value}
          </span>
        );
      case 'keyword':
        return (
          <span key={i} className="text-secondary font-medium">
            {token.value}
          </span>
        );
      case 'literal':
        return (
          <span key={i} className="text-primary font-medium">
            {token.value}
          </span>
        );
      case 'string':
        return (
          <span key={i} className="text-tertiary">
            {token.value}
          </span>
        );
      case 'number':
        return (
          <span key={i} className="text-amber-300">
            {token.value}
          </span>
        );
      default:
        return <span key={i}>{token.value}</span>;
    }
  });
}

// Basic markdown block parser
interface ParsedBlock {
  type: 'paragraph' | 'heading' | 'code' | 'list' | 'quote' | 'hr';
  content: string;
  level?: number;
  language?: string;
  ordered?: boolean;
  items?: string[];
}

function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = markdown.split('\n');
  let inCode = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  let listBuffer: string[] = [];
  let isOrderedList = false;

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push({
        type: 'list',
        content: '',
        ordered: isOrderedList,
        items: [...listBuffer],
      });
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block fences
    if (line.trim().startsWith('```')) {
      if (!inCode) {
        flushList();
        inCode = true;
        codeLang = line.trim().slice(3).trim();
        codeBuffer = [];
      } else {
        inCode = false;
        blocks.push({
          type: 'code',
          content: codeBuffer.join('\n'),
          language: codeLang,
        });
        codeBuffer = [];
        codeLang = '';
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Horizontal rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      flushList();
      blocks.push({ type: 'hr', content: '' });
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      flushList();
      blocks.push({
        type: 'quote',
        content: line.replace(/^>\s?/, ''),
      });
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\*\-]\s+(.*)$/);
    if (ulMatch) {
      if (isOrderedList && listBuffer.length > 0) flushList();
      isOrderedList = false;
      listBuffer.push(ulMatch[1]);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!isOrderedList && listBuffer.length > 0) flushList();
      isOrderedList = true;
      listBuffer.push(olMatch[1]);
      continue;
    }

    // Empty line separates blocks
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Paragraph
    flushList();
    blocks.push({
      type: 'paragraph',
      content: line,
    });
  }

  flushList();

  if (inCode && codeBuffer.length > 0) {
    blocks.push({
      type: 'code',
      content: codeBuffer.join('\n'),
      language: codeLang,
    });
  }

  return blocks;
}
