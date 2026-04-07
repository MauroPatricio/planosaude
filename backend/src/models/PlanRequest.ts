import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanRequest extends Document {
  tenant: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  requestType: 'new_subscription' | 'cancellation';
  rejectionReason?: string;
  createdAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

const PlanRequestSchema: Schema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  plan: { type: Schema.Types.ObjectId, ref: 'HealthPlan', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  requestType: {
    type: String,
    enum: ['new_subscription', 'cancellation'],
    default: 'new_subscription'
  },
  rejectionReason: { type: String },
  approvedAt: { type: Date },
  rejectedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IPlanRequest>('PlanRequest', PlanRequestSchema);
