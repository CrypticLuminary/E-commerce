'use client';

/**
 * Vendor Products Management Page - Minimalist Design
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  MoreVertical,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS, PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
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

  const filterButtons = [
    { value: 'all', label: 'All', count: products.length },
    { value: 'active', label: 'Active', count: products.filter(p => p.is_active).length },
    { value: 'inactive', label: 'Inactive', count: products.filter(p => !p.is_active).length },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <Link
              href="/vendor/dashboard"
              className="inline-flex items-center text-neutral-500 hover:text-neutral-900 mb-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neutral-900 rounded-2xl">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">Products</h1>
                <p className="text-neutral-500">{products.length} products total</p>
              </div>
            </div>
          </div>

          <Button asChild>
            <Link href="/vendor/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6 animate-fade-in-up" style={{ animationDelay: '75ms' }}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                {filterButtons.map((btn) => (
                  <Button
                    key={btn.value}
                    variant={filter === btn.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(btn.value as typeof filter)}
                    className="min-w-[80px]"
                  >
                    {btn.label}
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "ml-2",
                        filter === btn.value ? "bg-white/20 text-white" : ""
                      )}
                    >
                      {btn.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
          <Card className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No products found</h3>
              <p className="text-neutral-500 mb-6">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Start by adding your first product'}
              </p>
              {!searchQuery && filter === 'all' && (
                <Button asChild>
                  <Link href="/vendor/products/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => {
              // Get image URL from primary_image or images array
              const imageUrl = product.primary_image?.image || product.images?.[0]?.image;
              const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`) : null;
              
              return (
              <Card 
                key={product.id} 
                className="overflow-hidden hover:shadow-md transition-all duration-300 animate-fade-in-up group"
                style={{ animationDelay: `${(index + 2) * 50}ms` }}
              >
                <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                  {fullImageUrl ? (
                    <Image
                      src={fullImageUrl}
                      alt={product.name}
                      fill
                      className="object-contain bg-white group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-12 w-12 text-neutral-300" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge variant={product.is_active ? 'success' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {/* Quick Actions */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                      onClick={() => handleToggleStatus(product.id, product.is_active)}
                    >
                      {product.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/vendor/products/${product.id}/edit`}>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white hover:text-red-600"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-neutral-900 truncate mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {formatPrice(product.price)}
                      </p>
                      {product.compare_price && (
                        <p className="text-sm text-neutral-400 line-through">
                          {formatPrice(product.compare_price)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-medium",
                        product.stock === 0 
                          ? "text-red-600" 
                          : product.stock < 10 
                          ? "text-amber-600" 
                          : "text-neutral-600"
                      )}>
                        {product.stock} in stock
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
