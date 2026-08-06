import mongoose from 'mongoose';
import { config } from './config';

declare global {
  // eslint-disable-next-line no-var
  var __craftMongoPromise: Promise<typeof mongoose> | undefined;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!global.__craftMongoPromise) {
    global.__craftMongoPromise = mongoose.connect(config.mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    await global.__craftMongoPromise;
    return mongoose;
  } catch (err) {
    global.__craftMongoPromise = undefined;
    throw err;
  }
}
