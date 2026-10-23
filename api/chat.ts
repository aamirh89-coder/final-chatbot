import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { getValidApiKey, sanitizeGeminiHistory, getKnowledgeFallbackResponse } from './_gemini';

export default async function handler(req: any, res: any) {
  // Support CORS for serverless environments
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

  const apiKey = getValidApiKey();

  // If no valid key is provided on Vercel yet, respond with intelligent guidance without failing 500
  if (!apiKey) {
    const text = getKnowledgeFallbackResponse(prompt || '');
    return res.status(200).json({
      text,
      model: 'knowledge-assistant',
      notice: 'Configure GEMINI_API_KEY in Vercel Project Settings for live AI API calls',
    });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const modelCandidates = Array.from(new Set([model || 'gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite']));
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

  for (const candidateModel of modelCandidates) {
    try {
      const response = await ai.models.generateContent({
        model: candidateModel,
        contents,
        config,
      });

      const responseText = response.text || '';
      if (responseText) {
        return res.status(200).json({
          text: responseText,
          model: candidateModel,
        });
      }
    } catch (err: any) {
      console.warn(`Model ${candidateModel} failed:`, err?.message?.slice(0, 100));
    }
  }

  // Graceful fallback if models were temporarily unavailable
  const fallbackText = getKnowledgeFallbackResponse(prompt || '');
  return res.status(200).json({
    text: fallbackText,
    model: 'gemini-knowledge-fallback',
  });
}
