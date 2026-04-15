import mongoose, { Schema, Document } from 'mongoose';

export interface IMember extends Document {
  primaryClient: mongoose.Types.ObjectId;
  name: string;
  birthDate: Date;
  relationship: 'pai' | 'mae' | 'filho' | 'irmao' | 'conjuge' | 'outro';
  documentId?: string;
  documentNumber?: string;
  gender?: 'Masculino' | 'Feminino';
  phone?: string;
  status: 'pending' | 'active' | 'inactive';
  policyNumber?: string;
  tenant: mongoose.Types.ObjectId;
}

const MemberSchema: Schema = new Schema({
  primaryClient: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  birthDate: { type: Date, required: true },
  relationship: { 
    type: String, 
    enum: ['pai', 'mae', 'filho', 'irmao', 'conjuge', 'outro'], 
    required: true 
  },
  documentId: { type: String },
  documentNumber: { type: String },
  gender: { type: String, enum: ['Masculino', 'Feminino'] },
  phone: { type: String },
  status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'active' },
  policyNumber: { type: String },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true }
}, {
  timestamps: true
});

export default mongoose.model<IMember>('Member', MemberSchema);
