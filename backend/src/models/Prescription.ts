import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescriptionItem {
  id: string;
  medicineName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
  dispensedStatus: 'PENDING' | 'PARTIALLY_DISPENSED' | 'DISPENSED';
  dispensedQuantity?: number;
  totalQuantity: number;
}

export interface IPrescription extends Document {
  id: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  facilityId: string;
  facilityName: string;
  issuedAt: string;
  diagnosisSummary: string;
  items: IPrescriptionItem[];
  status: 'PENDING' | 'PARTIALLY_DISPENSED' | 'DISPENSED';
  pharmacyNotes?: string;
}

const PrescriptionItemSchema = new Schema<IPrescriptionItem>(
  {
    id: { type: String, required: true },
    medicineName: { type: String, required: true },
    genericName: { type: String },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    route: { type: String, default: 'Oral' },
    instructions: { type: String },
    dispensedStatus: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED'],
      default: 'PENDING',
    },
    dispensedQuantity: { type: Number, default: 0 },
    totalQuantity: { type: Number, required: true },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    id: { type: String, required: true, unique: true, index: true },
    encounterId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    facilityId: { type: String, required: true, index: true },
    facilityName: { type: String, required: true },
    issuedAt: { type: String, default: () => new Date().toISOString() },
    diagnosisSummary: { type: String, default: '' },
    items: [PrescriptionItemSchema],
    status: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED'],
      default: 'PENDING',
      index: true,
    },
    pharmacyNotes: { type: String },
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

export const PrescriptionModel = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
