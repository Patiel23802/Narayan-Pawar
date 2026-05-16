/**
 * PM2 process file — run from this directory (`backend/`).
 *
 *   npm install          # installs pm2 as a devDependency
 *   npm run pm2:start:prod
 *   npm run pm2:logs
 *
 * Production env vars (DATABASE_URL, JWT_SECRET, etc.) are read from `.env`
 * via dotenv in `src/server.js`; keep `.env` on the server beside this file.
 */
module.exports = {
  apps: [
    {
      name: 'civic-pulse-api',
      cwd: __dirname,
      script: 'src/server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 15,
      min_uptime: '10s',
      max_memory_restart: '512M',
      kill_timeout: 5_000,
      listen_timeout: 10_000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
