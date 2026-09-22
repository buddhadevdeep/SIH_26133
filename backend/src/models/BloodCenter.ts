import mongoose, { Document, Schema } from 'mongoose';

export interface IBloodCenter extends Document {
  id: string;
  name: string;
  licenseNo: string;
  type: 'BLOOD_BANK' | 'STORAGE_UNIT';
  totalCapacity: number;
  currentStock: number;
  phone: string;
  location: string;
  district: string;
  facilityId?: string;
  facilityName?: string;
  componentSeparation: boolean;
  emergencyHotline?: string;
  lastInspectionDate?: string;
}

const BloodCenterSchema = new Schema<IBloodCenter>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    licenseNo: { type: String, required: true },
    type: { type: String, enum: ['BLOOD_BANK', 'STORAGE_UNIT'], default: 'BLOOD_BANK' },
    totalCapacity: { type: Number, default: 500 },
    currentStock: { type: Number, default: 250 },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    district: { type: String, required: true, index: true },
    facilityId: { type: String, index: true },
    facilityName: { type: String },
    componentSeparation: { type: Boolean, default: true },
    emergencyHotline: { type: String },
    lastInspectionDate: { type: String },
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

export const BloodCenterModel = mongoose.model<IBloodCenter>('BloodCenter', BloodCenterSchema);
