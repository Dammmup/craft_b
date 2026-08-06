import { Router, Response } from 'express';
import { Settings } from '../models/Settings';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/public', async (_req, res: Response) => {
  try {
    const settings = await Settings.findOne().select('-passwordHash');
    if (!settings) {
      res.json({
        storeName: 'Craft — стройматериалы',
        phoneNumbers: ['+7 (700) 000-00-00'],
        email: 'info@craft-store.kz',
        address: 'г. Алматы, ул. Строительная, 12',
        workingHours: 'Пн–Сб 9:00–19:00',
        about: 'Продажа строительных материалов оптом и в розницу.',
      });
      return;
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки настроек' });
  }
});

router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { storeName, phoneNumbers, email, address, workingHours, about } = req.body as {
      storeName?: string;
      phoneNumbers?: string[];
      email?: string;
      address?: string;
      workingHours?: string;
      about?: string;
    };

    let settings = await Settings.findOne();
    if (!settings) {
      res.status(404).json({ message: 'Настройки не найдены. Войдите один раз для инициализации.' });
      return;
    }

    if (storeName !== undefined) settings.storeName = storeName;
    if (phoneNumbers !== undefined) settings.phoneNumbers = phoneNumbers.filter(Boolean);
    if (email !== undefined) settings.email = email;
    if (address !== undefined) settings.address = address;
    if (workingHours !== undefined) settings.workingHours = workingHours;
    if (about !== undefined) settings.about = about;

    await settings.save();
    const safe = settings.toObject();
    delete (safe as { passwordHash?: string }).passwordHash;
    res.json(safe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сохранения настроек' });
  }
});

export default router;
