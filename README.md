# Gemini AI Chat Studio

A professional, responsive AI chatbot web application inspired by Google Gemini, built with React 19, TypeScript, Tailwind CSS, an Express server proxying the official `@google/genai` TypeScript SDK with real-time SSE streaming, and persistent browser LocalStorage.

## Features

- **Google Gemini 3.8 Flash Integration**: High-speed, high-context AI responses utilizing the modern `@google/genai` TypeScript SDK.
- **Server-Side API Key Protection**: The `GEMINI_API_KEY` is kept strictly on the Node.js backend. Zero keys are exposed to the client browser.
- **Real-Time Token Streaming**: Real-time token delivery via Server-Sent Events (SSE) with live typing indicators and stop generation controls.
- **Full Conversation CRUD**:
  - **Create**: Instant new chat creation, automatic session titling based on initial prompt.
  - **Read**: Chronological message history with grouped lists (Today, Previous 7 Days, Older).
  - **Update**: Rename conversations inline (`⌘R`), edit previous user messages and resubmit, regenerate AI responses, pin favorite threads.
  - **Delete**: Remove individual messages, delete single threads, or wipe all chat history with confirmation.
- **Client Local Storage Management**:
  - Real-time quota metrics gauge (Sessions count, Messages count, Kilobytes used / 5MB browser quota).
  - JSON backup export (`gemini-chat-backup.json`) and backup file import with schema validation.
- **Interactive Markdown & Code Highlighter**:
  - Prism-style syntax highlighting for code blocks with line numbering.
  - One-click copy code button with checkmark feedback.
  - Headings, lists, blockquotes, inline code, and links.
- **Canvas Scratchpad View**:
  - Side-by-side or split markdown/code editor with live preview.
  - Quick-start architecture and hook templates.
  - "Refine in Chat" one-click action to send drafts to Gemini.
- **Model Studio / Settings**:
  - Switch between Gemini 3.8 Flash and Gemini 4 Argon.
  - Hyperparameter tuning for Temperature (0.0 to 1.0) and Max Output Tokens (256 to 8192).
  - Customizable System Persona & behavioral instructions.
  - Interface theme switcher (Dark, Light, System).
- **Voice & Dictation**: Web Speech recognition support for voice input and Live Voice modal.

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- A Google Gemini API Key

### Configuration

Create a `.env` file (or set the environment variable):

```bash
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PORT=3000
```

### Development

Run the full-stack server (mounting Express API routes and Vite dev server):

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
npm run build
npm start
```

## Security

- All API calls to `@google/genai` are handled exclusively by `server.ts`.
- The client communicates solely via `/api/chat/stream` and `/api/chat` proxy endpoints.
