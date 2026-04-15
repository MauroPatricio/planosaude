import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  documentId: string; // BI
  nuit?: string; // NUIT
  address: string;
  gender?: 'Masculino' | 'Feminino';
  birthDate?: Date;
  status: 'active' | 'inactive' | 'lead' | 'pending' | 'suspended' | 'pending_correction' | 'rejected';
  rejectionReason?: string;
  history: {
    date: Date;
    action: string;
    note: string;
  }[];
  documents?: {
    identificationFrontUrl?: string;
    identificationBackUrl?: string;
    addressProofUrl?: string;
  };
  preferredPaymentDate?: Date;
  billingCycle?: 'monthly' | 'quarterly' | 'annually';
  policyNumber?: string;
  broker: mongoose.Types.ObjectId;
  institution?: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
}

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  documentId: { type: String, required: true },
  nuit: { type: String },
  address: { type: String },
  gender: { type: String, enum: ['Masculino', 'Feminino'] },
  birthDate: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'lead', 'pending', 'suspended', 'pending_correction', 'rejected'], default: 'lead' },
  rejectionReason: { type: String },
  history: [{
    date: { type: Date, default: Date.now },
    action: { type: String, required: true },
    note: { type: String }
  }],
  documents: {
    identificationFrontUrl: { type: String },
    identificationBackUrl: { type: String },
    addressProofUrl: { type: String }
  },
  preferredPaymentDate: { type: Date },
  billingCycle: { type: String, enum: ['monthly', 'quarterly', 'annually'], default: 'monthly' },
  policyNumber: { type: String },
  broker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', index: true },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true }
}, {
  timestamps: true
});

export default mongoose.model<IClient>('Client', ClientSchema);
