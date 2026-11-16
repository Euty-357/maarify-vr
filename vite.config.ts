import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

const isWifiMode = process.env['MAARIFY_WIFI'] === '1';

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  test: {
    // Run in development mode so import.meta.env.DEV === true in all tests,
    // which allows the debug logger's LOGGER_ENABLED gate to pass.
    mode: 'development',
    environment: 'jsdom',
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
    // SSL is only applied when MAARIFY_WIFI=1 (npm run quest:wifi).
    // In normal dev (npm run dev / npm run quest) isWifiMode is false and the
    // plugin is omitted, so the server stays plain HTTP for adb-reverse localhost.
    ...(isWifiMode ? [basicSsl()] : []),
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
    {
      name: 'maarify-log-endpoint',
      configureServer(server) {
        const LOG_DIR = join(process.cwd(), 'logs');
        const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
        const SESSION_TS = Date.now();

        // Level → ANSI colour codes
        const COLOURS: Record<string, string> = {
          debug: '\x1b[90m',  // grey
          info: '\x1b[36m',   // cyan
          warn: '\x1b[33m',   // yellow
          error: '\x1b[31m',  // red
          reset: '\x1b[0m',
        };

        // Ensure logs/ directory exists
        if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

        let currentLogPath = join(LOG_DIR, `session-${SESSION_TS}.ndjson`);
        let logStream = createWriteStream(currentLogPath, { flags: 'a' });

        function rotateIfNeeded(): void {
          try {
            const stats = statSync(currentLogPath);
            if (stats.size >= MAX_FILE_BYTES) {
              logStream.end();
              currentLogPath = join(LOG_DIR, `session-${Date.now()}.ndjson`);
              logStream = createWriteStream(currentLogPath, { flags: 'a' });
            }
          } catch {
            /* file may not exist yet */
          }
        }

        server.middlewares.use('/__log', (request, response) => {
          if (request.method !== 'POST') {
            response.writeHead(405).end();
            return;
          }
          const chunks: Buffer[] = [];
          request.on('data', (chunk: Buffer) => chunks.push(chunk));
          request.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            const lines = body.split('\n').filter((l) => l.trim().length > 0);
            for (const line of lines) {
              try {
                const event = JSON.parse(line) as { level?: string; category?: string; seq?: number };
                const level = event.level ?? 'debug';
                const colour = COLOURS[level] ?? COLOURS.debug;
                const reset = COLOURS.reset;
                const prefix = `[maarify-log] ${colour}${level.toUpperCase().padEnd(5)}${reset} [${event.category ?? '?'}] seq=${event.seq ?? '?'}`;
                process.stdout.write(`${prefix}\n`);
              } catch {
                process.stdout.write(`[maarify-log] (unparseable) ${line.slice(0, 120)}\n`);
              }
              rotateIfNeeded();
              logStream.write(line + '\n');
            }
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ ok: true, lines: lines.length }));
          });
          request.on('error', () => response.writeHead(500).end());
        });
      },
    },
  ],
  build: {
    target: 'esnext',
  },
});
