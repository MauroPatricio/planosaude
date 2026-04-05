import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  beneficiaryType: 'Client' | 'Member';
  beneficiaryId: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  priceMonthly: number;
  startDate?: Date;
  endDate?: Date;
  tenant: mongoose.Types.ObjectId;
}

const SubscriptionSchema: Schema = new Schema({
  beneficiaryType: { type: String, enum: ['Client', 'Member'], required: true },
  beneficiaryId: { type: Schema.Types.ObjectId, required: true, refPath: 'beneficiaryType' },
  plan: { type: Schema.Types.ObjectId, ref: 'HealthPlan', required: true },
  status: { type: String, enum: ['pending', 'active', 'cancelled', 'expired'], default: 'pending' },
  priceMonthly: { type: Number, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true }
}, {
  timestamps: true
});

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
