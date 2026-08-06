import { Router, Response } from 'express';
import ExcelJS from 'exceljs';
import { Product } from '../models/Product';
import { Sale } from '../models/Sale';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/products', async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;
    const filter: Record<string, unknown> = {};
    if (typeof category === 'string' && category) filter.category = category;

    const products = await Product.find(filter).sort({ category: 1, name: 1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Craft Store';
    const sheet = workbook.addWorksheet('Товары');

    sheet.columns = [
      { header: 'Наименование', key: 'name', width: 32 },
      { header: 'Категория', key: 'category', width: 18 },
      { header: 'Тип', key: 'type', width: 16 },
      { header: 'Цвет', key: 'color', width: 14 },
      { header: 'Размер', key: 'size', width: 14 },
      { header: 'Количество', key: 'quantity', width: 12 },
      { header: 'Ед.', key: 'unit', width: 8 },
      { header: 'Розничная цена', key: 'retailPrice', width: 16 },
      { header: 'Оптовая цена', key: 'wholesalePrice', width: 14 },
      { header: 'Просмотры', key: 'views', width: 12 },
      { header: 'Активен', key: 'isActive', width: 10 },
      { header: 'Дата создания', key: 'createdAt', width: 18 },
      { header: 'Дата обновления', key: 'updatedAt', width: 18 },
      { header: 'Описание', key: 'description', width: 40 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E2D' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const p of products) {
      sheet.addRow({
        name: p.name,
        category: p.category,
        type: p.type,
        color: p.color,
        size: p.size,
        quantity: p.quantity,
        unit: p.unit,
        retailPrice: p.retailPrice,
        wholesalePrice: p.wholesalePrice,
        views: p.views,
        isActive: p.isActive ? 'Да' : 'Нет',
        createdAt: p.createdAt.toLocaleString('ru-RU'),
        updatedAt: p.updatedAt.toLocaleString('ru-RU'),
        description: p.description,
      });
    }

    const label = category && typeof category === 'string' ? category : 'все';
    const filename = `tovary_${label}_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка экспорта товаров' });
  }
});

router.get('/sales', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, day } = req.query;
    const filter: Record<string, unknown> = {};
    const soldAt: Record<string, Date> = {};

    if (typeof day === 'string' && day) {
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      soldAt.$gte = start;
      soldAt.$lte = end;
    } else {
      if (typeof from === 'string' && from) soldAt.$gte = new Date(from);
      if (typeof to === 'string' && to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        soldAt.$lte = end;
      }
    }

    if (Object.keys(soldAt).length) filter.soldAt = soldAt;

    const sales = await Sale.find(filter).sort({ soldAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Продажи');

    sheet.columns = [
      { header: 'Дата продажи', key: 'soldAt', width: 18 },
      { header: 'Товар', key: 'productName', width: 32 },
      { header: 'Категория', key: 'category', width: 16 },
      { header: 'Кол-во', key: 'quantity', width: 10 },
      { header: 'Цена за ед.', key: 'unitPrice', width: 14 },
      { header: 'Сумма', key: 'totalPrice', width: 14 },
      { header: 'Тип цены', key: 'priceType', width: 12 },
      { header: 'Клиент', key: 'clientName', width: 20 },
      { header: 'Примечание', key: 'note', width: 30 },
    ];

    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E2D' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const priceLabels: Record<string, string> = {
      retail: 'Розница',
      wholesale: 'Опт',
      custom: 'Своя',
    };

    let totalSum = 0;
    for (const s of sales) {
      totalSum += s.totalPrice;
      sheet.addRow({
        soldAt: s.soldAt.toLocaleString('ru-RU'),
        productName: s.productName,
        category: s.category,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
        totalPrice: s.totalPrice,
        priceType: priceLabels[s.priceType] || s.priceType,
        clientName: s.clientName,
        note: s.note,
      });
    }

    sheet.addRow({});
    sheet.addRow({ productName: 'Итого', totalPrice: totalSum });

    const filename = `prodazhi_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка экспорта продаж' });
  }
});

export default router;
