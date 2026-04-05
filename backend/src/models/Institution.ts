import mongoose, { Schema, Document } from 'mongoose';

export interface IInstitution extends Document {
  name: string;
  nuit?: string;
  email: string;
  phone: string;
  address?: string;
  responsible: string;
  status: 'active' | 'inactive';
  tenant: mongoose.Types.ObjectId;
}

const InstitutionSchema: Schema = new Schema({
  name: { type: String, required: true },
  nuit: { type: String },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  responsible: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true }
}, {
  timestamps: true
});

export default mongoose.model<IInstitution>('Institution', InstitutionSchema);
