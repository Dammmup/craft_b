import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  storeName: string;
  phoneNumbers: string[];
  email: string;
  address: string;
  workingHours: string;
  about: string;
  passwordHash: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: 'Craft — стройматериалы' },
    phoneNumbers: { type: [String], default: ['+7 (700) 000-00-00'] },
    email: { type: String, default: 'info@craft-store.kz' },
    address: { type: String, default: 'г. Алматы, ул. Строительная, 12' },
    workingHours: { type: String, default: 'Пн–Сб 9:00–19:00' },
    about: {
      type: String,
      default: 'Продажа строительных материалов оптом и в розницу. Доставка по городу.',
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
