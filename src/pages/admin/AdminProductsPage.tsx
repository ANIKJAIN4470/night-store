import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Flame,
  UtensilsCrossed,
  RefreshCw,
  Image as ImageIcon,
  Copy,
  AlertTriangle,
  Upload,
  Loader,
} from 'lucide-react';
import { useAdminProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts.js';
import { Product } from '../../types.js';
import { ImportProductsModal } from '../../components/admin/ImportProductsModal.js';

const CATEGORIES = [
  'Chips',
  'Wafers',
  'Namkeen',
  'Instant Noodles',
  'Candies',
  'Chocolates',
  'Cookies & Biscuits',
  'Drinks',
];

export const AdminProductsPage: React.FC = () => {
  const { data: products = [], isLoading, error, refetch } = useAdminProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Search & filter
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mrp, setMrp] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [category, setCategory] = useState<string>('Chips');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [available, setAvailable] = useState(true);
  const [isSpecial, setIsSpecial] = useState(false);
  const [isVeg, setIsVeg] = useState(true);
  const [brand, setBrand] = useState('');
  const [flavor, setFlavor] = useState('');
  const [size, setSize] = useState('');
  const [weight, setWeight] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setMrp(0);
    setSellingPrice(0);
    setStock(10);
    setCategory('Chips');
    setImageUrl('https://images.unsplash.com/photo-1599599810694-b5ac4dd94548?auto=format&fit=crop&w=500&q=60');
    setImageFile(null);
    setImagePreview('');
    setAvailable(true);
    setIsSpecial(false);
    setIsVeg(true);
    setBrand('');
    setFlavor('');
    setSize('');
    setWeight('');
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setMrp(p.mrp || 0);
    setSellingPrice(p.sellingPrice || 0);
    setStock(p.stock || 0);
    setCategory(p.category);
    setImageUrl(p.imageUrl);
    setImageFile(null);
    setImagePreview('');
    setAvailable(p.available);
    setIsSpecial(!!p.isSpecial);
    setIsVeg(p.isVeg !== false);
    setBrand(p.brand || '');
    setFlavor(p.flavor || '');
    setSize(p.size || '');
    setWeight(p.weight || '');
    setModalOpen(true);
  };

  const handleToggleAvailable = async (p: Product) => {
    try {
      await updateProductMutation.mutateAsync({
        id: p.id,
        updates: { available: !p.available },
      });
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProductMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleToggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      alert('No products selected');
      return;
    }

    setBulkDeleteLoading(true);
    try {
      const productIds = Array.from(selectedProducts);
      const response = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete products');
      }

      const data = await response.json();
      alert(
        `Deleted ${data.results.summary.successCount} products. ${data.results.summary.errorCount} errors.`
      );
      setBulkDeleteConfirm(false);
      setSelectedProducts(new Set());
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to delete products');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Note: We store the preview for visual feedback only
      // We do NOT use it in the form submission
      // Instead, we use the default imageUrl to avoid sending large data URLs
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setImagePreview(preview);
      };
      reader.readAsDataURL(file);
      
      console.log(`📸 Image file selected: ${file.name} (${file.size} bytes)`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('❌ Product name is required');
      return;
    }
    if (!description.trim()) {
      alert('❌ Product description is required');
      return;
    }
    if (mrp <= 0) {
      alert('❌ MRP must be greater than 0');
      return;
    }
    if (sellingPrice < mrp) {
      alert('❌ Selling price must be >= MRP');
      return;
    }
    if (stock < 0) {
      alert('❌ Stock cannot be negative');
      return;
    }

    setFormSubmitting(true);
    try {
      // If an image file was selected, use the preview (data URL)
      // Otherwise, use the default imageUrl
      let finalImageUrl = imageUrl;
      
      if (imagePreview) {
        // Image file was selected
        finalImageUrl = imagePreview;
        console.log(`📸 Using uploaded image (${imagePreview.length} bytes)`);
      } else if (!imageUrl) {
        // No image selected and no URL set - use default
        finalImageUrl = 'https://images.unsplash.com/photo-1599599810694-b5ac4dd94548?auto=format&fit=crop&w=500&q=60';
      }

      const productData = {
        name,
        description,
        mrp,
        sellingPrice,
        stock,
        category,
        imageUrl: finalImageUrl,
        available,
        isSpecial,
        isVeg,
        brand: brand || undefined,
        flavor: flavor || undefined,
        size: size || undefined,
        weight: weight || undefined,
      };

      console.log('📤 Submitting product:', productData);

      if (editingProduct) {
        console.log('✏️  Updating product:', editingProduct.id);
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          updates: productData,
        });
        console.log('✅ Product updated successfully');
      } else {
        console.log('➕ Creating new product');
        await createProductMutation.mutateAsync(productData as any);
        console.log('✅ Product created successfully');
      }
      alert(`✅ Product ${editingProduct ? 'updated' : 'created'} successfully!`);
      setModalOpen(false);
    } catch (err: any) {
      console.error('❌ Product submission error:', err);
      const errorMsg = err.message || 'Failed to save product';
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === 'All' || p.category === selectedCat;
    const matchSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#291D15] tracking-tight">
            Snack Products & Prices
          </h1>
          <p className="text-xs sm:text-sm text-[#786455] mt-0.5">
            Configure menu items, prices in INR, and mark sold-out snacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[#EFE8DF] bg-white text-[#291D15] hover:bg-[#F6EFE6] transition-colors"
            title="Refresh products"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            title="Import products from document"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Import</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Snack</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE8DF] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snacks..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9] focus:outline-hidden focus:border-[#EA580C]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCat('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
              selectedCat === 'All' ? 'bg-[#EA580C] text-white' : 'bg-[#F6EFE6] text-[#5C4A3E]'
            }`}
          >
            All ({products.length})
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                selectedCat === c ? 'bg-[#EA580C] text-white' : 'bg-[#F6EFE6] text-[#5C4A3E]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error instanceof Error ? error.message : String(error)}</span>
        </div>
      )}

      {/* Bulk Operations Bar */}
      {selectedProducts.size > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-900">
              {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Bulk Selection Filters */}
      {selectedProducts.size < filteredProducts.length && filteredProducts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-amber-900">📋 Quick Select by Category or Brand:</p>
          
          {/* Category Quick Select */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-800">Categories:</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const categoryProducts = filteredProducts.filter((p) => p.category === cat);
                const categorySelected = categoryProducts.filter((p) => selectedProducts.has(p.id));
                const isAllSelected = categorySelected.length === categoryProducts.length && categoryProducts.length > 0;
                const isSomeSelected = categorySelected.length > 0;

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      const newSelected = new Set(selectedProducts);
                      const categoryIds = categoryProducts.map((p) => p.id);
                      if (isAllSelected) {
                        categoryIds.forEach((id) => newSelected.delete(id));
                      } else {
                        categoryIds.forEach((id) => newSelected.add(id));
                      }
                      setSelectedProducts(newSelected);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isAllSelected
                        ? 'bg-amber-600 text-white'
                        : isSomeSelected
                        ? 'bg-amber-300 text-amber-900'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {cat} ({categoryProducts.length})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Quick Select */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-800">Brands:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Set(
                  filteredProducts
                    .filter((p) => p.brand)
                    .map((p) => p.brand)
                    .filter((b) => b)
                )
              )
                .sort()
                .map((brand) => {
                  const brandProducts = filteredProducts.filter((p) => p.brand === brand);
                  const brandSelected = brandProducts.filter((p) => selectedProducts.has(p.id));
                  const isAllSelected = brandSelected.length === brandProducts.length;
                  const isSomeSelected = brandSelected.length > 0;

                  return (
                    <button
                      key={brand}
                      onClick={() => {
                        const newSelected = new Set(selectedProducts);
                        const brandIds = brandProducts.map((p) => p.id);
                        if (isAllSelected) {
                          brandIds.forEach((id) => newSelected.delete(id));
                        } else {
                          brandIds.forEach((id) => newSelected.add(id));
                        }
                        setSelectedProducts(newSelected);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isAllSelected
                          ? 'bg-amber-600 text-white'
                          : isSomeSelected
                          ? 'bg-amber-300 text-amber-900'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {brand} ({brandProducts.length})
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="space-y-3">
        {/* Select All Checkbox */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F6EFE6] rounded-xl border border-[#EFE8DF]">
            <input
              type="checkbox"
              checked={
                selectedProducts.size > 0 &&
                selectedProducts.size === filteredProducts.length
              }
              onChange={handleSelectAll}
              className="w-4 h-4 rounded accent-[#EA580C] cursor-pointer"
              title="Select all visible products"
            />
            <label className="text-xs font-semibold text-[#291D15] cursor-pointer">
              Select All ({filteredProducts.length})
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className={`relative bg-white rounded-3xl border overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                p.available ? 'border-[#EFE8DF]' : 'border-neutral-200 opacity-75 bg-neutral-50'
              } ${selectedProducts.has(p.id) ? 'ring-2 ring-blue-400' : ''}`}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={selectedProducts.has(p.id)}
                  onChange={() => handleToggleProductSelection(p.id)}
                  className="w-5 h-5 rounded accent-[#EA580C] cursor-pointer shadow-md"
                />
              </div>

              <div>
                <div className="relative aspect-16/9 bg-[#F5EFE6]">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-[#EA580C] uppercase tracking-wider">
                    {p.category}
                  </div>
                  {p.isSpecial && (
                    <div className="absolute top-2.5 right-2.5 bg-[#EA580C] text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-xs">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>Special</span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-[#291D15] line-clamp-1">{p.name}</h3>
                    <div className="flex flex-col items-end gap-0.5">
                      {p.mrp && p.sellingPrice && (
                        <>
                          <span className="text-xs line-through text-[#999] font-medium">₹{p.mrp}</span>
                          <span className="font-black text-base text-[#EA580C]">₹{p.sellingPrice}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#786455] line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                  {p.stock !== undefined && (
                    <div className="text-xs font-bold text-[#5C4A3E] pt-1">
                      Stock: {p.stock} {p.weight ? `(${p.weight})` : 'units'}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-2 border-t border-[#F5EFE6] flex items-center justify-between gap-2 bg-[#FFFDF9]">
                {/* Availability Switch */}
                <button
                  onClick={() => handleToggleAvailable(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    p.available
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                  }`}
                >
                  {p.available ? '● Available' : '○ Sold Out'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-2 rounded-xl text-[#786455] hover:text-[#291D15] hover:bg-[#F6EFE6] transition-colors"
                    title="Edit product details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(p.id)}
                    className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#EFE8DF] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]">
              <h3 className="font-black text-xl text-[#291D15]">
                {editingProduct ? 'Edit Snack Product' : 'Add New Snack to Menu'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#8C7A6D] hover:text-[#291D15] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Product Name and Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lays Masala"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Lays"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9]"
                  />
                </div>
              </div>

              {/* Flavor and Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    Flavor
                  </label>
                  <input
                    type="text"
                    value={flavor}
                    onChange={(e) => setFlavor(e.target.value)}
                    placeholder="e.g. Masala Munch"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. 15g"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9]"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#F6EFE6] rounded-xl border border-[#EFE8DF]">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    MRP (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={mrp}
                    onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={mrp}
                    step={0.5}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    Profit (+₹)
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm font-bold text-[#EA580C] bg-white">
                    {(sellingPrice - mrp).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Stock and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                  Weight / Quantity Info
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 50g, 200ml"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Appetizing description of ingredients and spices..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EFE8DF] text-xs text-[#291D15] bg-[#FFFDF9]"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-2">
                  Product Image
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs text-[#291D15] bg-[#FFFDF9] file:mr-2 file:px-2 file:py-1 file:rounded-md file:border-0 file:bg-[#EA580C] file:text-white file:text-xs file:font-bold"
                    />
                  </div>
                </div>
                {(imagePreview || imageUrl) && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-[#EFE8DF] aspect-video bg-[#F5EFE6]">
                    <img
                      src={imagePreview || imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!imagePreview && !imageUrl && (
                  <div className="mt-2 px-4 py-3 rounded-xl border border-dashed border-[#EFE8DF] bg-[#FFFDF9] flex items-center justify-center gap-2 text-[#8C7A6D]">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs">No image selected</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#4A3B32] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="rounded-sm text-[#EA580C] focus:ring-[#EA580C]"
                  />
                  <span>In Stock</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#4A3B32] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpecial}
                    onChange={(e) => setIsSpecial(e.target.checked)}
                    className="rounded-sm text-[#EA580C] focus:ring-[#EA580C]"
                  />
                  <span>Chef's Special</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#4A3B32] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVeg}
                    onChange={(e) => setIsVeg(e.target.checked)}
                    className="rounded-sm text-[#EA580C] focus:ring-[#EA580C]"
                  />
                  <span>Vegetarian</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#F5EFE6]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#786455] hover:bg-[#F6EFE6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#EFE8DF] space-y-4">
            <h3 className="font-black text-lg text-[#291D15]">Delete Snack Product?</h3>
            <p className="text-xs text-[#786455]">
              Are you sure you want to remove this item? Past orders will safely retain their historical snapshot.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#786455] hover:bg-[#F6EFE6]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#EFE8DF] space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <h3 className="font-black text-lg text-[#291D15]">Delete {selectedProducts.size} Products?</h3>
            </div>
            <p className="text-xs text-[#786455]">
              Are you sure you want to permanently remove these {selectedProducts.size} item
              {selectedProducts.size !== 1 ? 's' : ''}? This action cannot be undone. Past orders will retain their snapshots.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                disabled={bulkDeleteLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#786455] hover:bg-[#F6EFE6] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {bulkDeleteLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Products Modal */}
      <ImportProductsModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};