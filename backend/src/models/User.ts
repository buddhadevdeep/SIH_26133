import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole =
  | 'PATIENT'
  | 'ASHA'
  | 'DOCTOR'
  | 'FACILITY_STAFF'
  | 'HOSPITAL_ADMIN'
  | 'DISTRICT_ADMIN'
  | 'SUPER_ADMIN';

export type StaffSubType =
  | 'REGISTRATION_CLERK'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN'
  | 'NURSE'
  | 'FACILITY_OPERATIONS';

export interface IUser extends Document {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone: string;
  password?: string;
  role: UserRole;
  staffSubType?: StaffSubType;
  facilityId?: string;
  facilityName?: string;
  districtId?: string;
  district?: string;
  doctorId?: string;
  department?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatar?: string;
  abhaId?: string;
  gender?: 'M' | 'F' | 'Other';
  age?: number;
  permissions?: string[];
  designation?: string;
  qualification?: string;
  specialty?: string;
  licenseNumber?: string;
  employeeId?: string;
  bio?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredLanguage?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    username: { type: String, sparse: true, index: true },
    email: { type: String, sparse: true, index: true },
    phone: { type: String, required: true, index: true },
    password: { type: String },
    role: {
      type: String,
      required: true,
      enum: ['PATIENT', 'ASHA', 'DOCTOR', 'FACILITY_STAFF', 'HOSPITAL_ADMIN', 'DISTRICT_ADMIN', 'SUPER_ADMIN'],
      index: true,
    },
    staffSubType: {
      type: String,
      enum: ['REGISTRATION_CLERK', 'PHARMACIST', 'LAB_TECHNICIAN', 'NURSE', 'FACILITY_OPERATIONS'],
      index: true,
    },
    facilityId: { type: String, index: true },
    facilityName: { type: String },
    districtId: { type: String, index: true },
    district: { type: String, index: true },
    doctorId: { type: String, index: true },
    department: { type: String },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    avatar: { type: String },
    abhaId: { type: String },
    gender: { type: String, enum: ['M', 'F', 'Other'] },
    age: { type: Number },
    permissions: [{ type: String }],
    designation: { type: String },
    qualification: { type: String },
    specialty: { type: String },
    licenseNumber: { type: String },
    employeeId: { type: String },
    bio: { type: String },
    address: { type: String },
    bloodGroup: { type: String },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    preferredLanguage: { type: String, default: 'en' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret.id || ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return true;
  if (this.password === candidatePassword) return true;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);
