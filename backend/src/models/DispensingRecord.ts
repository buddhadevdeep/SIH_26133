import mongoose, { Document, Schema } from 'mongoose';

export interface IDispensingRecord extends Document {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  facilityId: string;
  facilityName: string;
  dispensedBy: string;
  dispensedAt: string;
  items: Array<{
    medicineName: string;
    genericName?: string;
    batchNumber: string;
    quantity: number;
    unit: string;
    dosageInstructions: string;
  }>;
  pharmacyNotes?: string;
}

const DispensingRecordSchema = new Schema<IDispensingRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    prescriptionId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientAge: { type: Number, required: true },
    patientGender: { type: String, required: true },
    patientPhone: { type: String },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    facilityId: { type: String, required: true, index: true },
    facilityName: { type: String, required: true },
    dispensedBy: { type: String, required: true },
    dispensedAt: { type: String, default: () => new Date().toISOString() },
    items: [
      {
        medicineName: { type: String, required: true },
        genericName: { type: String },
        batchNumber: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: 'Tablets' },
        dosageInstructions: { type: String, default: 'As directed' },
      },
    ],
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

export const DispensingRecordModel = mongoose.model<IDispensingRecord>('DispensingRecord', DispensingRecordSchema);
