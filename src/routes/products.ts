import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Product } from '../models/Product';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { config } from '../config';
import { deleteProductPhotos, uploadProductPhotos } from '../utils/blob';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      category,
      search,
      sort = 'newest',
      page = '1',
      limit = '24',
      inStock,
      admin,
    } = req.query;

    const filter: Record<string, unknown> = {};
    const wantsAdmin = admin === '1';
    if (wantsAdmin) {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Требуется авторизация' });
        return;
      }
      try {
        jwt.verify(header.slice(7), config.jwtSecret);
      } catch {
        res.status(401).json({ message: 'Недействительный токен' });
        return;
      }
    } else {
      filter.isActive = true;
    }
    if (category && typeof category === 'string') filter.category = category;
    if (inStock === '1') filter.quantity = { $gt: 0 };
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { type: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 24));
    const skip = (pageNum - 1) * limitNum;

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { retailPrice: 1 };
    if (sort === 'price-desc') sortOption = { retailPrice: -1 };
    if (sort === 'popular') sortOption = { views: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'stock') sortOption = { quantity: -1 };

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки товаров' });
  }
});

router.get('/categories', async (_req, res: Response) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(categories.map((c) => ({ name: c._id as string, count: c.count as number })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки категорий' });
  }
});

router.get('/:id', async (req, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      res.status(404).json({ message: 'Товар не найден' });
      return;
    }
    product.views += 1;
    await product.save();
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки товара' });
  }
});

router.post('/', requireAuth, upload.array('photos', 8), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as Record<string, string>;
    const files = (req.files as Express.Multer.File[]) || [];
    const photos = await uploadProductPhotos(files);

    const product = await Product.create({
      name: body.name,
      category: body.category,
      type: body.type,
      color: body.color || '',
      size: body.size || '',
      quantity: Number(body.quantity) || 0,
      retailPrice: Number(body.retailPrice) || 0,
      wholesalePrice: Number(body.wholesalePrice) || 0,
      description: body.description || '',
      unit: body.unit || 'шт.',
      photos,
      isActive: body.isActive !== 'false',
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Ошибка создания товара',
    });
  }
});

router.put('/:id', requireAuth, upload.array('photos', 8), async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Товар не найден' });
      return;
    }

    const body = req.body as Record<string, string>;
    const files = (req.files as Express.Multer.File[]) || [];

    if (body.name !== undefined) product.name = body.name;
    if (body.category !== undefined) product.category = body.category;
    if (body.type !== undefined) product.type = body.type;
    if (body.color !== undefined) product.color = body.color;
    if (body.size !== undefined) product.size = body.size;
    if (body.quantity !== undefined) product.quantity = Number(body.quantity);
    if (body.retailPrice !== undefined) product.retailPrice = Number(body.retailPrice);
    if (body.wholesalePrice !== undefined) product.wholesalePrice = Number(body.wholesalePrice);
    if (body.description !== undefined) product.description = body.description;
    if (body.unit !== undefined) product.unit = body.unit;
    if (body.isActive !== undefined) product.isActive = body.isActive !== 'false';

    if (body.removePhotos) {
      try {
        const toRemove: string[] = JSON.parse(body.removePhotos);
        await deleteProductPhotos(toRemove);
        product.photos = product.photos.filter((p) => !toRemove.includes(p));
      } catch {
        /* ignore parse errors */
      }
    }

    if (files.length) {
      const uploaded = await uploadProductPhotos(files);
      product.photos.push(...uploaded);
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Ошибка обновления товара',
    });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Товар не найден' });
      return;
    }

    await deleteProductPhotos(product.photos);

    res.json({ message: 'Товар удалён' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка удаления товара' });
  }
});

export default router;
