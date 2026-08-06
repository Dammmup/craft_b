import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config';
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
    console.log(`Созданы настройки. Пароль по умолчанию: ${config.adminPassword}`);
  }
}

async function start() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB подключена');
  await ensureSettings();

  if (!config.blobToken) {
    console.warn('BLOB_READ_WRITE_TOKEN не задан — загрузка фото товаров не будет работать');
  }

  const app = express();

  const origins = config.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(
    cors({
      origin: origins.length === 1 ? origins[0] : origins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

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

  app.listen(config.port, () => {
    console.log(`API: http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Не удалось запустить сервер', err);
  process.exit(1);
});
