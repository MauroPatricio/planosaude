import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  type: 'id_card' | 'birth_certificate' | 'contract' | 'proof_of_address' | 'other';
  entityType: 'Client' | 'Member' | 'Sale' | 'ApprovalRequest';
  entityId: mongoose.Types.ObjectId;
  status: 'pending' | 'verified' | 'rejected';
  tenant: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
}

const DocumentSchema: Schema = new Schema({
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['id_card', 'birth_certificate', 'contract', 'proof_of_address', 'other'], 
    default: 'other' 
  },
  entityType: { type: String, enum: ['Client', 'Member', 'Sale', 'ApprovalRequest'], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true, refPath: 'entityType' },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IDocument>('Document', DocumentSchema);
