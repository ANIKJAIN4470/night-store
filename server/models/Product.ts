import mongoose, { Schema, Document } from 'mongoose';

export interface IProductDoc extends Document {
  name: string;
  slug: string;
  description: string;
  mrp: number; // Maximum Retail Price
  sellingPrice: number; // Our selling price (typically MRP + ₹10)
  price?: number; // Deprecated - kept for backward compatibility
  costPrice?: number; // Cost of goods - for profit calculations (NEW)
  stock: number; // Quantity available
  category: string;
  imageUrl: string;
  available: boolean;
  isSpecial?: boolean;
  isVeg?: boolean;
  brand?: string; // Product brand (Lays, Uncle Chipps, etc.)
  flavor?: string; // Flavor variant (Masala, Peri Peri, etc.)
  size?: string; // Package size (Small, Medium, Large, etc.)
  weight?: string; // Net weight (e.g., "20g", "50g")
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    price: { type: Number, required: false }, // Deprecated - backward compatibility
    costPrice: { type: Number, default: 0, min: 0 }, // NEW: Cost of goods for profit calculations
    stock: { type: Number, required: true, default: 0, min: 0 },
    category: { type: String, required: true, index: true },
    imageUrl: { type: String, required: true },
    available: { type: Boolean, default: true, index: true },
    isSpecial: { type: Boolean, default: false },
    isVeg: { type: Boolean, default: true },
    brand: { type: String, index: true },
    flavor: { type: String },
    size: { type: String },
    weight: { type: String },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate products (same brand + flavor + mrp + size)
ProductSchema.index({ brand: 1, flavor: 1, mrp: 1, size: 1 }, { unique: true, sparse: true });

export const ProductModel = mongoose.models.Product || mongoose.model<IProductDoc>('Product', ProductSchema);
