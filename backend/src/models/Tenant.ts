import mongoose, { Schema, type Document } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  type: string;
  country: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  settings: {
    theme?: string;
    logo?: string;
  };
}

const TenantSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    default: 'Corretora de Seguros',
    required: true 
  },
  country: { type: String, default: 'Moçambique' },
  currency: { type: String, default: 'MT' },
  contactEmail: { type: String, required: true, unique: true },
  contactPhone: { type: String },
  isActive: { type: Boolean, default: true },
  settings: {
    theme: { type: String, default: 'default' },
    logo: { type: String }
  }
}, {
  timestamps: true
});

export default mongoose.model<ITenant>('Tenant', TenantSchema);
