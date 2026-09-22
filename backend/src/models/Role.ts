import mongoose, { Document, Schema } from 'mongoose';

export type RoleLevel = 'STATE' | 'DISTRICT' | 'FACILITY' | 'COMMUNITY' | 'CITIZEN';

export interface IRole extends Document {
  id: string;
  code: string;
  name: string;
  description: string;
  level: RoleLevel;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    level: {
      type: String,
      required: true,
      enum: ['STATE', 'DISTRICT', 'FACILITY', 'COMMUNITY', 'CITIZEN'],
      default: 'FACILITY',
    },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
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

export const RoleModel = mongoose.model<IRole>('Role', RoleSchema);
