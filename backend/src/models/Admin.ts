import mongoose, { Document, Schema } from 'mongoose';

// AI Model
export interface IAiModel extends Document {
  id: string;
  modelName: string;
  targetMetric: string;
  algorithm: string;
  version: string;
  accuracyPercent?: number;
  mae?: number;
  rmse?: number;
  status: 'ACTIVE' | 'STAGING' | 'ARCHIVED' | 'TRAINING';
  deployedAt?: string;
  trainedOnRecords: number;
}

const AiModelSchema = new Schema<IAiModel>(
  {
    id: { type: String, required: true, unique: true, index: true },
    modelName: { type: String, required: true },
    targetMetric: { type: String, required: true },
    algorithm: { type: String, required: true },
    version: { type: String, required: true },
    accuracyPercent: { type: Number },
    mae: { type: Number },
    rmse: { type: Number },
    status: {
      type: String,
      enum: ['ACTIVE', 'STAGING', 'ARCHIVED', 'TRAINING'],
      default: 'ACTIVE',
      index: true,
    },
    deployedAt: { type: String },
    trainedOnRecords: { type: Number, default: 1000 },
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

export const AiModelModel = mongoose.model<IAiModel>('AiModel', AiModelSchema);

// Audit Log
export interface IAuditLog extends Document {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'DENIED' | 'ERROR';
  details?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    id: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    actorId: { type: String, required: true, index: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String, required: true },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: 'HealthConnect-Web' },
    status: { type: String, enum: ['SUCCESS', 'DENIED', 'ERROR'], default: 'SUCCESS' },
    details: { type: String },
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

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// Notification
export interface INotification extends Document {
  id: string;
  title: string;
  message: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
  link?: string;
  recipientId?: string;
  recipientRole?: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['CRITICAL', 'WARNING', 'INFO', 'SUCCESS'], default: 'INFO' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    link: { type: String },
    recipientId: { type: String, index: true },
    recipientRole: { type: String, index: true },
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

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);

// System Settings
export interface ISystemSettings extends Document {
  key: string;
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  abhaCacheHours: number;
  smsGatewayActive: boolean;
  whatsAppGatewayActive: boolean;
  teleconsultationHeartbeat: number;
  emergencyAlertsActive: boolean;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  auditRetentionDays: number;
  maintenanceMode: boolean;
  readOnlyDrill: boolean;
  updatedBy?: string;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: { type: String, default: 'GLOBAL_SETTINGS', unique: true, index: true },
    sessionTimeoutMinutes: { type: Number, default: 60 },
    maxConcurrentSessions: { type: Number, default: 3 },
    abhaCacheHours: { type: Number, default: 24 },
    smsGatewayActive: { type: Boolean, default: true },
    whatsAppGatewayActive: { type: Boolean, default: true },
    teleconsultationHeartbeat: { type: Number, default: 15 },
    emergencyAlertsActive: { type: Boolean, default: true },
    logLevel: { type: String, enum: ['DEBUG', 'INFO', 'WARN', 'ERROR'], default: 'INFO' },
    auditRetentionDays: { type: Number, default: 365 },
    maintenanceMode: { type: Boolean, default: false },
    readOnlyDrill: { type: Boolean, default: false },
    updatedBy: { type: String },
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

export const SystemSettingsModel = mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
