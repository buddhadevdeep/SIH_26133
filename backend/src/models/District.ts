import mongoose, { Document, Schema } from 'mongoose';

export interface IDistrict extends Document {
  id: string;
  name: string;
  code: string;
  state: string;
  status: 'ACTIVE' | 'INACTIVE';
  headquarters?: string;
  population?: number;
  totalFacilitiesCount?: number;
  totalDoctorsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DistrictSchema = new Schema<IDistrict>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    state: { type: String, default: 'Gujarat', required: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    headquarters: { type: String },
    population: { type: Number, default: 0 },
    totalFacilitiesCount: { type: Number, default: 0 },
    totalDoctorsCount: { type: Number, default: 0 },
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

export const DistrictModel = mongoose.model<IDistrict>('District', DistrictSchema);
