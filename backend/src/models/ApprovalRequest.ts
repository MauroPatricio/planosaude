import mongoose, { Schema, Document } from 'mongoose';

export interface IApprovalRequest extends Document {
  tenant: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId; // The client who initiated the request
  type: 'member_add' | 'plan_adherence' | 'data_change' | 'plan_removal' | 'member_removal';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestData: any; // JSON with the fields to be added/changed
  handledBy?: mongoose.Types.ObjectId; // The Admin/Broker who approved/rejected
  comments?: string;
  processedAt?: Date;
}

const ApprovalRequestSchema: Schema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  type: { 
    type: String, 
    enum: ['member_add', 'plan_adherence', 'data_change', 'plan_removal', 'member_removal'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled'], 
    default: 'pending', 
    index: true 
  },
  requestData: { type: Schema.Types.Mixed, required: true },
  handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  comments: { type: String },
  processedAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);
