import React, { useState } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Loader,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ExtractedProduct {
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

interface ValidationError {
  errors: string[];
  warnings: string[];
}

interface ImportProductValidation {
  product: any;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  duplicateOf?: any;
}

interface ImportPreviewData {
  totalCount: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  products: ImportProductValidation[];
}

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [processingResult, setProcessingResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload JPG, PNG, or PDF.');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUploadAndPreview = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('/api/admin/products/import/preview', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process document');
      }

      const data = await response.json();
      setPreview(data.preview);

      // Select all valid products by default
      const validIndices = new Set<number>();
      data.preview.products.forEach((p: ImportProductValidation, idx: number) => {
        if (p.isValid && !p.isDuplicate) {
          validIndices.add(idx);
        }
      });
      setSelectedProducts(validIndices);

      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to process document');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessImport = async () => {
    if (!preview || selectedProducts.size === 0) {
      setError('Please select products to import');
      return;
    }

    setLoading(true);
    setError('');
    setStep('processing');

    try {
      const productsToImport = Array.from(selectedProducts).map(
        (idx) => preview.products[idx].product
      );

      const response = await fetch('/api/admin/products/import/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productsToImport }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import products');
      }

      const data = await response.json();
      setProcessingResult(data.results);

      // Call onSuccess after a short delay for user to see the result
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to import products');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (idx: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === preview?.products.filter(p => p.isValid && !p.isDuplicate).length) {
      setSelectedProducts(new Set());
    } else {
      const allValid = new Set<number>();
      preview?.products.forEach((p, idx) => {
        if (p.isValid && !p.isDuplicate) {
          allValid.add(idx);
        }
      });
      setSelectedProducts(allValid);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-[#EFE8DF] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[#F5EFE6] bg-gradient-to-r from-[#FFFDF9] to-[#F6EFE6]">
          <div>
            <h2 className="font-black text-2xl text-[#291D15]">
              {step === 'upload' && '📄 Import Products from Document'}
              {step === 'preview' && '👀 Review & Confirm'}
              {step === 'processing' && '⏳ Importing Products'}
            </h2>
            <p className="text-xs sm:text-sm text-[#786455] mt-1">
              {step === 'upload' && 'Upload a JPG, PNG, or PDF with product information'}
              {step === 'preview' && 'Select products to import. Green = valid, Yellow = duplicate, Red = error'}
              {step === 'processing' && `Importing ${selectedProducts.size} products...`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#8C7A6D] hover:text-[#291D15] p-1 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-[#EFE8DF] rounded-2xl p-8 text-center hover:border-[#EA580C] hover:bg-[#FFFDF9] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                  disabled={loading}
                />
                <label
                  htmlFor="file-input"
                  className="flex flex-col items-center gap-3 cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-[#EA580C]" />
                  <div>
                    <p className="font-bold text-[#291D15]">Drop your file here or click to select</p>
                    <p className="text-xs text-[#786455] mt-1">
                      Supports JPG, PNG (handwritten/printed text) and PDF documents
                    </p>
                    <p className="text-xs text-[#8C7A6D] mt-2">Maximum file size: 10MB</p>
                  </div>
                </label>
              </div>

              {file && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-900">{file.name}</p>
                    <p className="text-xs text-emerald-700">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold">How to use:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                    <li>Handwritten lists: Clear photos with good lighting</li>
                    <li>Printed documents: Scan or photograph clearly</li>
                    <li>Include: Product name, brand, MRP, weight, category</li>
                    <li>We'll auto-detect fields and calculate selling prices</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <p className="text-2xl font-black text-emerald-600">{preview.validCount}</p>
                  <p className="text-xs font-semibold text-emerald-900 mt-1">Ready to Import</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-center">
                  <p className="text-2xl font-black text-yellow-600">{preview.duplicateCount}</p>
                  <p className="text-xs font-semibold text-yellow-900 mt-1">Duplicates</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                  <p className="text-2xl font-black text-red-600">{preview.invalidCount}</p>
                  <p className="text-xs font-semibold text-red-900 mt-1">Errors</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center">
                  <p className="text-2xl font-black text-blue-600">{selectedProducts.size}</p>
                  <p className="text-xs font-semibold text-blue-900 mt-1">Selected</p>
                </div>
              </div>

              {/* Select All / Filter */}
              <div className="flex items-center justify-between p-3 bg-[#F6EFE6] rounded-xl border border-[#EFE8DF]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      selectedProducts.size > 0 &&
                      selectedProducts.size ===
                        preview.products.filter((p) => p.isValid && !p.isDuplicate).length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-[#EA580C]"
                  />
                  <span className="text-sm font-semibold text-[#291D15]">
                    Select All Valid Products
                  </span>
                </label>
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#786455] hover:text-[#291D15] transition-colors"
                >
                  {showErrors ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Hide Errors
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Show All
                    </>
                  )}
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto border border-[#EFE8DF] rounded-2xl">
                <table className="w-full text-sm">
                  <thead className="bg-[#F6EFE6] border-b border-[#EFE8DF] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input type="checkbox" disabled className="opacity-50" />
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-[#291D15]">Product</th>
                      <th className="px-4 py-3 text-left font-bold text-[#291D15]">Brand</th>
                      <th className="px-4 py-3 text-left font-bold text-[#291D15]">MRP</th>
                      <th className="px-4 py-3 text-left font-bold text-[#291D15]">Selling</th>
                      <th className="px-4 py-3 text-left font-bold text-[#291D15]">Stock</th>
                      <th className="px-4 py-3 text-left font-bold text-[#291D15]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE8DF]">
                    {preview.products.map((validation, idx) => {
                      const shouldShow =
                        showErrors ||
                        (validation.isValid && !validation.isDuplicate);

                      if (!shouldShow) return null;

                      const product = validation.product;
                      const isSelected = selectedProducts.has(idx);
                      const isSelectable = validation.isValid && !validation.isDuplicate;

                      return (
                        <tr
                          key={idx}
                          className={`${
                            isSelected ? 'bg-blue-50' : ''
                          } hover:bg-neutral-50 border-b border-[#EFE8DF]`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProductSelection(idx)}
                              disabled={!isSelectable}
                              className="w-4 h-4 rounded accent-[#EA580C] disabled:opacity-30 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#291D15] truncate">
                              {product.name}
                            </p>
                            {validation.warnings.length > 0 && (
                              <p className="text-xs text-yellow-600 mt-1">
                                ⚠️ {validation.warnings.join(', ')}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#786455]">
                            {product.brand || '-'}
                          </td>
                          <td className="px-4 py-3 text-[#786455]">
                            ₹{product.mrp}
                          </td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">
                            ₹{product.sellingPrice}
                          </td>
                          <td className="px-4 py-3 text-[#786455]">
                            {product.stock} units
                          </td>
                          <td className="px-4 py-3">
                            {validation.isDuplicate && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                Duplicate
                              </span>
                            )}
                            {validation.isValid && !validation.isDuplicate && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                                <CheckCircle className="w-3 h-3" />
                                Valid
                              </span>
                            )}
                            {!validation.isValid && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                                <AlertCircle className="w-3 h-3" />
                                Error
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Errors Display */}
              {preview.products.some((p) => !p.isValid && !p.isDuplicate) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="font-semibold text-red-900 mb-2">⚠️ Import Errors:</p>
                  <ul className="space-y-2">
                    {preview.products
                      .filter((p) => !p.isValid && !p.isDuplicate)
                      .map((validation, idx) => (
                        <li key={idx} className="text-xs text-red-800">
                          <p className="font-semibold">
                            {validation.product.name || 'Unknown'}:
                          </p>
                          <ul className="list-disc list-inside ml-2">
                            {validation.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && processingResult && (
            <div className="space-y-4">
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <p className="font-bold text-emerald-900 text-lg">
                  {processingResult.summary.successCount} Products Imported Successfully!
                </p>
                {processingResult.summary.duplicateCount > 0 && (
                  <p className="text-sm text-emerald-700 mt-2">
                    {processingResult.summary.duplicateCount} duplicates skipped
                  </p>
                )}
                {processingResult.summary.errorCount > 0 && (
                  <p className="text-sm text-yellow-700 mt-1">
                    {processingResult.summary.errorCount} errors encountered
                  </p>
                )}
              </div>

              {processingResult.duplicates.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                  <p className="font-semibold text-yellow-900 mb-2">
                    ⏭️ Skipped Duplicates ({processingResult.duplicates.length}):
                  </p>
                  <ul className="space-y-1 text-xs text-yellow-800">
                    {processingResult.duplicates.slice(0, 5).map((item: any, idx: number) => (
                      <li key={idx}>• {item.name}</li>
                    ))}
                    {processingResult.duplicates.length > 5 && (
                      <li>... and {processingResult.duplicates.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {processingResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="font-semibold text-red-900 mb-2">
                    ❌ Errors ({processingResult.errors.length}):
                  </p>
                  <ul className="space-y-1 text-xs text-red-800">
                    {processingResult.errors.slice(0, 5).map((item: any, idx: number) => (
                      <li key={idx}>• {item.name}: {item.reason}</li>
                    ))}
                    {processingResult.errors.length > 5 && (
                      <li>... and {processingResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 mx-6 mb-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 sm:p-8 border-t border-[#F5EFE6] bg-[#FFFDF9]">
          <button
            onClick={() => {
              if (step === 'preview') {
                setStep('upload');
                setPreview(null);
                setFile(null);
                setSelectedProducts(new Set());
              } else {
                onClose();
              }
            }}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl border border-[#EFE8DF] text-[#786455] hover:text-[#291D15] hover:bg-[#F6EFE6] font-bold text-sm transition-colors disabled:opacity-50"
          >
            {step === 'upload' ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            {step === 'processing' && loading && (
              <div className="flex items-center gap-2 px-6 py-2.5 text-[#EA580C] font-bold">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Importing...</span>
              </div>
            )}

            {step === 'upload' && (
              <button
                onClick={handleUploadAndPreview}
                disabled={!file || loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Analyze Document
                  </>
                )}
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleProcessImport}
                disabled={loading || selectedProducts.size === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Import {selectedProducts.size} Products
                  </>
                )}
              </button>
            )}

            {step === 'processing' && !loading && (
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl font-bold text-sm transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
