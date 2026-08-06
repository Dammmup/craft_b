import multer from 'multer';
import path from 'path';
import { Request } from 'express';

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = (file.mimetype.split('/')[1] || '').toLowerCase();
  const ok = allowed.test(ext) && allowed.test(mime);
  if (ok) cb(null, true);
  else cb(new Error('Разрешены только изображения: jpeg, jpg, png, webp, gif'));
}

/** Memory storage — файлы уходят в Vercel Blob, не на локальный диск */
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});
