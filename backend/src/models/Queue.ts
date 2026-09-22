import mongoose, { Document, Schema } from 'mongoose';

export type TokenStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'NO_SHOW'
  | 'CANCELLED';

export type PriorityLevel = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface IToken extends Document {
  id: string;
  tokenNumber: string;
  sequenceNumber?: number;
  date?: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'Other';
  patientPhone: string;
  facilityId: string;
  facilityName: string;
  districtId?: string;
  departmentId: string;
  departmentName: string;
  doctorId?: string;
  doctorName?: string;
  roomNumber?: string;
  counter?: string;
  status: TokenStatus;
  priority: PriorityLevel;
  positionInQueue: number;
  estimatedWaitMinutes: number;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  referralId?: string;
  referralCode?: string;
}

const TokenSchema = new Schema<IToken>(
  {
    id: { type: String, required: true, unique: true, index: true },
    tokenNumber: { type: String, required: true, index: true },
    sequenceNumber: { type: Number },
    date: { type: String, index: true },
    appointmentId: { type: String, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientAge: { type: Number, default: 45 },
    patientGender: { type: String, enum: ['M', 'F', 'Other'], default: 'M' },
    patientPhone: { type: String, required: true },
    facilityId: { type: String, required: true, index: true },
    facilityName: { type: String, required: true },
    districtId: { type: String, index: true },
    departmentId: { type: String, required: true, index: true },
    departmentName: { type: String, required: true },
    doctorId: { type: String, index: true },
    doctorName: { type: String },
    roomNumber: { type: String, default: 'Room 1' },
    counter: { type: String },
    status: {
      type: String,
      enum: ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'NO_SHOW', 'CANCELLED'],
      default: 'WAITING',
      index: true,
    },
    priority: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'EMERGENCY'],
      default: 'ROUTINE',
      index: true,
    },
    positionInQueue: { type: Number, default: 0 },
    estimatedWaitMinutes: { type: Number, default: 15 },
    createdAt: { type: String, default: () => new Date().toISOString() },
    calledAt: { type: String },
    completedAt: { type: String },
    referralId: { type: String },
    referralCode: { type: String },
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

export const TokenModel = mongoose.model<IToken>('Token', TokenSchema);

// Appointment
export interface IAppointment extends Document {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: 'M' | 'F' | 'Other';
  facilityId: string;
  facilityName: string;
  districtId?: string;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  roomNumber?: string;
  departmentId?: string;
  departmentName?: string;
  date: string;
  timeSlot: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_QUEUE' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  type: 'IN_PERSON' | 'TELECONSULT';
  reasonForVisit: string;
  createdAt: string;
  tokenId?: string;
  tokenNumber?: string;
  checkedInAt?: string;
  referralId?: string;
  referralCode?: string;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    patientAge: { type: Number },
    patientGender: { type: String, enum: ['M', 'F', 'Other'] },
    facilityId: { type: String, required: true, index: true },
    facilityName: { type: String, required: true },
    districtId: { type: String, index: true },
    doctorId: { type: String, default: 'unassigned', index: true },
    doctorName: { type: String, default: 'To be assigned at counter' },
    specialty: { type: String, default: 'General Medicine' },
    roomNumber: { type: String },
    departmentId: { type: String, index: true },
    departmentName: { type: String },
    date: { type: String, required: true, index: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_QUEUE', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'SCHEDULED',
      index: true,
    },
    type: { type: String, enum: ['IN_PERSON', 'TELECONSULT'], default: 'IN_PERSON' },
    reasonForVisit: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    tokenId: { type: String, index: true },
    tokenNumber: { type: String },
    checkedInAt: { type: String },
    referralId: { type: String },
    referralCode: { type: String },
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

export const AppointmentModel = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
