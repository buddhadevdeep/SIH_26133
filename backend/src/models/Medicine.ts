import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine extends Document {
  id: string;
  facilityId: string;
  medicineName: string;
  genericName: string;
  category: string;
  batchNumber: string;
  availableQuantity: number;
  minimumStockThreshold: number;
  unit: string;
  expiryDate: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'EXPIRING_SOON' | 'OUT_OF_STOCK' | 'QUARANTINED';
  quarantineReason?: string;
  lastUpdated: string;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    id: { type: String, required: true, unique: true, index: true },
    facilityId: { type: String, required: true, index: true },
    medicineName: { type: String, required: true, index: true },
    genericName: { type: String, required: true, index: true },
    category: { type: String, required: true },
    batchNumber: { type: String, required: true, index: true },
    availableQuantity: { type: Number, required: true, min: 0 },
    minimumStockThreshold: { type: Number, default: 20 },
    unit: { type: String, default: 'Tablets' },
    expiryDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['IN_STOCK', 'LOW_STOCK', 'EXPIRING_SOON', 'OUT_OF_STOCK', 'QUARANTINED'],
      default: 'IN_STOCK',
      index: true,
    },
    quarantineReason: { type: String },
    lastUpdated: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret.id || ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const MedicineModel = mongoose.model<IMedicine>('Medicine', MedicineSchema);
