# Craft Backend

Express + TypeScript + MongoDB API для магазина стройматериалов.

Фото товаров хранятся в **Vercel Blob** (в MongoDB только URL).

## Env (Vercel → Project → Settings → Environment Variables)

| Переменная | Обязательно | Описание |
|---|---|---|
| `MONGODB_URI` | да | Atlas / MongoDB connection string |
| `JWT_SECRET` | да | Секрет JWT |
| `ADMIN_PASSWORD` | да | Пароль продавца при первом запуске |
| `BLOB_READ_WRITE_TOKEN` | да для фото | Токен Vercel Blob |
| `CORS_ORIGIN` | да | `https://craft-f.vercel.app` |

На Vercel бэкенд работает как Serverless Function (`api/index.ts`).

## Локально

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```
