import mongoose, { Schema, Document } from 'mongoose';

export interface ISettingsDoc extends Document {
  businessName: string;
  tagline: string;
  contactPhone: string;
  whatsappPhone: string;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryTime: string;
  acceptedHostels: string[];
  paymentMethods: {
    cod: boolean;
    upi: boolean;
  };
  upiQrUrl?: string;
  announcement?: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDoc>(
  {
    businessName: { type: String, required: true },
    tagline: { type: String, required: true },
    contactPhone: { type: String, required: true },
    whatsappPhone: { type: String, required: true },
    openingTime: { type: String, required: true },
    closingTime: { type: String, required: true },
    isOpen: { type: Boolean, default: true },
    deliveryFee: { type: Number, default: 15 },
    minOrderAmount: { type: Number, default: 50 },
    estimatedDeliveryTime: { type: String, default: '20-30 mins' },
    acceptedHostels: [{ type: String }],
    paymentMethods: {
      cod: { type: Boolean, default: true },
      upi: { type: Boolean, default: true },
    },
    upiQrUrl: { type: String },
    announcement: { type: String },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.models.Settings || mongoose.model<ISettingsDoc>('Settings', SettingsSchema);
