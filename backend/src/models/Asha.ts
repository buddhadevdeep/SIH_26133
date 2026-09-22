import mongoose, { Document, Schema } from 'mongoose';
import { VitalsSchema, IVitals } from './Encounter';

// ASHA Patient
export interface IAshaPatient extends Document {
  id: string;
  ashaId: string;
  ashaName: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  phone: string;
  village: string;
  wardNumber?: string;
  address: string;
  householdId?: string;
  householdHeadName?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  abhaId?: string;
  bloodGroup?: string;
  isHighRisk: boolean;
  highRiskReasons?: string[];
  registeredOffline?: boolean;
  syncStatus?: 'SYNCED' | 'LOCAL_PENDING';
  lastVisitDate?: string;
  nextFollowUpDate?: string;
  latestVitals?: IVitals;
  category?: 'MATERNAL' | 'INFANT' | 'NCD_HYPERTENSION' | 'NCD_DIABETES' | 'ELDERLY' | 'GENERAL';
  gestationalWeek?: number;
  immunizationStage?: string;
  createdAt: string;
}

const AshaPatientSchema = new Schema<IAshaPatient>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ashaId: { type: String, default: 'usr_asha_01', index: true },
    ashaName: { type: String, default: 'Geetaben Parmar' },
    name: { type: String, required: true, index: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['M', 'F', 'Other'], required: true },
    phone: { type: String, required: true, index: true },
    village: { type: String, default: 'Pethapur', index: true },
    wardNumber: { type: String },
    address: { type: String, default: 'Village Main Road, Pethapur' },
    householdId: { type: String },
    householdHeadName: { type: String },
    emergencyContactName: { type: String, default: 'Family Guardian' },
    emergencyContactPhone: { type: String, default: '9876500000' },
    abhaId: { type: String },
    bloodGroup: { type: String },
    isHighRisk: { type: Boolean, default: false, index: true },
    highRiskReasons: [{ type: String }],
    registeredOffline: { type: Boolean, default: false },
    syncStatus: { type: String, enum: ['SYNCED', 'LOCAL_PENDING'], default: 'SYNCED' },
    lastVisitDate: { type: String },
    nextFollowUpDate: { type: String },
    latestVitals: VitalsSchema,
    category: {
      type: String,
      enum: ['MATERNAL', 'INFANT', 'NCD_HYPERTENSION', 'NCD_DIABETES', 'ELDERLY', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    gestationalWeek: { type: Number },
    immunizationStage: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
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

export const AshaPatientModel = mongoose.model<IAshaPatient>('AshaPatient', AshaPatientSchema);

// ASHA Visit
export interface IAshaVisit extends Document {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  village?: string;
  address?: string;
  visitDate: string;
  timeSlot?: string;
  visitType?: string;
  purpose: string;
  notes: string;
  vitalsRecorded?: IVitals;
  screeningConducted?: boolean;
  requiresReferral?: boolean;
  referralReason?: string;
  actionTaken?: string;
  status?: string;
  isCompleted: boolean;
  completedAt?: string;
  nextScheduledDate?: string;
  prescribedByDoctorName?: string;
  prescribedByDoctorSpecialty?: string;
  prescribedByDoctorFacility?: string;
  prescriptionDate?: string;
  prescribedDays?: number;
  doctorInstructions?: string;
  prescribedChecks?: string[];
  priority?: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'HIGH';
}

const AshaVisitSchema = new Schema<IAshaVisit>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String },
    village: { type: String },
    address: { type: String },
    visitDate: { type: String, required: true },
    timeSlot: { type: String },
    visitType: { type: String, default: 'ROUTINE_CHECKUP' },
    purpose: { type: String, required: true },
    notes: { type: String, default: '' },
    vitalsRecorded: VitalsSchema,
    screeningConducted: { type: Boolean, default: false },
    requiresReferral: { type: Boolean, default: false },
    referralReason: { type: String },
    actionTaken: { type: String },
    status: { type: String, default: 'SCHEDULED', index: true },
    isCompleted: { type: Boolean, default: false, index: true },
    completedAt: { type: String },
    nextScheduledDate: { type: String },
    prescribedByDoctorName: { type: String },
    prescribedByDoctorSpecialty: { type: String },
    prescribedByDoctorFacility: { type: String },
    prescriptionDate: { type: String },
    prescribedDays: { type: Number },
    doctorInstructions: { type: String },
    prescribedChecks: [{ type: String }],
    priority: { type: String, enum: ['ROUTINE', 'PRIORITY', 'URGENT', 'HIGH'], default: 'ROUTINE' },
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

export const AshaVisitModel = mongoose.model<IAshaVisit>('AshaVisit', AshaVisitSchema);

// ASHA FollowUpTask
export interface IFollowUpTask extends Document {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  village?: string;
  category?: 'ANC' | 'IMMUNIZATION' | 'NCD' | 'POST_DISCHARGE' | 'TB_FOLLOWUP' | string;
  title?: string;
  taskType?: string;
  description?: string;
  dueDate: string;
  urgency?: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | string;
  isCompleted: boolean;
  completedAt?: string;
  actionRequired?: string;
  priority?: 'ROUTINE' | 'HIGH' | 'CRITICAL';
  notes?: string;
  ashaId?: string;
}

const FollowUpTaskSchema = new Schema<IFollowUpTask>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String },
    village: { type: String },
    category: { type: String },
    title: { type: String },
    taskType: { type: String },
    description: { type: String },
    dueDate: { type: String, required: true },
    urgency: { type: String },
    isCompleted: { type: Boolean, default: false, index: true },
    completedAt: { type: String },
    actionRequired: { type: String },
    priority: { type: String, enum: ['ROUTINE', 'HIGH', 'CRITICAL'], default: 'ROUTINE' },
    notes: { type: String, default: '' },
    ashaId: { type: String, index: true },
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

