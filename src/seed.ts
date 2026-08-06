import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { Product } from './models/Product';
import { Settings } from './models/Settings';
import { Sale } from './models/Sale';

const products = [
  {
    name: 'Цемент М500 Портланд',
    category: 'Вяжущие',
    type: 'Цемент',
    color: 'Серый',
    size: '50 кг',
    quantity: 240,
    retailPrice: 2850,
    wholesalePrice: 2550,
    unit: 'меш.',
    description: 'Высококачественный портландцемент для фундаментов и несущих конструкций.',
    views: 128,
  },
  {
    name: 'Кирпич керамический рядовой',
    category: 'Кирпич',
    type: 'Керамический',
    color: 'Красный',
    size: '250×120×65',
    quantity: 8500,
    retailPrice: 95,
    wholesalePrice: 78,
    unit: 'шт.',
    description: 'Рядовой полнотелый кирпич для кладки стен.',
    views: 210,
  },
  {
    name: 'Газоблок D500',
    category: 'Блоки',
    type: 'Газобетон',
    color: 'Белый',
    size: '600×300×200',
    quantity: 420,
    retailPrice: 1450,
    wholesalePrice: 1280,
    unit: 'шт.',
    description: 'Автоклавный газобетонный блок для тёплых стен.',
    views: 176,
  },
  {
    name: 'Арматура А500С Ø12',
    category: 'Металлопрокат',
    type: 'Арматура',
    color: 'Чёрный',
    size: 'Ø12 мм / 11.7 м',
    quantity: 180,
    retailPrice: 4200,
    wholesalePrice: 3900,
    unit: 'шт.',
    description: 'Рифлёная арматура для железобетонных конструкций.',
    views: 95,
  },
  {
    name: 'Профнастил С8',
    category: 'Кровля',
    type: 'Профлист',
    color: 'Коричневый RAL 8017',
    size: '1.2×2 м',
    quantity: 95,
    retailPrice: 3100,
    wholesalePrice: 2750,
    unit: 'лист',
    description: 'Стеновой и кровельный профнастил с полимерным покрытием.',
    views: 64,
  },
  {
    name: 'Гипсокартон влагостойкий',
    category: 'Отделка',
    type: 'ГКЛВ',
    color: 'Зелёный',
    size: '2500×1200×12.5',
    quantity: 160,
    retailPrice: 3200,
    wholesalePrice: 2900,
    unit: 'лист',
    description: 'Влагостойкий гипсокартон для ванных и кухонь.',
    views: 88,
  },
  {
    name: 'Песок строительный мытый',
    category: 'Сыпучие',
    type: 'Песок',
    color: 'Жёлтый',
    size: '1 м³',
    quantity: 45,
    retailPrice: 8500,
    wholesalePrice: 7200,
    unit: 'м³',
    description: 'Мытый карьерный песок для бетона и штукатурки.',
    views: 52,
  },
  {
    name: 'Щебень фракция 5–20',
    category: 'Сыпучие',
    type: 'Щебень',
    color: 'Серый',
    size: '1 м³',
    quantity: 30,
    retailPrice: 9800,
    wholesalePrice: 8500,
    unit: 'м³',
    description: 'Гранитный щебень для бетонных смесей.',
    views: 41,
  },
  {
    name: 'Утеплитель минеральная вата',
    category: 'Утепление',
    type: 'Минвата',
    color: 'Жёлтый',
    size: '100×600×1200',
    quantity: 0,
    retailPrice: 4800,
    wholesalePrice: 4300,
    unit: 'уп.',
    description: 'Плиты каменной ваты для фасадов и кровли. Временно нет в наличии.',
    views: 33,
  },
  {
    name: 'Краска фасадная акриловая',
    category: 'Отделка',
    type: 'Краска',
    color: 'Белый',
    size: '10 л',
    quantity: 72,
    retailPrice: 8900,
    wholesalePrice: 7900,
    unit: 'ведр.',
    description: 'Атмосферостойкая фасадная краска.',
    views: 27,
  },
];

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('Очистка и заполнение базы...');

  await Promise.all([Product.deleteMany({}), Sale.deleteMany({}), Settings.deleteMany({})]);

  const passwordHash = await bcrypt.hash(config.adminPassword, 10);
  await Settings.create({
    passwordHash,
    storeName: 'Craft — стройматериалы',
    phoneNumbers: ['+7 (777) 123-45-67', '+7 (701) 987-65-43'],
    email: 'info@craft-store.kz',
    address: 'г. Алматы, ул. Строительная, 12',
    workingHours: 'Пн–Сб 9:00–19:00, Вс — выходной',
    about:
      'Магазин строительных материалов Craft. Оптом и в розницу: цемент, кирпич, блоки, металлопрокат, кровля и отделка. Самовывоз и доставка.',
  });

  const created = await Product.insertMany(products);

  const cement = created.find((p) => p.name.includes('Цемент'));
  const brick = created.find((p) => p.name.includes('Кирпич'));
  const block = created.find((p) => p.name.includes('Газоблок'));

  if (cement && brick && block) {
    const sales = [
      {
        product: cement._id,
        productName: cement.name,
        category: cement.category,
        quantity: 20,
        unitPrice: cement.wholesalePrice,
        totalPrice: cement.wholesalePrice * 20,
        priceType: 'wholesale' as const,
        clientName: 'ТОО СтройАльянс',
        soldAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        product: brick._id,
        productName: brick.name,
        category: brick.category,
        quantity: 500,
        unitPrice: brick.retailPrice,
        totalPrice: brick.retailPrice * 500,
        priceType: 'retail' as const,
        clientName: 'Иванов А.',
        soldAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        product: block._id,
        productName: block.name,
        category: block.category,
        quantity: 40,
        unitPrice: block.wholesalePrice,
        totalPrice: block.wholesalePrice * 40,
        priceType: 'wholesale' as const,
        clientName: 'ИП Нургалиев',
        soldAt: new Date(),
      },
    ];

    await Sale.insertMany(sales);
    cement.quantity -= 20;
    brick.quantity -= 500;
    block.quantity -= 40;
    await Promise.all([cement.save(), brick.save(), block.save()]);
  }

  console.log(`Готово: ${created.length} товаров. Пароль: ${config.adminPassword}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
