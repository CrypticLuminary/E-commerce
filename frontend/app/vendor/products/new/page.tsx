'use client';

/**
 * Add New Product Page
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Category } from '@/lib/types';
import toast from 'react-hot-toast';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  compare_price: string;
  sku: string;
  stock: string;
  category_id: string;
  is_active: boolean;
}

export default function NewProductPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    sku: '',
    stock: '0',
    category_id: '',
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/vendor/products/new');
      return;
    }

    if (!authLoading && user && user.role !== 'vendor') {
      router.push('/vendor/setup');
      return;
    }

    fetchCategories();
  }, [isAuthenticated, authLoading, user, router]);

  const fetchCategories = async () => {
    try {
      const response = await apiRequest<Category[] | { results: Category[] }>(PRODUCT_ENDPOINTS.CATEGORIES);
      const categories = Array.isArray(response.data) ? response.data : response.data.results;
      setCategories(categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    if (!formData.category_id) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price
          ? parseFloat(formData.compare_price)
          : null,
        sku: formData.sku || null,
        stock: parseInt(formData.stock) || 0,
        category: parseInt(formData.category_id),
        is_active: formData.is_active,
      };

      await apiRequest(PRODUCT_ENDPOINTS.VENDOR_PRODUCTS, {
        method: 'POST',
        data: productData,
      });

      toast.success('Product created successfully!');
      router.push('/vendor/products');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      toast.error(error.response?.data?.detail || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user || user.role !== 'vendor') {
    return null;
  }

  return (
    <div className="container-custom py-8 max-w-3xl">
      <Link
        href="/vendor/products"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Link>

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className="input-field pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compare at Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    name="compare_price"
                    value={formData.compare_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input-field pl-8"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Original price for showing discount
                </p>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="Stock keeping unit"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Product Images Note */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Product Images
            </h3>
            <p className="text-sm text-gray-600">
              Image upload functionality would be implemented in a production version.
              For this demo, products will use placeholder images.
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Publish product immediately
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/vendor/products" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
