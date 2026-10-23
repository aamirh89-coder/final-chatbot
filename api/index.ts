export default function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    name: 'Gemini AI Chat Studio API',
    status: 'online',
    endpoints: {
      stream: 'POST /api/chat/stream',
      unary: 'POST /api/chat',
      health: 'GET /api/health',
    },
    version: '1.0.0',
  });
}
