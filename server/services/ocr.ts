/**
 * OCR Service - Extract product data from handwritten/printed documents
 * Supports: JPG, PNG images and PDF documents
 */

import Tesseract from 'tesseract.js';
import * as pdf from 'pdf-parse';
import sharp from 'sharp';

export interface ExtractedProduct {
  name?: string;
  brand?: string;
  mrp?: number;
  sellingPrice?: number;
  weight?: string;
  flavor?: string;
  category?: string;
  stock?: number;
  description?: string;
  confidence?: number;
}

/**
 * Extract text from image using Tesseract OCR
 * Handles jpg, png with preprocessing for better accuracy
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<{
  text: string;
  confidence: number;
}> {
  try {
    // Preprocess image with sharp for better OCR accuracy
    const processedBuffer = await sharp(imageBuffer)
      .grayscale() // Convert to grayscale
      .normalize() // Improve contrast
      .sharpen() // Enhance edges
      .toBuffer();

    // Run OCR
    const result = await Tesseract.recognize(processedBuffer, 'eng', {
      logger: (progress) => {
        console.log(`OCR Progress: ${Math.round(progress.progress * 100)}%`);
      },
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Extract text from PDF document
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await (pdf as any).default(pdfBuffer);
    // Combine text from all pages
    let fullText = '';
    for (let i = 0; i < data.numpages; i++) {
      fullText += data.text;
    }
    return fullText;
  } catch (error) {
    console.error('PDF Extraction Error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Parse extracted text into structured product data
 * Looks for common patterns: MRP, Price, Weight, Quantity, etc.
 */
export function parseProductData(text: string): ExtractedProduct[] {
  const products: ExtractedProduct[] = [];
  const lines = text.split('\n').filter((line) => line.trim());

  let currentProduct: ExtractedProduct = {};
  let productCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to detect product name (usually 2-4 words, starts line)
    if (
      trimmed.length > 5 &&
      trimmed.length < 100 &&
      !trimmed.match(/^\d/) &&
      !trimmed.match(/^(Rs|₹|MRP|Price|Stock|Weight)/)
    ) {
      // If we have a previous product with name, save it
      if (currentProduct.name) {
        products.push(currentProduct);
        currentProduct = {};
        productCount++;
      }

      if (!currentProduct.name) {
        currentProduct.name = trimmed.substring(0, 60);
      }
    }

    // Extract MRP (₹20, Rs 20, 20 Rs, etc.)
    const mrpMatch = trimmed.match(/(?:₹|Rs|rs)\s*(\d+\.?\d*)|(\d+\.?\d*)\s*(?:₹|Rs|rs)?/i);
    if (mrpMatch && !currentProduct.mrp) {
      const mrpValue = parseFloat(mrpMatch[1] || mrpMatch[2]);
      if (mrpValue > 0 && mrpValue < 10000) {
        // Reasonable price range for snacks
        currentProduct.mrp = Math.round(mrpValue * 2) / 2;
      }
    }

    // Extract Weight/Volume (20g, 200ml, 1kg, etc.)
    const weightMatch = trimmed.match(/(\d+\.?\d*)\s*(g|kg|ml|l|gm|gram|ml|liter)/i);
    if (weightMatch && !currentProduct.weight) {
      currentProduct.weight = `${weightMatch[1]}${weightMatch[2]}`;
    }

    // Extract Stock/Quantity (Stock: 50, Qty: 100, etc.)
    const stockMatch = trimmed.match(/(?:stock|quantity|qty|units?)\s*:?\s*(\d+)/i);
    if (stockMatch && !currentProduct.stock) {
      currentProduct.stock = parseInt(stockMatch[1], 10);
    }

    // Extract Category
    const categories = ['Chips', 'Wafers', 'Namkeen', 'Instant Noodles', 'Candies', 'Chocolates', 'Cookies & Biscuits', 'Drinks'];
    for (const cat of categories) {
      if (trimmed.toLowerCase().includes(cat.toLowerCase())) {
        currentProduct.category = cat;
        break;
      }
    }

    // Extract Brand (common brands)
    const brands = ['Lays', 'Kurkure', 'Balaji', 'Uncle Chipps', 'Bingo', 'Haldirams', 'Too Yumm', 'Pringles', 'Maggi', 'Top Ramen', 'Cadbury', 'Britannia', 'Parle', 'Sunfeast', 'Ferrero', 'Real', 'Minute Maid', 'Everest', 'Amul'];
    for (const brand of brands) {
      if (trimmed.toLowerCase().includes(brand.toLowerCase())) {
        currentProduct.brand = brand;
        break;
      }
    }

    // Extract Flavor (common variants)
    const flavors = ['Masala', 'Peri Peri', 'Cream & Onion', 'Salt & Vinegar', 'Original', 'Salted', 'Chicken', 'Maggi', 'Dark Fantasy', 'Bourbon'];
    for (const flavor of flavors) {
      if (trimmed.toLowerCase().includes(flavor.toLowerCase())) {
        currentProduct.flavor = flavor;
        break;
      }
    }
  }

  // Add last product
  if (currentProduct.name) {
    products.push(currentProduct);
  }

  return products.filter((p) => p.name && (p.mrp || p.stock)); // Return only products with at least name + price or stock
}

/**
 * Main function: Process document and extract product data
 */
export async function extractProductsFromDocument(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExtractedProduct[]> {
  try {
    let text = '';

    if (mimeType === 'application/pdf') {
      text = await extractTextFromPDF(fileBuffer);
    } else if (mimeType.startsWith('image/')) {
      const result = await extractTextFromImage(fileBuffer);
      text = result.text;
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const products = parseProductData(text);
    return products;
  } catch (error) {
    console.error('Document Processing Error:', error);
    throw error;
  }
}
