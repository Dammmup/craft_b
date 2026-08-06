import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  category: string;
  type: string;
  color: string;
  size: string;
  quantity: number;
  retailPrice: number;
  wholesalePrice: number;
  description: string;
  unit: string;
  photos: string[];
  views: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    type: { type: String, required: true, trim: true },
    color: { type: String, default: '', trim: true },
    size: { type: String, default: '', trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    retailPrice: { type: Number, required: true, min: 0 },
    wholesalePrice: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    unit: { type: String, default: 'шт.' },
    photos: { type: [String], default: [] },
    views: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', category: 'text', type: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);
