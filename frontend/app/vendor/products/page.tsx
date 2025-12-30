'use client';

/**
 * Vendor Products Management Page
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS, PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Product } from '@/lib/types';
import toast from 'react-hot-toast';

export default function VendorProductsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/vendor/products');
      return;
    }

    if (!authLoading && user && user.role !== 'vendor') {
      router.push('/vendor/setup');
      return;
    }

    fetchProducts();
  }, [isAuthenticated, authLoading, user, router]);

  const fetchProducts = async () => {
    if (!isAuthenticated || user?.role !== 'vendor') return;

    try {
      const response = await apiRequest<Product[] | { results: Product[] }>(VENDOR_ENDPOINTS.MY_PRODUCTS);
      const products = Array.isArray(response.data) ? response.data : response.data.results;
      setProducts(products);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      // If 403, user has vendor role but no vendor_profile - redirect to setup
      if (error?.response?.status === 403 || error?.status === 403) {
        router.push('/vendor/setup');
        return;
      }
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (productId: number, currentStatus: boolean) => {
    try {
      await apiRequest(`${PRODUCT_ENDPOINTS.VENDOR_PRODUCTS}${productId}/`, {
        method: 'PATCH',
        data: { is_active: !currentStatus },
      });
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await apiRequest(`${PRODUCT_ENDPOINTS.VENDOR_PRODUCTS}${productId}/`, {
        method: 'DELETE',
      });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user || user.role !== 'vendor') {
    return null;
  }

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && product.is_active) ||
      (filter === 'inactive' && !product.is_active);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/vendor/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500">{products.length} products total</p>
        </div>

        <Link href="/vendor/products/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'inactive'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No products found</h3>
          <p className="text-gray-500 mt-2">
            {searchQuery || filter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Start by adding your first product'}
          </p>
          {!searchQuery && filter === 'all' && (
            <Link
              href="/vendor/products/new"
              className="btn-primary mt-4 inline-block"
            >
              Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-600">Product</th>
                <th className="text-left p-4 font-semibold text-gray-600 hidden md:table-cell">
                  Price
                </th>
                <th className="text-left p-4 font-semibold text-gray-600 hidden md:table-cell">
                  Stock
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                <th className="text-right p-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500 md:hidden">
                          {formatPrice(product.price)} • Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <p className="font-medium">{formatPrice(product.price)}</p>
                    {product.compare_price && (
                      <p className="text-sm text-gray-400 line-through">
                        {formatPrice(product.compare_price)}
                      </p>
                    )}
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span
                      className={`${
                        product.stock === 0
                          ? 'text-red-600'
                          : product.stock < 10
                          ? 'text-yellow-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(product.id, product.is_active)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title={product.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {product.is_active ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      <Link
                        href={`/vendor/products/${product.id}/edit`}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
