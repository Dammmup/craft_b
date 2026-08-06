import { createApp } from './app';
import { config } from './config';
import { connectDB } from './db';

async function start() {
  await connectDB();
  console.log('MongoDB подключена');

  if (!config.blobToken) {
    console.warn('BLOB_READ_WRITE_TOKEN не задан — загрузка фото товаров не будет работать');
  }

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`API: http://localhost:${config.port}`);
  });
}

// Локальный запуск. На Vercel используется api/index.ts
if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error('Не удалось запустить сервер', err);
    process.exit(1);
  });
}

export default createApp();
