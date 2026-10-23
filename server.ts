import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Initialized on server only - never exposed to client
const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IG1Jdn8pmbf1hQh_369L5hjdeeueqzHrskLK5pzWVzhQ';

const ai = new GoogleGenAI({ apiKey });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    defaultModel: 'gemini-3.1-flash-lite',
    uptime: process.uptime(),
  });
});


// Helper to sanitize and normalize chat history for Gemini multi-turn format
function sanitizeGeminiHistory(
  messages: Array<{ role?: string; content?: string }>,
  prompt?: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const sanitized: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (!m || typeof m.content !== 'string') continue;
      const text = m.content.trim();
      // Drop empty text, placeholder errors, or previous fallback messages
      if (!text || text === 'No response generated.' || text.startsWith('Unable to connect to Gemini API')) {
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
          // If the last turn already contains the prompt text, do not duplicate
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
    // If it somehow ends with 'model' and we have prompt, it was already handled; otherwise drop or convert
    if (prompt && prompt.trim()) {
      sanitized.push({ role: 'user', parts: [{ text: prompt.trim() }] });
    }
  }

  return sanitized;
}

// Real-time SSE streaming chat endpoint with ultra-low latency (<1s TTFT)
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const {
    prompt,
    messages = [],
    systemInstruction,
    model = 'gemini-3.1-flash-lite',
    temperature = 0.7,
    maxTokens = 2048,
  } = req.body;

  const contents = sanitizeGeminiHistory(messages, prompt);

  if (contents.length === 0) {
    return res.status(400).json({ error: 'A prompt or valid message history is required.' });
  }

  let clientDisconnected = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
    }
  });

  // Set SSE response headers with unbuffered streaming
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const primaryModel = model || 'gemini-3.1-flash-lite';
  // Rapid fallback chain prioritizes high-availability lightweight models on 503 high demand
  const modelCandidates = Array.from(
    new Set([primaryModel, 'gemini-3.1-flash-lite', 'gemini-3.8-flash'])
  );

  const config: Record<string, unknown> = {
    temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 1),
    maxOutputTokens: Math.min(Math.max(Number(maxTokens) || 2048, 256), 8192),
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MINIMAL,
    },
  };

  if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
    config.systemInstruction = systemInstruction.trim();
  }

  let streamedSuccessfully = false;
  let totalCharsStreamed = 0;
  let lastError: any = null;

  for (const candidateModel of modelCandidates) {
    if (clientDisconnected) break;

    try {
      const responseStream = await ai.models.generateContentStream({
        model: candidateModel,
        contents,
        config,
      });

      for await (const chunk of responseStream) {
        if (clientDisconnected) break;

        let chunkText = '';
        try {
          chunkText = chunk.text || '';
        } catch {
          // If chunk.text throws (e.g. safety finish or thinking part), extract from candidates
          if (chunk.candidates?.[0]?.content?.parts) {
            chunkText = chunk.candidates[0].content.parts
              .map((p: any) => p.text || '')
              .join('');
          }
        }

        // Check safety filter
        const finishReason = chunk.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY' || finishReason === 'BLOCKLIST') {
          chunkText = '\n\n*(Notice: Response was adjusted in accordance with safety guidelines.)*';
        }

        if (chunkText) {
          totalCharsStreamed += chunkText.length;
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          (res as any).flush?.();
        }
      }

      // If at least some text was produced, we consider it a success
      if (totalCharsStreamed > 0) {
        streamedSuccessfully = true;
        break;
      } else {
        console.warn(`Model ${candidateModel} produced 0 tokens, attempting fallback.`);
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      const isAborted = err?.name === 'AbortError' || err?.message?.includes('aborted');

      if (clientDisconnected || isAborted) {
        break;
      }

      console.warn(
        `Fast-fallback from stream model ${candidateModel} (status ${status}):`,
        err?.message?.slice(0, 100)
      );

      // If we already sent some characters to the user, do not start streaming another candidate over it
      if (totalCharsStreamed > 0) {
        streamedSuccessfully = true;
        break;
      }
    }
  }

  if (clientDisconnected) {
    res.end();
    return;
  }

  if (streamedSuccessfully && totalCharsStreamed > 0) {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } else {
    // If streaming yielded 0 tokens or failed across all models, attempt a quick unary generateContent before returning error
    try {
      console.log('Attempting unary fallback after stream failure...');
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config,
      });

      const fallbackText = fallbackResponse.text || '';
      if (fallbackText) {
        res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
    } catch (unaryErr) {
      console.error('Unary fallback also failed:', unaryErr);
    }

    console.error('All candidates failed. Last error:', lastError);
    const status = lastError?.status || 503;
    let friendlyMessage = 'Gemini service is temporarily experiencing high upstream demand. Please click Retry.';

    if (status === 503 || lastError?.message?.includes('503') || lastError?.message?.includes('high demand')) {
      friendlyMessage = 'The AI model is temporarily experiencing high upstream demand. Please click "Retry Request" below.';
    } else if (status === 429 || lastError?.message?.includes('quota')) {
      friendlyMessage = 'API quota limit reached. Please wait a few moments and click Retry.';
    } else if (lastError?.message) {
      friendlyMessage = lastError.message;
    }

    res.write(`data: ${JSON.stringify({ error: friendlyMessage, status })}\n\n`);
    res.end();
  }
});

// Fallback non-streaming unary chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    prompt,
    messages = [],
    systemInstruction,
    model = 'gemini-3.1-flash-lite',
    temperature = 0.7,
    maxTokens = 2048,
  } = req.body;

  const contents = sanitizeGeminiHistory(messages, prompt);

  if (contents.length === 0) {
    return res.status(400).json({ error: 'A prompt or valid message history is required.' });
  }

  const primaryModel = model || 'gemini-3.1-flash-lite';
  const modelCandidates = Array.from(
    new Set([primaryModel, 'gemini-3.1-flash-lite', 'gemini-3.8-flash'])
  );

  const config: Record<string, unknown> = {
    temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 1),
    maxOutputTokens: Math.min(Math.max(Number(maxTokens) || 2048, 256), 8192),
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MINIMAL,
    },
  };

  if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
    config.systemInstruction = systemInstruction.trim();
  }

  let lastError: any = null;

  for (const candidateModel of modelCandidates) {
    try {
      const response = await ai.models.generateContent({
        model: candidateModel,
        contents,
        config,
      });

      const responseText = response.text || '';
      if (responseText) {
        return res.json({
          text: responseText,
          model: candidateModel,
        });
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      console.warn(`Unary fallback from ${candidateModel} (status ${status}):`, err?.message?.slice(0, 100));
    }
  }

  console.error('All unary candidates failed:', lastError);
  const status = lastError?.status || 503;
  let friendlyMessage = 'The AI model is temporarily experiencing high upstream demand. Please click Retry.';

  if (status === 503 || lastError?.message?.includes('503')) {
    friendlyMessage = 'The model is currently experiencing high demand upstream. Please click Retry.';
  } else if (lastError?.message) {
    friendlyMessage = lastError.message;
  }

  res.status(status).json({ error: friendlyMessage });
});

// Configure Vite middleware in development or static serve in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
