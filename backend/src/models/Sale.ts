import mongoose, { Schema, Document } from 'mongoose';
import Commission from './Commission.js';

export interface ISale extends Document {
  client: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  broker: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  value: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  paymentMethod: 'bank_transfer' | 'cash' | 'm-pesa' | 'emola';
  contractNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema: Schema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  plan: { type: Schema.Types.ObjectId, ref: 'HealthPlan', required: true },
  broker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  value: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, enum: ['bank_transfer', 'cash', 'm-pesa', 'emola'], required: true },
  contractNumber: { type: String },
  notes: { type: String }
}, {
  timestamps: true
});

// Post-save hook to generate commission when sale is approved
SaleSchema.post('save', async function(doc: ISale) {
  if (doc.status === 'approved') {
    // Basic commission logic: 10% of sale value
    const commissionValue = doc.value * 0.10;
    
    await Commission.create({
      sale: doc._id,
      broker: doc.broker,
      tenant: doc.tenant,
      amount: commissionValue,
      status: 'pending'
    });
  }
});

export default mongoose.model<ISale>('Sale', SaleSchema);
