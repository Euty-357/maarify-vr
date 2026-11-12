import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

/**
 * Build identity. Dev servers get a new id every start so a stale headset page is
 * immediately obvious; production builds get the commit hash plus build timestamp.
 */
const buildId = (() => {
  let hash = 'nogit';
  try {
    hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    /* not a git checkout */
  }
  return `${hash}-${Date.now()}`;
})();

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  plugins: [
    {
      name: 'maarify-build-id',
      configureServer(server) {
        server.middlewares.use('/__build', (_request, response) => {
          response.setHeader('Cache-Control', 'no-store');
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ buildId }));
        });
      },
    },
  ],
  build: {
    target: 'esnext',
  },
});
