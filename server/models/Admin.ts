import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminDoc extends Document {
  username: string;
  normalizedUsername: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdminDoc>(
  {
    username: { type: String, required: true },
    normalizedUsername: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

export const AdminModel = mongoose.models.Admin || mongoose.model<IAdminDoc>('Admin', AdminSchema);
