import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { connectDB } from './db';
import { Settings } from './models/Settings';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import salesRoutes from './routes/sales';
import analyticsRoutes from './routes/analytics';
import exportRoutes from './routes/export';
import settingsRoutes from './routes/settings';

async function ensureSettings() {
  const existing = await Settings.findOne();
  if (!existing) {
    const passwordHash = await bcrypt.hash(config.adminPassword, 10);
    await Settings.create({ passwordHash });
    console.log('Созданы настройки магазина');
  }
}

function parseOrigins(): string[] {
  const raw = config.corsOrigin || '';
  const list = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const defaults = [
    'https://craft-f.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  return Array.from(new Set([...list, ...defaults]));
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: parseOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '2mb' }));

  app.use(async (_req, res, next) => {
    try {
      await connectDB();
      await ensureSettings();
      next();
    } catch (err) {
      console.error('DB connection failed', err);
      res.status(500).json({
        message:
          err instanceof Error
            ? `Ошибка БД: ${err.message}`
            : 'Не удалось подключиться к MongoDB. Проверьте MONGODB_URI.',
      });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      mongo: mongoose.connection.readyState === 1,
      blob: Boolean(config.blobToken),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Внутренняя ошибка сервера' });
  });

  return app;
}
