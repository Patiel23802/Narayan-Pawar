import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { sequelize } from './models/index.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import updateRoutes from './routes/updateRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import representativeRoutes from './routes/representativeRoutes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const port = process.env.PORT || 4000;

const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin === '*' || !corsOrigin ? true : corsOrigin.split(','),
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/emergency-contacts', emergencyRoutes);
app.use('/api/representative', representativeRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  const alterSchema =
    process.env.NODE_ENV === 'development' || process.env.DB_SYNC_ALTER === '1';
  await sequelize.sync({ alter: alterSchema });
  const host = process.env.HOST || '0.0.0.0';
  app.listen(port, host, () => {
    console.log(`Civic Pulse API listening on http://localhost:${port} (bound ${host} — use your LAN IP from a phone)`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
