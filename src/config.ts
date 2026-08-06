import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/craft-store',
  jwtSecret: process.env.JWT_SECRET || 'craft-dev-secret',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || '',
};
