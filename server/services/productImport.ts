/**
 * Product Import Service - Validation, duplicate detection, and bulk processing
 */

import { IProduct } from '../types.js';
import { getProducts, getProductById } from '../db.js';
import { ExtractedProduct } from './ocr.js';

export interface ImportProductValidation {
  product: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  duplicateOf?: IProduct;
}

export interface ImportPreviewData {
  totalCount: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  products: ImportProductValidation[];
}

export interface ImportResult {
  success: boolean;
  imported: IProduct[];
  duplicates: { product: ExtractedProduct; existingId: string }[];
  errors: { product: ExtractedProduct; reason: string }[];
  summary: {
    totalProcessed: number;
    successCount: number;
    duplicateCount: number;
    errorCount: number;
  };
}

/**
 * Validate individual extracted product
 */
export async function validateExtractedProduct(
  extracted: ExtractedProduct,
  existingProducts: IProduct[]
): Promise<ImportProductValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isDuplicate = false;
  let duplicateOf: IProduct | undefined;

  // Required fields
  if (!extracted.name || extracted.name.trim().length === 0) {
    errors.push('Product name is required');
  }

  if (!extracted.mrp || extracted.mrp <= 0) {
    errors.push('MRP must be a positive number');
  }

  if (extracted.sellingPrice && extracted.mrp && extracted.sellingPrice < extracted.mrp) {
    errors.push('Selling price cannot be less than MRP');
  }

  // Auto-calculate selling price if not provided (MRP + ₹10)
  const sellingPrice = extracted.sellingPrice || (extracted.mrp ? extracted.mrp + 10 : 0);

  // Category validation
  const validCategories = [
    'Chips',
    'Wafers',
    'Namkeen',
    'Instant Noodles',
    'Candies',
    'Chocolates',
    'Cookies & Biscuits',
    'Drinks',
  ];
  if (extracted.category && !validCategories.includes(extracted.category)) {
    warnings.push(
      `Category "${extracted.category}" not in standard list. Will use "Chips" as default.`
    );
  }

  // Duplicate detection: check brand + flavor + mrp + size
  if (extracted.brand || extracted.flavor || extracted.mrp) {
    const duplicate = existingProducts.find(
      (p) =>
        p.brand?.toLowerCase() === extracted.brand?.toLowerCase() &&
        p.flavor?.toLowerCase() === extracted.flavor?.toLowerCase() &&
        p.mrp === extracted.mrp &&
        p.size === extracted.weight
    );

    if (duplicate) {
      isDuplicate = true;
      duplicateOf = duplicate;
      errors.push(`Duplicate detected: Similar product already exists (${duplicate.name})`);
    }
  }

  // Warnings for missing optional fields
  if (!extracted.brand) {
    warnings.push('Brand not detected');
  }
  if (!extracted.weight) {
    warnings.push('Weight/size not detected');
  }

  const product: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'> = {
    name: extracted.name || 'Unknown Product',
    slug: generateSlug(extracted.name || 'product'),
    description: extracted.description || `${extracted.brand || 'Product'} - ${extracted.flavor || 'Premium Snack'}`,
    mrp: extracted.mrp || 0,
    sellingPrice: Math.round(sellingPrice * 2) / 2, // Round to nearest 0.5
    stock: extracted.stock || 50,
    category: extracted.category || 'Chips',
    imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd94548?auto=format&fit=crop&w=500&q=60', // Placeholder
    available: true,
    isSpecial: false,
    isVeg: true, // Assume vegetarian unless indicated
    brand: extracted.brand,
    flavor: extracted.flavor,
    size: extracted.weight,
    weight: extracted.weight,
  };

  const isValid = errors.length === 0;

  return {
    product,
    isValid,
    errors,
    warnings,
    isDuplicate,
    duplicateOf,
  };
}

/**
 * Generate URL-friendly slug from product name
 */
function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`
  );
}

/**
 * Validate all extracted products and return preview
 */
export async function validateBulkImport(extractedProducts: ExtractedProduct[]): Promise<ImportPreviewData> {
  const existingProducts = await getProducts();
  const validations: ImportProductValidation[] = [];

  for (const extracted of extractedProducts) {
    const validation = await validateExtractedProduct(extracted, existingProducts);
    validations.push(validation);
  }

  const validCount = validations.filter((v) => v.isValid && !v.isDuplicate).length;
  const duplicateCount = validations.filter((v) => v.isDuplicate).length;
  const invalidCount = validations.filter((v) => !v.isValid && !v.isDuplicate).length;

  return {
    totalCount: extractedProducts.length,
    validCount,
    duplicateCount,
    invalidCount,
    products: validations,
  };
}

/**
 * Check if product is duplicate in list by brand + flavor + mrp + size
 */
function isDuplicateInList(product: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>, list: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>[]): boolean {
  return list.some(
    (p) =>
      p.brand?.toLowerCase() === product.brand?.toLowerCase() &&
      p.flavor?.toLowerCase() === product.flavor?.toLowerCase() &&
      p.mrp === product.mrp &&
      p.size === product.size
  );
}
