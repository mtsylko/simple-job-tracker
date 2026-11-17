import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config';

// Review stack only (docs/local-environment.md): every proxied request is signed in as REVIEW_TOKEN's user.
const token = process.env.REVIEW_TOKEN;
if (!token) {
  throw new Error('REVIEW_TOKEN is not set — see docs/local-environment.md');
}

const headers = { cookie: `access_token=${token}` };

export default mergeConfig(
  base,
  defineConfig({
    server: {
      proxy: {
        '/api': { headers },
        '/auth': { headers },
        '/uploads': { headers }
      }
    }
  })
);
