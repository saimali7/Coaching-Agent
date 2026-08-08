import { Router } from 'express';
import { env } from '../env.js';

export const voiceRouter: Router = Router();

function isConfigured(): boolean {
  return Boolean(env.elevenLabsApiKey && env.elevenLabsAgentId);
}

voiceRouter.get('/status', (_req, res) => {
  res.json({ configured: isConfigured(), agentId: env.elevenLabsAgentId || null });
});

voiceRouter.get('/signed-url', async (_req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Voice agent not configured' });
  }

  const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url');
  url.searchParams.set('agent_id', env.elevenLabsAgentId);

  const response = await fetch(url, {
    headers: { 'xi-api-key': env.elevenLabsApiKey },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[voice] signed-url request failed: ${response.status} ${body}`);
    return res.status(502).json({ error: 'Failed to get signed URL' });
  }

  const data = (await response.json()) as { signed_url: string };
  res.json({ signedUrl: data.signed_url });
});
