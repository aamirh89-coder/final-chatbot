export default function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  return res.status(200).json({
    status: 'ok',
    defaultModel: 'gemini-3.8-flash',
    platform: process.env.VERCEL ? 'vercel-serverless' : 'node',
    timestamp: new Date().toISOString(),
  });
}
