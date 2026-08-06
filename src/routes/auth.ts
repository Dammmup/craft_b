import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Settings } from '../models/Settings';
import { config } from '../config';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res: Response) => {
  try {
    const { password } = req.body as { password?: string };
    if (!password) {
      res.status(400).json({ message: 'Введите пароль' });
      return;
    }

    let settings = await Settings.findOne();
    if (!settings) {
      const passwordHash = await bcrypt.hash(config.adminPassword, 10);
      settings = await Settings.create({ passwordHash });
    }

    const valid = await bcrypt.compare(password, settings.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Неверный пароль' });
      return;
    }

    const token = jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: '7d' });
    res.json({ token, message: 'Вход выполнен' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка входа' });
  }
});

router.get('/me', requireAuth, (_req: AuthRequest, res: Response) => {
  res.json({ authenticated: true });
});

router.post('/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword || newPassword.length < 4) {
      res.status(400).json({ message: 'Укажите текущий и новый пароль (мин. 4 символа)' });
      return;
    }

    const settings = await Settings.findOne();
    if (!settings) {
      res.status(404).json({ message: 'Настройки не найдены' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, settings.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Текущий пароль неверен' });
      return;
    }

    settings.passwordHash = await bcrypt.hash(newPassword, 10);
    await settings.save();
    res.json({ message: 'Пароль изменён' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка смены пароля' });
  }
});

export default router;
