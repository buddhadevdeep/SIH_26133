import mongoose, { Document, Schema } from 'mongoose';

export interface IDistrictAdmin extends Document {
  id: string;
  name: string;
  username?: string;
  password?: string;
  designation: string;
  districtId?: string;
  district: string;
  state: string;
  email: string;
  phone: string;
  appointedAt: string;
  appointedBy: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  jurisdictionFacilitiesCount: number;
  jurisdictionPopulation: number;
  privileges: string[];
}

const DistrictAdminSchema = new Schema<IDistrictAdmin>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    username: { type: String, index: true },
    password: { type: String },
    designation: { type: String, default: 'Chief District Health Officer (CDHO)' },
    districtId: { type: String, index: true },
    district: { type: String, required: true, index: true },
    state: { type: String, default: 'Gujarat' },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    appointedAt: { type: String, default: () => new Date().toISOString() },
    appointedBy: { type: String, default: 'State Health Authority (Super Admin)' },
    status: { type: String, enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED'], default: 'ACTIVE', index: true },
    jurisdictionFacilitiesCount: { type: Number, default: 12 },
    jurisdictionPopulation: { type: Number, default: 1500000 },
    privileges: [{ type: String }],
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

export const DistrictAdminModel = mongoose.model<IDistrictAdmin>('DistrictAdmin', DistrictAdminSchema);
