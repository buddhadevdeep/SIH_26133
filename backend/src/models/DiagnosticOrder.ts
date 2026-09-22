import mongoose, { Document, Schema } from 'mongoose';

export type DiagnosticOrderStatus =
  | 'ORDERED'
  | 'AWAITING_SAMPLE'
  | 'SAMPLE_COLLECTED'
  | 'SAMPLE_RECEIVED'
  | 'PROCESSING'
  | 'RESULT_SUBMITTED'
  | 'REPORT_READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface ILabResultParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
}

export interface IDiagnosticOrder extends Document {
  id: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone?: string;
  patientAbha?: string;
  testName: string;
  testCategory: 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'RADIOLOGY' | 'MICROBIOLOGY' | 'PATHOLOGY';
  priority?: 'ROUTINE' | 'URGENT' | 'STAT';
  orderedBy: string;
  orderedAt: string;
  facilityId: string;
  facilityName: string;
  status: DiagnosticOrderStatus;
  sampleId?: string;
  sampleType?: string;
  containerType?: string;
  barcodeNumber?: string;
  sampleCollectedAt?: string;
  sampleReceivedAt?: string;
  processedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  rejectionNotes?: string;
  resultParameters?: ILabResultParameter[];
  resultSummary?: string;
  reportFileUrl?: string;
  isAbnormal?: boolean;
  notes?: string;
  technicianName?: string;
}

const LabResultParameterSchema = new Schema<ILabResultParameter>(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    unit: { type: String, default: '' },
    referenceRange: { type: String, default: '' },
    status: { type: String, enum: ['NORMAL', 'ABNORMAL', 'CRITICAL'], default: 'NORMAL' },
  },
  { _id: false }
);

const DiagnosticOrderSchema = new Schema<IDiagnosticOrder>(
  {
    id: { type: String, required: true, unique: true, index: true },
    encounterId: { type: String, default: '', index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientAge: { type: Number, required: true },
    patientGender: { type: String, required: true },
    patientPhone: { type: String },
    patientAbha: { type: String },
    testName: { type: String, required: true, index: true },
    testCategory: {
      type: String,
      enum: ['HEMATOLOGY', 'BIOCHEMISTRY', 'RADIOLOGY', 'MICROBIOLOGY', 'PATHOLOGY'],
      required: true,
      index: true,
    },
    priority: { type: String, enum: ['ROUTINE', 'URGENT', 'STAT'], default: 'ROUTINE', index: true },
    orderedBy: { type: String, required: true },
    orderedAt: { type: String, default: () => new Date().toISOString() },
    facilityId: { type: String, required: true, index: true },
    facilityName: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'ORDERED',
        'AWAITING_SAMPLE',
        'SAMPLE_COLLECTED',
        'SAMPLE_RECEIVED',
        'PROCESSING',
        'RESULT_SUBMITTED',
        'REPORT_READY',
        'COMPLETED',
        'CANCELLED',
        'REJECTED',
      ],
      default: 'AWAITING_SAMPLE',
      index: true,
    },
    sampleId: { type: String },
    sampleType: { type: String },
    containerType: { type: String },
    barcodeNumber: { type: String },
    sampleCollectedAt: { type: String },
    sampleReceivedAt: { type: String },
    processedAt: { type: String },
    completedAt: { type: String },
    rejectionReason: { type: String },
    rejectionNotes: { type: String },
    resultParameters: [LabResultParameterSchema],
    resultSummary: { type: String },
    reportFileUrl: { type: String },
    isAbnormal: { type: Boolean, default: false },
    notes: { type: String },
    technicianName: { type: String },
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

export const DiagnosticOrderModel = mongoose.model<IDiagnosticOrder>('DiagnosticOrder', DiagnosticOrderSchema);
