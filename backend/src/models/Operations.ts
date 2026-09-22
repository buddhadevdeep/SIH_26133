import mongoose, { Document, Schema } from 'mongoose';

// Operational Service
export interface IOperationalService extends Document {
  id: string;
  name: string;
  code: string;
  category: 'CLINICAL_OPD' | 'EMERGENCY_ICU' | 'DIAGNOSTICS' | 'PHARMACY' | 'SUPPORT_SERVICES';
  status: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
  operatingHours: string;
  currentWaitMinutes: number;
  activeStaffCount: number;
  statusReason?: string;
  notes?: string;
  lastUpdated: string;
}

const OperationalServiceSchema = new Schema<IOperationalService>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    category: {
      type: String,
      enum: ['CLINICAL_OPD', 'EMERGENCY_ICU', 'DIAGNOSTICS', 'PHARMACY', 'SUPPORT_SERVICES'],
      required: true,
    },
    status: { type: String, enum: ['OPERATIONAL', 'DEGRADED', 'OFFLINE'], default: 'OPERATIONAL' },
    operatingHours: { type: String, default: '24x7 Emergency / 9am-4pm OPD' },
    currentWaitMinutes: { type: Number, default: 15 },
    activeStaffCount: { type: Number, default: 5 },
    statusReason: { type: String },
    notes: { type: String },
    lastUpdated: { type: String, default: () => new Date().toISOString() },
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

export const OperationalServiceModel = mongoose.model<IOperationalService>(
  'OperationalService',
  OperationalServiceSchema
);

// Operational Announcement
export interface IOperationalAnnouncement extends Document {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'URGENT';
  createdAt: string;
  author: string;
  active: boolean;
}

const OperationalAnnouncementSchema = new Schema<IOperationalAnnouncement>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'URGENT'], default: 'INFO' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    author: { type: String, default: 'Operations Coordinator' },
    active: { type: Boolean, default: true },
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

export const OperationalAnnouncementModel = mongoose.model<IOperationalAnnouncement>(
  'OperationalAnnouncement',
  OperationalAnnouncementSchema
);

// Operational Issue
export interface IOperationalIssue extends Document {
  id: string;
  severity: 'CRITICAL' | 'ATTENTION' | 'INFORMATIONAL';
  category: 'QUEUE' | 'REFERRAL' | 'RESOURCE' | 'STAFF' | 'SERVICE' | 'DIAGNOSTIC';
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

const OperationalIssueSchema = new Schema<IOperationalIssue>(
  {
    id: { type: String, required: true, unique: true, index: true },
    severity: { type: String, enum: ['CRITICAL', 'ATTENTION', 'INFORMATIONAL'], required: true },
    category: {
      type: String,
      enum: ['QUEUE', 'REFERRAL', 'RESOURCE', 'STAFF', 'SERVICE', 'DIAGNOSTIC'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    actionLabel: { type: String, default: 'Inspect' },
    actionPath: { type: String, default: '/facility-operations' },
    timestamp: { type: String, default: () => new Date().toISOString() },
    resolved: { type: Boolean, default: false, index: true },
    resolvedAt: { type: String },
    resolvedBy: { type: String },
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

export const OperationalIssueModel = mongoose.model<IOperationalIssue>(
  'OperationalIssue',
  OperationalIssueSchema
);

// Staff Duty Item
export interface IStaffDutyItem extends Document {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'GENERAL';
  status: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY' | 'ON_CALL';
  contactPhone: string;
  assignedLocation: string;
}

const StaffDutyItemSchema = new Schema<IStaffDutyItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    shift: { type: String, enum: ['MORNING', 'EVENING', 'NIGHT', 'GENERAL'], default: 'GENERAL' },
    status: { type: String, enum: ['ON_DUTY', 'ON_BREAK', 'OFF_DUTY', 'ON_CALL'], default: 'ON_DUTY' },
    contactPhone: { type: String, required: true },
    assignedLocation: { type: String, required: true },
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

export const StaffDutyItemModel = mongoose.model<IStaffDutyItem>(
  'StaffDutyItem',
  StaffDutyItemSchema
);

// Doctor Leave
export interface IDoctorLeave extends Document {
  id: string;
  doctorId: string;
  doctorName: string;
  startDate: string;
  endDate: string;
  reason: string;
  category: 'CASUAL' | 'SICK' | 'CONFERENCE' | 'DUTY_OFF' | 'EMERGENCY' | 'EARNED';
  status: 'APPROVED' | 'PENDING' | 'CHANGES_REQUIRED' | 'REJECTED' | 'CANCELLED';
  handoverDoctorName?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
  facilityId?: string;
  facilityName?: string;
  department?: string;
  rejectionReason?: string;
  changesRequestedNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  affectedAppointmentsCount?: number;
  serviceCoverageImpact?: 'ADEQUATE' | 'LIMITED' | 'CRITICAL_GAP';
}

const DoctorLeaveSchema = new Schema<IDoctorLeave>(
  {
    id: { type: String, required: true, unique: true, index: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    reason: { type: String, required: true },
    category: {
      type: String,
      enum: ['CASUAL', 'SICK', 'CONFERENCE', 'DUTY_OFF', 'EMERGENCY', 'EARNED'],
      default: 'CASUAL',
    },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'CHANGES_REQUIRED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    handoverDoctorName: { type: String },
    emergencyContact: { type: String },
    notes: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
    facilityId: { type: String, index: true },
    facilityName: { type: String },
    department: { type: String },
    rejectionReason: { type: String },
    changesRequestedNote: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: String },
    affectedAppointmentsCount: { type: Number, default: 0 },
    serviceCoverageImpact: {
      type: String,
      enum: ['ADEQUATE', 'LIMITED', 'CRITICAL_GAP'],
      default: 'ADEQUATE',
    },
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

export const DoctorLeaveModel = mongoose.model<IDoctorLeave>('DoctorLeave', DoctorLeaveSchema);
