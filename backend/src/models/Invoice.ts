import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  tenant: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  sale?: mongoose.Types.ObjectId;
  amount: number;
  dueDate: Date;
  paidAt?: Date;
  status: 'open' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: 'bank_transfer' | 'm-pesa' | 'emola' | 'cash' | 'visa';
  paymentProofUrl?: string; // Link to a Document entity
  submissionDate?: Date;
  validationDate?: Date;
  rejectionReason?: string;
  notes?: string;
  invoiceNumber: string;
}

const InvoiceSchema: Schema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  sale: { type: Schema.Types.ObjectId, ref: 'Sale' },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date },
  submissionDate: { type: Date },
  validationDate: { type: Date },
  status: { 
    type: String, 
    enum: ['open', 'pending', 'paid', 'overdue', 'cancelled', 'rejected'], 
    default: 'open' 
  },
  paymentMethod: { type: String, enum: ['bank_transfer', 'm-pesa', 'emola', 'cash', 'visa'] },
  paymentProofUrl: { type: String },
  rejectionReason: { type: String },
  notes: { type: String },
  invoiceNumber: { type: String, required: true, unique: true }
}, {
  timestamps: true
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
