import { createApp } from './app.js';
import { env } from './env.js';
import { ensureVoiceAgent } from './voice/bootstrap.js';

ensureVoiceAgent();

createApp().listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
