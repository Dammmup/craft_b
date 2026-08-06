import { put, del } from '@vercel/blob';
import path from 'path';
import { config } from '../config';

function assertBlobToken() {
  if (!config.blobToken) {
    throw new Error('Не задан BLOB_READ_WRITE_TOKEN (Vercel Blob)');
  }
}

export async function uploadProductPhotos(files: Express.Multer.File[]): Promise<string[]> {
  if (!files.length) return [];
  assertBlobToken();

  const urls: string[] = [];
  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `products/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const blob = await put(filename, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      token: config.blobToken,
    });
    urls.push(blob.url);
  }
  return urls;
}

export async function deleteProductPhotos(urls: string[]): Promise<void> {
  if (!urls.length || !config.blobToken) return;

  const blobUrls = urls.filter((u) => u.startsWith('http'));
  if (!blobUrls.length) return;

  try {
    await del(blobUrls, { token: config.blobToken });
  } catch (err) {
    console.error('Не удалось удалить фото из Blob:', err);
  }
}
