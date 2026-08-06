# Craft Backend

Express + TypeScript + MongoDB API для магазина стройматериалов.

Фото товаров хранятся в **Vercel Blob** (в MongoDB только URL).

## Env

| Переменная | Обязательно | Описание |
|---|---|---|
| `MONGODB_URI` | да | Строка подключения MongoDB |
| `JWT_SECRET` | да | Секрет для JWT |
| `ADMIN_PASSWORD` | да* | Пароль продавца при первом запуске |
| `BLOB_READ_WRITE_TOKEN` | да для фото | Токен Vercel Blob |
| `CORS_ORIGIN` | да | URL фронта, через запятую если несколько |
| `PORT` | нет | Порт API (по умолчанию `4000`) |

\* используется только при создании настроек в БД; дальше пароль меняется в кабинете.

## Запуск

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

## Scripts

- `npm run dev` — разработка
- `npm run build` / `npm start` — продакшен
- `npm run seed` — демо-данные
