import mongoose, { Document, Schema } from 'mongoose';

export type MedicalStoreType =
  | 'JAN_AUSHADHI'
  | 'HOSPITAL_PHARMACY'
  | 'PRIVATE_CHEMIST'
  | '24X7_EMERGENCY';

export type MedicineStockStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'CALL_TO_VERIFY';

export interface StoreMedicineItem {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  status: MedicineStockStatus;
  quantityAvailable?: number;
  genericPrice?: number;
  brandPrice?: number;
  unit: string;
}

export interface IMedicalStore extends Document {
  id: string;
  name: string;
  type: MedicalStoreType;
  isJanAushadhi: boolean;
  hasLiveApi: boolean;
  licenseNumber: string;
  area: string;
  fullAddress: string;
  pincode: string;
  district: string;
  state: string;
  phone: string;
  whatsappPhone?: string;
  timings: string;
  isOpenNow: boolean;
  rating: number;
  reviewCount: number;
  discountPercentage?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  distanceKm?: number;
  lastSyncTimestamp?: string;
  stockCatalog: StoreMedicineItem[];
}

const MedicalStoreSchema = new Schema<IMedicalStore>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['JAN_AUSHADHI', 'HOSPITAL_PHARMACY', 'PRIVATE_CHEMIST', '24X7_EMERGENCY'],
      index: true,
    },
    isJanAushadhi: { type: Boolean, default: false, index: true },
    hasLiveApi: { type: Boolean, default: true },
    licenseNumber: { type: String, default: 'GJ-GNR-PMBJP-0101' },
    area: { type: String, required: true, index: true },
    fullAddress: { type: String, required: true },
    pincode: { type: String, default: '382021' },
    district: { type: String, default: 'Gandhinagar', index: true },
    state: { type: String, default: 'Gujarat' },
    phone: { type: String, required: true },
    whatsappPhone: { type: String },
    timings: { type: String, default: '8:00 AM - 10:00 PM (All 7 Days)' },
    isOpenNow: { type: Boolean, default: true },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 120 },
    discountPercentage: { type: Number, default: 75 },
    coordinates: {
      lat: { type: Number, required: true, default: 23.2268 },
      lng: { type: Number, required: true, default: 72.6515 },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' },
    },
    distanceKm: { type: Number },
    lastSyncTimestamp: { type: String, default: () => new Date().toISOString() },
    stockCatalog: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        genericName: { type: String, required: true },
        category: { type: String, default: 'General' },
        dosage: { type: String, default: '500mg' },
        status: { type: String, enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'CALL_TO_VERIFY'], default: 'IN_STOCK' },
        quantityAvailable: { type: Number, default: 100 },
        genericPrice: { type: Number, default: 10 },
        brandPrice: { type: Number, default: 40 },
        unit: { type: String, default: 'Strip of 10 Tabs' },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret.id || ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.location;
        return ret;
      },
    },
  }
);

MedicalStoreSchema.pre('save', function (next) {
  if (this.coordinates?.lat && this.coordinates?.lng) {
    this.location = {
      type: 'Point',
      coordinates: [this.coordinates.lng, this.coordinates.lat],
    };
  }
  next();
});

export const MedicalStoreModel = mongoose.model<IMedicalStore>('MedicalStore', MedicalStoreSchema);
