import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  facilityId: string;
  facilityName?: string;
  departmentId?: string;
  departmentName?: string;
  userId?: string;
  status: 'ON_DUTY' | 'IN_OPD' | 'IN_SURGERY' | 'OFF_DUTY' | 'ON_LEAVE';
  phone: string;
  email: string;
  opdSchedule: string;
  patientsToday: number;
  teleconsultEnabled: boolean;
  avatar?: string;
  districtId: string;
  district: string;
  joinedDate?: string;
  registrationNumber?: string;
  opdRoom?: string;
  currentLeave?: any;
  upcomingLeaves?: any[];
}

const DoctorSchema = new Schema<IDoctor>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    qualification: { type: String, default: 'MBBS, MD' },
    specialty: { type: String, required: true, index: true },
    facilityId: { type: String, required: true, index: true },
    facilityName: { type: String },
    departmentId: { type: String, index: true },
    departmentName: { type: String },
    userId: { type: String, index: true },
    status: {
      type: String,
      enum: ['ON_DUTY', 'IN_OPD', 'IN_SURGERY', 'OFF_DUTY', 'ON_LEAVE'],
      default: 'ON_DUTY',
      index: true,
    },
    phone: { type: String, required: true },
    email: { type: String },
    opdSchedule: { type: String, default: 'Mon-Fri: 9:00 AM - 1:00 PM' },
    patientsToday: { type: Number, default: 0 },
    teleconsultEnabled: { type: Boolean, default: true },
    avatar: { type: String },
    districtId: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    joinedDate: { type: String },
    registrationNumber: { type: String },
    opdRoom: { type: String },
    currentLeave: { type: Schema.Types.Mixed },
    upcomingLeaves: [{ type: Schema.Types.Mixed }],
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

export const DoctorModel = mongoose.model<IDoctor>('Doctor', DoctorSchema);
