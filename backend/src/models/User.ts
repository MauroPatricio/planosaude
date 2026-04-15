import mongoose, { Schema, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'superAdmin' | 'admin' | 'manager' | 'broker' | 'client' | 'hr_admin';
  tenant: mongoose.Schema.Types.ObjectId;
  isActive: boolean;
  profileImage?: string;
  pushTokens?: string[];
  clientId?: mongoose.Types.ObjectId;
  status: 'pending' | 'active' | 'suspended' | 'pending_correction' | 'rejected';
  address?: string;
  documentType?: 'BI' | 'Passaporte';
  documentNumber?: string;
  nuit?: string;
  planType?: 'particular' | 'institucional';
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superAdmin', 'admin', 'manager', 'broker', 'client', 'hr_admin'], default: 'broker' },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  isActive: { type: Boolean, default: true },
  profileImage: { type: String },
  pushTokens: [{ type: String }],
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
  status: { type: String, enum: ['pending', 'active', 'suspended', 'pending_correction', 'rejected'], default: 'pending' },
  address: { type: String },
  documentType: { type: String, enum: ['BI', 'Passaporte'] },
  documentNumber: { type: String },
  nuit: { type: String },
  planType: { type: String, enum: ['particular', 'institucional'] }
}, {
  timestamps: true
});

UserSchema.pre('save', async function (next) {
  const user = this as any;
  if (!user.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
