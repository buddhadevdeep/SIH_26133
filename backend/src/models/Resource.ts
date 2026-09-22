import mongoose, { Document, Schema } from 'mongoose';

// Bed Summary
export interface IBedSummary extends Document {
  facilityId: string;
  facilityName: string;
  totalBeds: number;
  totalAvailable: number;
  totalOccupied: number;
  icuTotal: number;
  icuAvailable: number;
  emergencyTotal: number;
  emergencyAvailable: number;
  categories: Array<{
    type: string;
    total: number;
    occupied: number;
    available: number;
    lastUpdated: string;
  }>;
  lastUpdated: string;
  isStale: boolean;
}

const BedSummarySchema = new Schema<IBedSummary>(
  {
    facilityId: { type: String, required: true, unique: true, index: true },
    facilityName: { type: String, required: true },
    totalBeds: { type: Number, default: 50 },
    totalAvailable: { type: Number, default: 20 },
    totalOccupied: { type: Number, default: 30 },
    icuTotal: { type: Number, default: 10 },
    icuAvailable: { type: Number, default: 4 },
    emergencyTotal: { type: Number, default: 8 },
    emergencyAvailable: { type: Number, default: 3 },
    categories: [
      {
        type: { type: String },
        total: { type: Number },
        occupied: { type: Number },
        available: { type: Number },
        lastUpdated: { type: String },
      },
    ],
    lastUpdated: { type: String, default: () => new Date().toISOString() },
    isStale: { type: Boolean, default: false },
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

export const BedSummaryModel = mongoose.model<IBedSummary>('BedSummary', BedSummarySchema);

// Blood Inventory
export interface IBloodInventory extends Document {
  facilityId: string;
  facilityName: string;
  stock: Array<{
    bloodGroup: string;
    unitsAvailable: number;
    minimumThreshold: number;
    status: 'OPTIMAL' | 'MODERATE' | 'LOW' | 'CRITICAL';
    expiringIn7Days: number;
    lastUpdated: string;
  }>;
  totalUnits: number;
  isStale: boolean;
}

const BloodInventorySchema = new Schema<IBroadcastBloodInventory>(
  {
    facilityId: { type: String, required: true, unique: true, index: true },
    facilityName: { type: String, required: true },
    stock: [
      {
        bloodGroup: { type: String, required: true },
        unitsAvailable: { type: Number, default: 0 },
        minimumThreshold: { type: Number, default: 10 },
        status: { type: String, enum: ['OPTIMAL', 'MODERATE', 'LOW', 'CRITICAL'], default: 'OPTIMAL' },
        expiringIn7Days: { type: Number, default: 0 },
        lastUpdated: { type: String, default: () => new Date().toISOString() },
      },
    ],
    totalUnits: { type: Number, default: 0 },
    isStale: { type: Boolean, default: false },
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

type IBroadcastBloodInventory = IBloodInventory;
export const BloodInventoryModel = mongoose.model<IBloodInventory>('BloodInventory', BloodInventorySchema);

// Ambulance
export interface IAmbulance extends Document {
  id: string;
  vehicleNumber: string;
  type: 'ADVANCED_LIFE_SUPPORT' | 'BASIC_LIFE_SUPPORT' | 'NEONATAL';
  driverName: string;
  driverPhone: string;
  facilityId: string;
  facilityName: string;
  status: 'AVAILABLE' | 'ON_CALL' | 'IN_TRANSIT' | 'MAINTENANCE';
  currentLocationName?: string;
  currentCoordinates?: { lat: number; lng: number };
  assignedPatientName?: string;
  lastUpdated: string;
}

const AmbulanceSchema = new Schema<IAmbulance>(
  {
    id: { type: String, required: true, unique: true, index: true },
    vehicleNumber: { type: String, required: true },
    type: { type: String, enum: ['ADVANCED_LIFE_SUPPORT', 'BASIC_LIFE_SUPPORT', 'NEONATAL'], required: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    facilityId: { type: String, required: true, index: true },
    facilityName: { type: String, required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_CALL', 'IN_TRANSIT', 'MAINTENANCE'],
      default: 'AVAILABLE',
      index: true,
    },
    currentLocationName: { type: String },
    currentCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    assignedPatientName: { type: String },
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

export const AmbulanceModel = mongoose.model<IAmbulance>('Ambulance', AmbulanceSchema);

// Equipment
export interface IEquipment extends Document {
  id: string;
  facilityId: string;
  facilityName: string;
  name: string;
  category: string;
  department: string;
  isOperational: boolean;
  lastMaintenanceDate?: string;
  nextMaintenanceDue?: string;
  failureReportCount: number;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    facilityId: { type: String, required: true, index: true },
    facilityName: { type: String, required: true },
    name: { type: String, required: true, index: true },
    category: { type: String, required: true },
    department: { type: String, required: true },
    isOperational: { type: Boolean, default: true },
    lastMaintenanceDate: { type: String },
    nextMaintenanceDue: { type: String },
    failureReportCount: { type: Number, default: 0 },
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

export const EquipmentModel = mongoose.model<IEquipment>('Equipment', EquipmentSchema);