export const FollowUpTaskModel = mongoose.model<IFollowUpTask>('FollowUpTask', FollowUpTaskSchema);

// Frontline Referral
export interface IFrontlineReferral extends Document {
  id: string;
  referralNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  village: string;
  ashaId?: string;
  ashaName?: string;
  facilityId?: string;
  facilityName?: string;
  targetFacilityId?: string;
  targetFacilityName?: string;
  targetFacilityType?: string;
  department?: string;
  reason: string;
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY' | string;
  ambulanceRequested?: boolean;
  ambulanceStatus?: string;
  status: 'INITIATED' | 'IN_TRANSIT' | 'ACCEPTED_AT_PHC' | 'CONSULTED' | 'COUNTER_REFERRED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | string;
  doctorFeedback?: string;
  notes?: string;
  createdAt: string;
}

const FrontlineReferralSchema = new Schema<IFrontlineReferral>(
  {
    id: { type: String, required: true, unique: true, index: true },
    referralNumber: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientAge: { type: Number, required: true },
    patientGender: { type: String, required: true },
    patientPhone: { type: String, required: true },
    village: { type: String, required: true },
    ashaId: { type: String, index: true },
    ashaName: { type: String },
    facilityId: { type: String, index: true },
    facilityName: { type: String },
    targetFacilityId: { type: String, index: true },
    targetFacilityName: { type: String },
    targetFacilityType: { type: String },
    department: { type: String },
    reason: { type: String, required: true },
    priority: { type: String, default: 'ROUTINE' },
    ambulanceRequested: { type: Boolean, default: false },
    ambulanceStatus: { type: String },
    status: { type: String, default: 'INITIATED', index: true },
    doctorFeedback: { type: String },
    notes: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
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

export const FrontlineReferralModel = mongoose.model<IFrontlineReferral>('FrontlineReferral', FrontlineReferralSchema);

// Screening Session
export interface IScreeningSession extends Document {
  id: string;
  patientId: string;
  patientName: string;
  category: 'MATERNAL' | 'CHILD' | 'NCD' | 'GENERAL';
  conductedBy: string;
  conductedAt: string;
  answers: Array<{
    questionId: string;
    questionText: string;
    answer: any;
    flagRaised?: boolean;
  }>;
  riskFlags: string[];
  riskScore: 'LOW' | 'MODERATE' | 'HIGH';
  recommendedNextAction: string;
  clinicianVerificationRequired: boolean;
  synced: boolean;
}

const ScreeningSessionSchema = new Schema<IScreeningSession>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    category: { type: String, enum: ['MATERNAL', 'CHILD', 'NCD', 'GENERAL'], required: true },
    conductedBy: { type: String, required: true },
    conductedAt: { type: String, default: () => new Date().toISOString() },
    answers: [{ type: Schema.Types.Mixed }],
    riskFlags: [{ type: String }],
    riskScore: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'], default: 'LOW' },
    recommendedNextAction: { type: String, default: '' },
    clinicianVerificationRequired: { type: Boolean, default: true },
    synced: { type: Boolean, default: true },
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

export const ScreeningSessionModel = mongoose.model<IScreeningSession>('ScreeningSession', ScreeningSessionSchema);
