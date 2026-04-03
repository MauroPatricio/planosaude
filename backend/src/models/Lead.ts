import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'proposal' | 'lost' | 'converted';
  source: string;
  brokerId?: mongoose.Schema.Types.ObjectId;
  notes?: string;
  tenant: mongoose.Types.ObjectId;
}

const LeadSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['new', 'contacted', 'proposal', 'lost', 'converted'], default: 'new' },
  source: { type: String, default: 'direct' },
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true }
}, {
  timestamps: true
});

export default mongoose.model<ILead>('Lead', LeadSchema);
