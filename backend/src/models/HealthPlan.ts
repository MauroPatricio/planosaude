import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthPlan extends Document {
  name: string;
  operator: string; // e.g. Medis, Multicare
  type: 'individual' | 'corporate' | 'family';
  category: 'base' | 'plus' | 'premium';
  priceMonthly: number;
  commissionRate?: number; // percentage e.g. 10 for 10%
  commissionFixed?: number; // fixed amount e.g. 500 MT
  benefits: string[];
  description?: string;
  coberturas?: string[];
  limites?: string[];
  parceiros?: string[];
  isActive: boolean;
  tenant: mongoose.Types.ObjectId;
}

const HealthPlanSchema: Schema = new Schema({
  name: { type: String, required: true },
  operator: { type: String, required: true },
  type: { type: String, enum: ['individual', 'corporate', 'family'], required: true },
  category: { type: String, enum: ['base', 'plus', 'premium'], required: true },
  priceMonthly: { type: Number, required: true },
  commissionRate: { type: Number, default: 0 },
  commissionFixed: { type: Number, default: 0 },
  benefits: [{ type: String }],
  description: { type: String },
  coberturas: [{ type: String }],
  limites: [{ type: String }],
  parceiros: [{ type: String }],
  isActive: { type: Boolean, default: true },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true }
}, {
  timestamps: true
});

export default mongoose.model<IHealthPlan>('HealthPlan', HealthPlanSchema);
