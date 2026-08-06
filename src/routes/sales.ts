import { Router, Response } from 'express';
import { Sale } from '../models/Sale';
import { Product } from '../models/Product';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, page = '1', limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};

    if (from || to) {
      const soldAt: Record<string, Date> = {};
      if (typeof from === 'string' && from) soldAt.$gte = new Date(from);
      if (typeof to === 'string' && to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        soldAt.$lte = end;
      }
      filter.soldAt = soldAt;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Sale.find(filter).sort({ soldAt: -1 }).skip(skip).limit(limitNum).populate('product', 'name photos'),
      Sale.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки продаж' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      productId,
      quantity,
      unitPrice,
      priceType = 'retail',
      clientName = '',
      note = '',
      soldAt,
    } = req.body as {
      productId?: string;
      quantity?: number;
      unitPrice?: number;
      priceType?: 'retail' | 'wholesale' | 'custom';
      clientName?: string;
      note?: string;
      soldAt?: string;
    };

    if (!productId || !quantity || quantity < 1) {
      res.status(400).json({ message: 'Укажите товар и количество' });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Товар не найден' });
      return;
    }

    if (product.quantity < quantity) {
      res.status(400).json({
        message: `Недостаточно на складе. Доступно: ${product.quantity} ${product.unit}`,
      });
      return;
    }

    let price = Number(unitPrice);
    if (priceType === 'retail') price = product.retailPrice;
    if (priceType === 'wholesale') price = product.wholesalePrice;
    if (priceType === 'custom' && (unitPrice === undefined || Number.isNaN(price))) {
      res.status(400).json({ message: 'Укажите цену продажи' });
      return;
    }

    const sale = await Sale.create({
      product: product._id,
      productName: product.name,
      category: product.category,
      quantity,
      unitPrice: price,
      totalPrice: price * quantity,
      priceType,
      clientName,
      note,
      soldAt: soldAt ? new Date(soldAt) : new Date(),
    });

    product.quantity -= quantity;
    await product.save();

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка создания продажи' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      res.status(404).json({ message: 'Продажа не найдена' });
      return;
    }

    const product = await Product.findById(sale.product);
    if (product) {
      product.quantity += sale.quantity;
      await product.save();
    }

    await sale.deleteOne();
    res.json({ message: 'Продажа удалена, остаток восстановлен' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка удаления продажи' });
  }
});

export default router;
