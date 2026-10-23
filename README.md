# Gemini AI Chat Studio

A professional, responsive AI chatbot web application inspired by Google Gemini, built with React 19, TypeScript, Tailwind CSS, real-time SSE streaming with `@google/genai`, and persistent browser LocalStorage.

## Features

- **Google Gemini 3.8 Flash & 3.1 Flash-Lite Integration**: High-speed, high-context AI responses utilizing the modern `@google/genai` TypeScript SDK.
- **Vercel Serverless Ready**: Native `/api` serverless function handlers (`/api/chat/stream`, `/api/chat`, `/api/health`) preconfigured for zero-config Vercel deployment with 60s max execution and real-time streaming.
- **Server-Side API Key Protection**: `GEMINI_API_KEY` is kept strictly on the server backend. Zero keys are exposed to the client browser.
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
  - Syntax-highlighted code blocks with copy-code button.
  - Tables, headings, lists, blockquotes, inline code, and links.
- **Canvas Scratchpad View**:
  - Side-by-side or split markdown/code editor with live preview.
  - Quick-start architecture and hook templates.
  - "Refine in Chat" one-click action to send drafts to Gemini.
- **6 Premium Themes & Appearance Modes**:
  - Midnight Dark, Premium Light, Glass Aurora, Ocean Blue, Emerald, Sunset, plus System auto-detection.
- **Fully Responsive Mobile First**:
  - Slide-out navigation drawer, bottom tab bar, mobile touch targets, safe area padding, and virtual keyboard adaptation.

---

## Deploying to Vercel

This project is fully optimized for **Vercel Deployment**:

1. **Push your code to GitHub / GitLab**.
2. **Import into Vercel**:
   - Framework Preset: **Vite**
   - Build Command: `vite build` (or `npm run build`)
   - Output Directory: `dist`
3. **Configure Environment Variable**:
   - Go to **Project Settings > Environment Variables**
   - Name: `GEMINI_API_KEY`
   - Value: Your Google AI Studio API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
4. **Click Deploy**:
   - Vercel automatically deploys the frontend SPA to the Edge Network and provisions the `/api/chat/stream`, `/api/chat`, and `/api/health` endpoints as Node.js serverless functions.

---

## Local Development

### Prerequisites

- Node.js 18+ or 20+
- A Google Gemini API Key

### Configuration

Create a `.env` file:

```bash
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PORT=3000
```

### Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Build and Test Locally

```bash
npm run build
npm start
```
