'use client';

/**
 * Vendor Dashboard Page
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Product } from '@/lib/types';
import toast from 'react-hot-toast';

interface VendorStats {
  total_products: number;
  active_products: number;
  pending_orders: number;
  total_revenue: number;
}

interface VendorOrder {
  id: number;
  order_number: string;
  product_name: string;
  quantity: number;
  subtotal: string;
  status: string;
  created_at: string;
}

export default function VendorDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<VendorStats>({
    total_products: 0,
    active_products: 0,
    pending_orders: 0,
    total_revenue: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/vendor/dashboard');
      return;
    }

    if (!authLoading && user && user.role !== 'vendor') {
      router.push('/vendor/setup');
      return;
    }

    const fetchData = async () => {
      if (!isAuthenticated || user?.role !== 'vendor') return;

      try {
        // Fetch vendor products
        const productsRes = await apiRequest<Product[] | { results: Product[] }>(VENDOR_ENDPOINTS.MY_PRODUCTS);
        const productList = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.results;
        setProducts(productList.slice(0, 5));

        // Fetch vendor orders
        const ordersRes = await apiRequest<VendorOrder[] | { results: VendorOrder[] }>(VENDOR_ENDPOINTS.MY_ORDERS);
        const ordersList = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.results;
        setOrders(ordersList.slice(0, 5));

        // Calculate stats
        setStats({
          total_products: productList.length,
          active_products: productList.filter((p: Product) => p.is_active).length,
          pending_orders: ordersList.filter((o: VendorOrder) => o.status === 'pending').length,
          total_revenue: ordersList.reduce(
            (sum: number, o: VendorOrder) => sum + parseFloat(o.subtotal || '0'),
            0
          ),
        });
      } catch (error: any) {
        console.error('Failed to fetch vendor data:', error);
        // If 403, user has vendor role but no vendor_profile - redirect to setup
        if (error?.response?.status === 403 || error?.status === 403) {
          router.push('/vendor/setup');
          return;
        }
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'vendor') {
      fetchData();
    }
  }, [isAuthenticated, authLoading, user, router]);

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user || user.role !== 'vendor') {
    return null;
  }

  const statCards = [
    {
      icon: Package,
      label: 'Total Products',
      value: stats.total_products,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Eye,
      label: 'Active Products',
      value: stats.active_products,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: ShoppingCart,
      label: 'Pending Orders',
      value: stats.pending_orders,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: formatPrice(stats.total_revenue),
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Store className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="text-gray-500">Manage your store and products</p>
          </div>
        </div>

        <Link href="/vendor/products/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Products</h2>
            <Link
              href="/vendor/products"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-gray-500 mt-2">No products yet</p>
              <Link
                href="/vendor/products/new"
                className="btn-primary mt-4 inline-block"
              >
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(product.price)} • Stock: {product.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Link
                      href={`/vendor/products/${product.id}/edit`}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link
              href="/vendor/orders"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-gray-500 mt-2">No orders yet</p>
              <p className="text-sm text-gray-400">
                Orders will appear here when customers purchase your products
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/vendor/orders/${order.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">#{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.product_name}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.subtotal)}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/vendor/products"
          className="card p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
        >
          <div className="p-3 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Manage Products</p>
            <p className="text-sm text-gray-500">Edit, add, or remove products</p>
          </div>
        </Link>

        <Link
          href="/vendor/orders"
          className="card p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
        >
          <div className="p-3 bg-green-100 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">View Orders</p>
            <p className="text-sm text-gray-500">Process and track orders</p>
          </div>
        </Link>

        <Link
          href="/vendor/settings"
          className="card p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
        >
          <div className="p-3 bg-purple-100 rounded-lg">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Store Settings</p>
            <p className="text-sm text-gray-500">Update store information</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
