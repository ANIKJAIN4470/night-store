import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerDoc extends Document {
  name: string;
  email: string;
  normalizedEmail: string;
  phone: string;
  passwordHash: string;
  isEmailVerified: boolean;
  rewardPoints: number;
  rewardTransactions: Array<{ type: 'earn' | 'redeem'; amount: number; orderId?: string; date: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    normalizedEmail: { type: String, required: true, unique: true, index: true, lowercase: true },
    phone: { type: String, required: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    rewardPoints: { type: Number, default: 0, min: 0 },
    rewardTransactions: [{
      type: { type: String, enum: ['earn', 'redeem'], required: true },
      amount: { type: Number, required: true },
      orderId: { type: String },
      date: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export const CustomerModel = mongoose.models.Customer || mongoose.model<ICustomerDoc>('Customer', CustomerSchema);
