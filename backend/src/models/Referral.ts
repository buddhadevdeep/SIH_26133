import mongoose, { Document, Schema } from 'mongoose';

export type ReferralStatus =
  | 'DRAFT'
  | 'CREATED'
  | 'SENT'
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUIRED'
  | 'CLARIFICATION_RECEIVED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'APPOINTMENT_PENDING'
  | 'APPOINTMENT_CONFIRMED'
  | 'CHECKED_IN'
  | 'PATIENT_ARRIVED'
  | 'IN_CONSULTATION'
  | 'CONSULTED'
  | 'OUTCOME_RECORDED'
  | 'COMPLETED'
  | 'CLOSED'
  | 'REROUTED';

export type ReferralPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface IReferralEvent {
  id: string;
  status: ReferralStatus;
  timestamp: string;
  actorName: string;
  actorRole: string;
  facilityName: string;
  notes?: string;
}

export interface IReferral extends Document {
  id: string;
  referralCode: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  abhaId?: string;
  fromFacilityId: string;
  fromFacilityName: string;
  fromDoctorId: string;
  fromDoctorName: string;
  toFacilityId: string;
  toFacilityName: string;
  toSpecialty: string;
  toDoctorId?: string;
  toDoctorName?: string;
  reasonForReferral: string;
  clinicalSummary: string;
  priority: ReferralPriority;
  requiredEquipment?: string[];
  requiredIcu?: boolean;
  status: ReferralStatus;
  slaDeadline: string;
  slaBreached: boolean;
  appointmentId?: string;
  appointmentSlot?: string;
  tokenId?: string;
  tokenNumber?: string;
  clarificationRequest?: {
    requestedBy: string;
    role: string;
    facilityName: string;
    requestedAt: string;
    message: string;
  };
  clarificationResponse?: {
    respondedBy: string;
    role: string;
    respondedAt: string;
    message: string;
  };
  rejectionReason?: string;
  reroutedFromFacilityName?: string;
  clinicalOutcomeNotes?: string;
  consultedDoctorName?: string;
  consultedDoctorSpecialty?: string;
  events: IReferralEvent[];
  createdAt: string;
  updatedAt: string;
}

const ReferralEventSchema = new Schema<IReferralEvent>(
  {
    id: { type: String, required: true },
    status: { type: String, required: true },
    timestamp: { type: String, required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    facilityName: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const ReferralSchema = new Schema<IReferral>(
  {
    id: { type: String, required: true, unique: true, index: true },
    referralCode: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientAge: { type: Number, default: 45 },
    patientGender: { type: String, default: 'M' },
    patientPhone: { type: String, default: '9876543210' },
    abhaId: { type: String },
    fromFacilityId: { type: String, required: true, index: true },
    fromFacilityName: { type: String, default: 'Pethapur Primary Health Centre' },
    fromDoctorId: { type: String, default: 'doc_01', index: true },
    fromDoctorName: { type: String, default: 'Dr. Arvind Patel' },
    toFacilityId: { type: String, required: true, index: true },
    toFacilityName: { type: String, default: 'Gandhinagar Civil Hospital' },
    toSpecialty: { type: String, default: 'General Medicine', index: true },
    toDoctorId: { type: String },
    toDoctorName: { type: String },
    reasonForReferral: { type: String, default: 'Specialist Consultation' },
    clinicalSummary: { type: String, default: 'Referred for clinical evaluation' },
    priority: { type: String, enum: ['ROUTINE', 'URGENT', 'EMERGENCY'], default: 'ROUTINE', index: true },
    requiredEquipment: [{ type: String }],
    requiredIcu: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'CREATED',
        'SENT',
        'RECEIVED',
        'UNDER_REVIEW',
        'CLARIFICATION_REQUIRED',
        'CLARIFICATION_RECEIVED',
        'ACCEPTED',
        'REJECTED',
        'APPOINTMENT_PENDING',
        'APPOINTMENT_CONFIRMED',
        'CHECKED_IN',
        'PATIENT_ARRIVED',
        'IN_CONSULTATION',
        'CONSULTED',
        'OUTCOME_RECORDED',
        'COMPLETED',
        'CLOSED',
        'REROUTED',
      ],
      default: 'CREATED',
      index: true,
    },
    slaDeadline: { type: String, default: () => new Date(Date.now() + 86400000).toISOString() },
    slaBreached: { type: Boolean, default: false },
    appointmentId: { type: String },
    appointmentSlot: { type: String },
    tokenId: { type: String },
    tokenNumber: { type: String },
    clarificationRequest: {
      requestedBy: { type: String },
      role: { type: String },
      facilityName: { type: String },
      requestedAt: { type: String },
      message: { type: String },
    },
    clarificationResponse: {
      respondedBy: { type: String },
      role: { type: String },
      respondedAt: { type: String },
      message: { type: String },
    },
    rejectionReason: { type: String },
    reroutedFromFacilityName: { type: String },
    clinicalOutcomeNotes: { type: String },
    consultedDoctorName: { type: String },
    consultedDoctorSpecialty: { type: String },
    events: [ReferralEventSchema],
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

export const ReferralModel = mongoose.model<IReferral>('Referral', ReferralSchema);
