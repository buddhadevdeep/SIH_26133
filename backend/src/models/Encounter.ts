import mongoose, { Document, Schema } from 'mongoose';

export interface IVitals {
  id?: string;
  patientId: string;
  encounterId?: string;
  recordedBy: string;
  recordedByRole: string;
  recordedAt: string;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  temperatureF?: number;
  bloodSugarMgDl?: number;
  sugarType?: 'FASTING' | 'POST_PRANDIAL' | 'RANDOM';
  spO2?: number;
  respiratoryRate?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  riskLevel: 'NORMAL' | 'NEEDS_ATTENTION' | 'HIGH_RISK';
  riskFlags?: string[];
  notes?: string;
}

export const VitalsSchema = new Schema<IVitals>(
  {
    id: { type: String },
    patientId: { type: String, default: '' },
    encounterId: { type: String },
    recordedBy: { type: String, default: 'Staff/ASHA' },
    recordedByRole: { type: String, default: 'ASHA' },
    recordedAt: { type: String, default: () => new Date().toISOString() },
    systolicBp: { type: Number },
    diastolicBp: { type: Number },
    pulseRate: { type: Number },
    temperatureF: { type: Number },
    bloodSugarMgDl: { type: Number },
    sugarType: { type: String, enum: ['FASTING', 'POST_PRANDIAL', 'RANDOM'] },
    spO2: { type: Number },
    respiratoryRate: { type: Number },
    weightKg: { type: Number },
    heightCm: { type: Number },
    bmi: { type: Number },
    riskLevel: { type: String, enum: ['NORMAL', 'NEEDS_ATTENTION', 'HIGH_RISK'], default: 'NORMAL' },
    riskFlags: [{ type: String }],
    notes: { type: String },
  },
  { _id: false }
);

export interface IDiagnosis {
  id: string;
  encounterId: string;
  patientId: string;
  icdCode?: string;
  conditionName: string;
  type: 'PROVISIONAL' | 'CONFIRMED' | 'DIFFERENTIAL';
  notes?: string;
  diagnosedBy: string;
  diagnosedAt: string;
}

export const DiagnosisSchema = new Schema<IDiagnosis>(
  {
    id: { type: String, required: true },
    encounterId: { type: String, required: true },
    patientId: { type: String, required: true },
    icdCode: { type: String },
    conditionName: { type: String, required: true },
    type: { type: String, enum: ['PROVISIONAL', 'CONFIRMED', 'DIFFERENTIAL'], default: 'CONFIRMED' },
    notes: { type: String },
    diagnosedBy: { type: String, required: true },
    diagnosedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

export interface IEncounter extends Document {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  facilityId: string;
  facilityName: string;
  districtId?: string;
  departmentId?: string;
  appointmentId?: string;
  tokenId?: string;
  type: 'OPD' | 'TELECONSULT' | 'EMERGENCY' | 'FIELD_VISIT';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'REFERRED';
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  clinicalNotes?: string;
  vitals?: IVitals;
  diagnoses: IDiagnosis[];
  prescriptions: any[];
  diagnosticOrders: any[];
  referralId?: string;
  startedAt: string;
  completedAt?: string;
}

const EncounterSchema = new Schema<IEncounter>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    facilityId: { type: String, required: true, index: true },
    facilityName: { type: String, required: true },
    districtId: { type: String, index: true },
    departmentId: { type: String, index: true },
    appointmentId: { type: String, index: true },
    tokenId: { type: String, index: true },
    type: { type: String, enum: ['OPD', 'TELECONSULT', 'EMERGENCY', 'FIELD_VISIT'], default: 'OPD' },
    status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED', 'REFERRED'], default: 'IN_PROGRESS' },
    chiefComplaint: { type: String, required: true },
    historyOfPresentIllness: { type: String },
    physicalExamination: { type: String },
    clinicalNotes: { type: String },
    vitals: VitalsSchema,
    diagnoses: [DiagnosisSchema],
    prescriptions: [{ type: Schema.Types.Mixed }],
    diagnosticOrders: [{ type: Schema.Types.Mixed }],
    referralId: { type: String },
    startedAt: { type: String, default: () => new Date().toISOString() },
    completedAt: { type: String },
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

export const EncounterModel = mongoose.model<IEncounter>('Encounter', EncounterSchema);
