import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  tenant: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId; // User ID
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string; // Optional link to the record (e.g., /approvals or /payments)
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error'], 
    default: 'info' 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
