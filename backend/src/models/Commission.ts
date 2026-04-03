import mongoose, { Schema, Document } from 'mongoose';

export interface ICommission extends Document {
  sale: mongoose.Types.ObjectId;
  broker: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: Date;
}

const CommissionSchema: Schema = new Schema({
  sale: { type: Schema.Types.ObjectId, ref: 'Sale', required: true },
  broker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  paidAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model<ICommission>('Commission', CommissionSchema);
