import mongoose, { Document, Schema } from 'mongoose';

export type FacilityType =
  | 'PHC'
  | 'CHC'
  | 'DISTRICT_HOSPITAL'
  | 'SUB_DISTRICT_HOSPITAL'
  | 'MEDICAL_COLLEGE'
  | 'SPECIALTY_HOSPITAL';

export interface Department {
  id: string;
  name: string;
  code: string;
  activeDoctors: number;
  currentWaitMinutes: number;
  opdOpen: boolean;
}

export interface IFacility extends Document {
  id: string;
  name: string;
  type: FacilityType;
  districtId: string;
  district: string;
  state: string;
  address: string;
  pincode: string;
  contactNumber: string;
  emergencyNumber: string;
  registrationClerkUsername?: string;
  registrationClerkUserId?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  distanceKm?: number;
  isOpen: boolean;
  isVerified: boolean;
  emergencyAvailable: boolean;
  currentWaitTimeMinutes: number;
  totalBeds: number;
  availableBeds: number;
  icuBedsTotal: number;
  icuBedsAvailable: number;
  oxygenAvailable: boolean;
  bloodBankAvailable: boolean;
  ambulanceAvailable: boolean;
  specialties: string[];
  equipment: Array<{
    name: string;
    isOperational: boolean;
    quantity: number;
  }>;
  departments: Department[];
  lastUpdated: string;
  rating?: number;
}

const FacilitySchema = new Schema<IFacility>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['PHC', 'CHC', 'DISTRICT_HOSPITAL', 'SUB_DISTRICT_HOSPITAL', 'MEDICAL_COLLEGE', 'SPECIALTY_HOSPITAL'],
      index: true,
    },
    districtId: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    state: { type: String, default: 'Gujarat' },
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    contactNumber: { type: String, required: true },
    emergencyNumber: { type: String, default: '108' },
    registrationClerkUsername: { type: String, index: true },
    registrationClerkUserId: { type: String, index: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' },
    },
    distanceKm: { type: Number },
    isOpen: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    emergencyAvailable: { type: Boolean, default: true },
    currentWaitTimeMinutes: { type: Number, default: 15 },
    totalBeds: { type: Number, default: 50 },
    availableBeds: { type: Number, default: 20 },
    icuBedsTotal: { type: Number, default: 10 },
    icuBedsAvailable: { type: Number, default: 5 },
    oxygenAvailable: { type: Boolean, default: true },
    bloodBankAvailable: { type: Boolean, default: true },
    ambulanceAvailable: { type: Boolean, default: true },
    specialties: [{ type: String }],
    equipment: [
      {
        name: { type: String },
        isOperational: { type: Boolean, default: true },
        quantity: { type: Number, default: 1 },
      },
    ],
    departments: [
      {
        id: { type: String },
        name: { type: String },
        code: { type: String },
        activeDoctors: { type: Number, default: 1 },
        currentWaitMinutes: { type: Number, default: 15 },
        opdOpen: { type: Boolean, default: true },
      },
    ],
    lastUpdated: { type: String, default: () => new Date().toISOString() },
    rating: { type: Number, default: 4.5 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret.id || ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.location;
        return ret;
      },
    },
  }
);

FacilitySchema.pre('save', function (next) {
  if (this.coordinates?.lat && this.coordinates?.lng) {
    this.location = {
      type: 'Point',
      coordinates: [this.coordinates.lng, this.coordinates.lat],
    };
  }
  next();
});

export const FacilityModel = mongoose.model<IFacility>('Facility', FacilitySchema);
