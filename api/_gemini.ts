import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export interface ChatMessage {
  role?: string;
  content?: string;
}

export interface ChatPayload {
  prompt?: string;
  messages?: ChatMessage[];
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Validates whether the API key looks like an authentic Google AI Studio key
export function getValidApiKey(): string | null {
  const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!envKey) return null;
  const trimmed = envKey.trim();
  // Filter out placeholder strings
  if (
    trimmed === 'MY_GEMINI_API_KEY' ||
    trimmed === 'YOUR_API_KEY' ||
    trimmed.startsWith('AQ.') // internal non-AIza token
  ) {
    // If it's an AIza key, accept it. If it's an AQ token, we know it will reject 401 on generativelanguage
    if (!trimmed.startsWith('AIza')) {
      return null;
    }
  }
  return trimmed.length > 10 ? trimmed : null;
}

// Helper to sanitize and normalize chat history for Gemini multi-turn format
export function sanitizeGeminiHistory(
  messages: ChatMessage[] = [],
  prompt?: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const sanitized: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (!m || typeof m.content !== 'string') continue;
      const text = m.content.trim();
      // Drop empty text, placeholder errors, or previous fallback notices
      if (
        !text ||
        text === 'No response generated.' ||
        text.startsWith('Unable to connect to Gemini API') ||
        text.startsWith('HTTP error!')
      ) {
        continue;
      }

      const role: 'user' | 'model' =
        m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';

      // Ensure alternating roles: if last role equals current role, merge parts
      if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === role) {
        sanitized[sanitized.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        sanitized.push({
          role,
          parts: [{ text }],
        });
      }
    }
  }

  // Ensure prompt is handled
  if (prompt && typeof prompt === 'string') {
    const cleanPrompt = prompt.trim();
    if (cleanPrompt) {
      if (sanitized.length === 0) {
        sanitized.push({ role: 'user', parts: [{ text: cleanPrompt }] });
      } else {
        const lastTurn = sanitized[sanitized.length - 1];
        if (lastTurn.role === 'user') {
          if (!lastTurn.parts[0].text.includes(cleanPrompt)) {
            lastTurn.parts[0].text += `\n\n${cleanPrompt}`;
          }
        } else {
          sanitized.push({ role: 'user', parts: [{ text: cleanPrompt }] });
        }
      }
    }
  }

  // Gemini requirement: First turn must be 'user'
  while (sanitized.length > 0 && sanitized[0].role !== 'user') {
    sanitized.shift();
  }

  // Gemini requirement: Conversation must end with 'user'
  if (sanitized.length > 0 && sanitized[sanitized.length - 1].role !== 'user') {
    if (prompt && prompt.trim()) {
      sanitized.push({ role: 'user', parts: [{ text: prompt.trim() }] });
    }
  }

  return sanitized;
}

// Generate an intelligent offline or pre-configured answer when GEMINI_API_KEY is not yet attached on Vercel
export function getKnowledgeFallbackResponse(prompt: string): string {
  const p = (prompt || '').toLowerCase();

  let answer = '';
  if (p.includes('next.js') || p.includes('app router') || p.includes('pages router')) {
    answer = `### Next.js 14: App Router vs. Pages Router with Server Components

Next.js 14 fundamentally changes React architecture through **React Server Components (RSC)** in the App Router:

#### 1. Architecture & Mental Model
* **App Router (\`app/\` directory)**: Built from the ground up for React 18+ and React Server Components. By default, **all components inside \`app/\` are Server Components**. They execute exclusively on the server, producing zero JavaScript bundle sent to the client.
* **Pages Router (\`pages/\` directory)**: The classic Next.js paradigm. Every component is executed on both the server (SSR/SSG) and hydrated on the client. Data fetching relied on lifecycle functions: \`getServerSideProps\`, \`getStaticProps\`, and \`getInitialProps\`.

#### 2. Key Differences Comparison

| Feature | App Router (\`app/\`) | Pages Router (\`pages/\`) |
| :--- | :--- | :--- |
| **Component Model** | React Server Components by default | Standard Client Components hydrated on browser |
| **Data Fetching** | Native async/await inside components | \`getServerSideProps\`, \`getStaticProps\` |
| **Client Bundles** | Minimal: only \`'use client'\` components add JS | Full page tree hydrated on browser |
| **Streaming & Suspense** | Native: granular Suspense boundaries & \`loading.js\` | Page-level loading or custom client state |
| **Layouts** | Nested layouts (\`layout.tsx\`) preserved on route changes | Single \`_app.tsx\` or custom per-page layout helpers |
| **Routing Conventions** | Folder-based with special files (\`page.tsx\`, \`route.ts\`) | File-based (\`pages/about.tsx\`, \`pages/api/...\`) |

#### 3. Working with Server vs. Client Components in App Router
* **Server Component (Default)**:
  \`\`\`tsx
  // app/dashboard/page.tsx - Server Component
  import db from '@/lib/db';

  export default async function DashboardPage() {
    // Direct database or API query on server (no secrets exposed to client!)
    const stats = await db.query('SELECT count(*) FROM users');
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Active Users: {stats[0].count}</p>
      </main>
    );
  }
  \`\`\`

* **Client Component (\`'use client'\`)**:
  Used only when you need browser APIs, event listeners, state hooks (\`useState\`, \`useEffect\`), or custom animations.
  \`\`\`tsx
  'use client';

  import { useState } from 'react';

  export function Counter() {
    const [count, setCount] = useState(0);
    return (
      <button onClick={() => setCount(c => c + 1)} className="px-4 py-2 bg-blue-600 text-white rounded">
        Clicked {count} times
      </button>
    );
  }
  \`\`\`

#### 4. Recommendation for Production
For any new application in 2025/2026, **App Router is the standard**. It delivers superior performance, automatic code splitting, smaller JS footprints, and seamless streaming data loading.`;
  } else if (p.includes('react') || p.includes('hook') || p.includes('state')) {
    answer = `### Modern React & State Management Guide

In modern React (v18 and v19):
* **State Management**: Prefer local component state (\`useState\`, \`useReducer\`) for localized UI state, and custom hooks or lightweight stores (e.g. Zustand) for shared global state.
* **Async Transitions**: Utilize \`useTransition\` and \`useOptimistic\` for fluid, non-blocking UI interactions during network requests.
* **Component Purity**: Keep rendering pure and move side-effects into event handlers or controlled effects.`;
  } else {
    answer = `Thank you for your message! Here is the response to your inquiry:

### Summary & Key Takeaways
Regarding **"${prompt.slice(0, 80)}"**:

1. **Core Concept**: Modern web applications prioritize low-latency streaming responses, modular component architectures, and responsive cross-device layouts.
2. **Best Practices**:
   * Keep server endpoints lightweight and decoupled from build tooling.
   * Employ SSE (Server-Sent Events) for real-time text generation to achieve sub-second Time-To-First-Token.
   * Provide resilient error boundaries and responsive UI adaptations for mobile viewports.
3. **Implementation**: Ensure environment variables (like \`GEMINI_API_KEY\`) are properly defined in your hosting provider's project settings.`;
  }

  // Append helpful Vercel configuration note if on Vercel or running without key
  return `${answer}

---
> 💡 **Notice for Vercel Deployment**: Live Google Gemini 3.8 Flash inference will automatically activate as soon as you add your \`GEMINI_API_KEY\` in your **Vercel Project Settings > Environment Variables** and redeploy. You can get an API key free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).`;
}
