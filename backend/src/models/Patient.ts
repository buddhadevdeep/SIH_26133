import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  id: string;
  name: string;
  phone: string;
  gender: 'M' | 'F' | 'Other';
  age: number;
  dob?: string;
  abhaId?: string;
  abhaVerified?: boolean;
  address?: string;
  district?: string;
  pincode?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  registeredAt: string;
  lastVisitAt?: string;
}

const PatientSchema = new Schema<IPatient>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    phone: { type: String, required: true, index: true },
    gender: { type: String, enum: ['M', 'F', 'Other'], required: true },
    age: { type: Number, required: true },
    dob: { type: String },
    abhaId: { type: String, sparse: true, index: true },
    abhaVerified: { type: Boolean, default: false },
    address: { type: String },
    district: { type: String, index: true },
    pincode: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
    registeredAt: { type: String, default: () => new Date().toISOString() },
    lastVisitAt: { type: String },
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

export const PatientModel = mongoose.model<IPatient>('Patient', PatientSchema);
