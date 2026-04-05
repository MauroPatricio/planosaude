import mongoose, { Schema, type Document } from 'mongoose';

export interface IClaim extends Document {
  client: mongoose.Types.ObjectId;
  subscription: mongoose.Types.ObjectId;
  type: 'consultation' | 'exam' | 'surgery' | 'pharmacy' | 'other';
  description: string;
  amountRequested?: number;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_needed';
  documents: string[]; // URLs to uploaded files
  adminNotes?: string;
  tenant: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema: Schema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
    type: { 
      type: String, 
      enum: ['consultation', 'exam', 'surgery', 'pharmacy', 'other'], 
      required: true 
    },
    description: { type: String, required: true },
    amountRequested: { type: Number },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'more_info_needed'], 
      default: 'pending' 
    },
    documents: [{ type: String }],
    adminNotes: { type: String },
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true }
  },
  { timestamps: true }
);

export default mongoose.model<IClaim>('Claim', ClaimSchema);
