import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISale extends Document {
  product: Types.ObjectId;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceType: 'retail' | 'wholesale' | 'custom';
  clientName: string;
  note: string;
  soldAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new Schema<ISale>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    priceType: { type: String, enum: ['retail', 'wholesale', 'custom'], default: 'retail' },
    clientName: { type: String, default: '' },
    note: { type: String, default: '' },
    soldAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const Sale = mongoose.model<ISale>('Sale', saleSchema);
