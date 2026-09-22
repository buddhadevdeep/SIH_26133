import mongoose, { Document, Schema } from 'mongoose';

export interface ITimelineEvent {
  id: string;
  date: string;
  eventType: 'ENCOUNTER' | 'VITALS' | 'DIAGNOSIS' | 'PRESCRIPTION' | 'LAB_REPORT' | 'REFERRAL' | 'FOLLOW_UP';
  title: string;
  facilityName: string;
  doctorName?: string;
  summary: string;
  details?: Record<string, any>;
}

export interface IPatientHealthRecord extends Document {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  abhaId?: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  timeline: ITimelineEvent[];
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    eventType: {
      type: String,
      enum: ['ENCOUNTER', 'VITALS', 'DIAGNOSIS', 'PRESCRIPTION', 'LAB_REPORT', 'REFERRAL', 'FOLLOW_UP'],
      required: true,
    },
    title: { type: String, required: true },
    facilityName: { type: String, required: true },
    doctorName: { type: String },
    summary: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const PatientHealthRecordSchema = new Schema<IPatientHealthRecord>(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true },
    abhaId: { type: String },
    bloodGroup: { type: String },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    timeline: [TimelineEventSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const PatientHealthRecordModel = mongoose.model<IPatientHealthRecord>(
  'PatientHealthRecord',
  PatientHealthRecordSchema
);
