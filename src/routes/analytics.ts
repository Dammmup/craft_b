import { Router, Response } from 'express';
import { Product } from '../models/Product';
import { Sale } from '../models/Sale';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    const dateFilter: Record<string, Date> = {};
    if (typeof from === 'string' && from) dateFilter.$gte = new Date(from);
    if (typeof to === 'string' && to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const saleMatch = Object.keys(dateFilter).length ? { soldAt: dateFilter } : {};

    const [
      totalProducts,
      inStock,
      outOfStock,
      lowStock,
      salesAgg,
      demand,
      topViews,
      noDemand,
      categoryStats,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, quantity: { $gt: 0 } }),
      Product.countDocuments({ isActive: true, quantity: 0 }),
      Product.countDocuments({ isActive: true, quantity: { $gt: 0, $lte: 10 } }),
      Sale.aggregate([
        { $match: saleMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            totalQty: { $sum: '$quantity' },
            count: { $sum: 1 },
          },
        },
      ]),
      Sale.aggregate([
        { $match: saleMatch },
        {
          $group: {
            _id: '$product',
            productName: { $first: '$productName' },
            category: { $first: '$category' },
            soldQty: { $sum: '$quantity' },
            revenue: { $sum: '$totalPrice' },
            salesCount: { $sum: 1 },
          },
        },
        { $sort: { soldQty: -1 } },
        { $limit: 10 },
      ]),
      Product.find({ isActive: true }).sort({ views: -1 }).limit(10).select('name category views quantity retailPrice photos'),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'sales',
            let: { pid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$product', '$$pid'] },
                  ...(Object.keys(dateFilter).length ? { soldAt: dateFilter } : {}),
                },
              },
            ],
            as: 'sales',
          },
        },
        { $match: { sales: { $size: 0 } } },
        { $project: { name: 1, category: 1, quantity: 1, views: 1, retailPrice: 1, photos: 1 } },
        { $sort: { views: -1 } },
        { $limit: 15 },
      ]),
      Sale.aggregate([
        { $match: saleMatch },
        {
          $group: {
            _id: '$category',
            revenue: { $sum: '$totalPrice' },
            qty: { $sum: '$quantity' },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    const salesSummary = salesAgg[0] || { totalRevenue: 0, totalQty: 0, count: 0 };

    res.json({
      overview: {
        totalProducts,
        inStock,
        outOfStock,
        lowStock,
        totalRevenue: salesSummary.totalRevenue,
        totalSoldQty: salesSummary.totalQty,
        salesCount: salesSummary.count,
      },
      demand,
      topViews,
      noDemand,
      categoryStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка аналитики' });
  }
});

export default router;
