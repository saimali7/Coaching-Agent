export const env = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? '',
  elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID ?? '',
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb',
  // Absolute path to the built frontend. Unset means "look next door at
  // apps/web/dist"; serving is skipped entirely when that build is absent.
  webDist: process.env.WEB_DIST || null,
};
