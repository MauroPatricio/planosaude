import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  documentId: string; // NUIT or BI
  address: string;
  status: 'active' | 'inactive' | 'lead';
  history: {
    date: Date;
    action: string;
    note: string;
  }[];
  broker: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
}

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  documentId: { type: String, required: true },
  address: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'lead'], default: 'lead' },
  history: [{
    date: { type: Date, default: Date.now },
    action: { type: String, required: true },
    note: { type: String }
  }],
  broker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true }
}, {
  timestamps: true
});

export default mongoose.model<IClient>('Client', ClientSchema);
