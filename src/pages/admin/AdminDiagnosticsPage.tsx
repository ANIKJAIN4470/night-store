import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';

export const AdminDiagnosticsPage: React.FC = () => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [adminMe, setAdminMe] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tk = localStorage.getItem('papis_admin_token');
    setToken(tk);
  }, []);

  const handleCheckAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setAdminMe(data);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Diagnostic Test Product ' + Date.now(),
          description: 'Test product created at ' + new Date().toISOString(),
          mrp: 25,
          sellingPrice: 35,
          stock: 100,
          category: 'Chips',
          imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd94548?auto=format&fit=crop&w=500&q=60',
          available: true,
          isVeg: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Product created: ' + data.product.id);
        await handleFetchProducts();
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-bold text-blue-900 mb-2">Admin Diagnostics</h2>
        <p className="text-sm text-blue-800">This page helps diagnose authentication and product creation issues.</p>
      </div>

      {/* Auth Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-lg">Authentication Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">User from Context:</p>
            <p className="font-mono bg-gray-100 p-2 rounded text-xs break-all">{user ? JSON.stringify(user) : 'null'}</p>
          </div>
          <div>
            <p className="text-gray-600">Token in LocalStorage:</p>
            <p className="font-mono bg-gray-100 p-2 rounded text-xs break-all">{token ? token.substring(0, 50) + '...' : 'null'}</p>
          </div>
        </div>
        <button
          onClick={handleCheckAuth}
          disabled={loading || !token}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Auth /me'}
        </button>
        {adminMe && (
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(adminMe, null, 2)}
          </pre>
        )}
      </div>

      {/* Products Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-lg">Products Status</h3>
        <button
          onClick={handleFetchProducts}
          disabled={loading || !token}
          className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Fetching...' : `Fetch Products (${products.length})`}
        </button>
        <div className="text-sm">
          <p className="text-gray-600 mb-2">Total products: {products.length}</p>
          <div className="max-h-40 overflow-auto bg-gray-50 p-2 rounded text-xs">
            {products.length > 0 ? (
              <ul>
                {products.slice(0, 10).map((p) => (
                  <li key={p.id} className="py-1 border-b">
                    {p.name} (₹{p.sellingPrice})
                  </li>
                ))}
                {products.length > 10 && <li className="py-1 text-gray-600">... and {products.length - 10} more</li>}
              </ul>
            ) : (
              <p className="text-gray-600">No products loaded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Test Product */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-lg">Create Test Product</h3>
        <p className="text-sm text-gray-600">Click below to create a test product and verify the API is working.</p>
        <button
          onClick={handleCreateTestProduct}
          disabled={loading || !token}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Test Product'}
        </button>
      </div>
    </div>
  );
};
