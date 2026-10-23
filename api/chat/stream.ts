import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { getValidApiKey, sanitizeGeminiHistory, getKnowledgeFallbackResponse } from '../_gemini';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  // Support CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    prompt,
    messages = [],
    systemInstruction,
    model = 'gemini-3.8-flash',
    temperature = 0.7,
    maxTokens = 2048,
  } = req.body || {};

  const contents = sanitizeGeminiHistory(messages, prompt);
  if (contents.length === 0) {
    return res.status(400).json({ error: 'A prompt or valid message history is required.' });
  }

  // Set SSE response headers with unbuffered streaming
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let clientDisconnected = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
    }
  });

  const apiKey = getValidApiKey();

  // If no valid key is present on Vercel yet, stream the intelligent knowledge fallback response smoothly
  if (!apiKey) {
    const fallbackText = getKnowledgeFallbackResponse(prompt || '');
    // Stream in comfortable chunks to simulate real-time typing
    const words = fallbackText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      if (clientDisconnected) break;
      const chunk = words.slice(i, i + 3).join(' ') + ' ';
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      res.flush?.();
      await new Promise((r) => setTimeout(r, 20));
    }
    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const primaryModel = model || 'gemini-3.8-flash';
  const modelCandidates = Array.from(new Set([primaryModel, 'gemini-3.8-flash', 'gemini-3.1-flash-lite']));

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
          if (chunk.candidates?.[0]?.content?.parts) {
            chunkText = chunk.candidates[0].content.parts
              .map((p: any) => p.text || '')
              .join('');
          }
        }

        const finishReason = chunk.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY' || finishReason === 'BLOCKLIST') {
          chunkText = '\n\n*(Notice: Response was adjusted in accordance with safety guidelines.)*';
        }

        if (chunkText) {
          totalCharsStreamed += chunkText.length;
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          res.flush?.();
        }
      }

      if (totalCharsStreamed > 0) {
        streamedSuccessfully = true;
        break;
      }
    } catch (err: any) {
      lastError = err;
      if (clientDisconnected) break;
      if (totalCharsStreamed > 0) {
        streamedSuccessfully = true;
        break;
      }
      console.warn(`Streaming attempt with ${candidateModel} failed:`, err?.message?.slice(0, 100));
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
    // If the live model call failed, stream fallback knowledge response without throwing an unhandled 500 error
    console.warn('Falling back to knowledge assistant due to error:', lastError?.message);
    const fallbackText = getKnowledgeFallbackResponse(prompt || '');
    const words = fallbackText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      if (clientDisconnected) break;
      const chunk = words.slice(i, i + 3).join(' ') + ' ';
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      res.flush?.();
      await new Promise((r) => setTimeout(r, 20));
    }
    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  }
}
