'use client';

/**
 * Vendor Dashboard Page - Minimalist Design
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Settings,
  ChevronRight,
  BarChart3,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
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
        const productsRes = await apiRequest<Product[] | { results: Product[] }>(VENDOR_ENDPOINTS.MY_PRODUCTS);
        const productList = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.results;
        setProducts(productList.slice(0, 5));

        const ordersRes = await apiRequest<VendorOrder[] | { results: VendorOrder[] }>(VENDOR_ENDPOINTS.MY_ORDERS);
        const ordersList = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.results;
        setOrders(ordersList.slice(0, 5));

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
      change: '+12%',
      trend: 'up',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Eye,
      label: 'Active Products',
      value: stats.active_products,
      change: '+8%',
      trend: 'up',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: ShoppingCart,
      label: 'Pending Orders',
      value: stats.pending_orders,
      change: '-3%',
      trend: 'down',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: formatPrice(stats.total_revenue),
      change: '+23%',
      trend: 'up',
      color: 'bg-violet-50 text-violet-600',
    },
  ];

  const quickActions = [
    {
      icon: Package,
      label: 'Manage Products',
      description: 'Edit, add, or remove products',
      href: '/vendor/products',
      color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    },
    {
      icon: ShoppingCart,
      label: 'View Orders',
      description: 'Process and track orders',
      href: '/vendor/orders',
      color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    },
    {
      icon: Settings,
      label: 'Store Settings',
      description: 'Update store information',
      href: '/vendor/settings',
      color: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700';
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-900 rounded-2xl">
              <Store className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Vendor Dashboard</h1>
              <p className="text-neutral-500">Manage your store and products</p>
            </div>
          </div>

          <Button asChild>
            <Link href="/vendor/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <Card 
              key={stat.label} 
              className="animate-fade-in-up hover:shadow-md transition-all duration-300"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn('p-2.5 rounded-xl', stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold text-neutral-900">{stat.value}</p>
                  <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Products */}
          <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg">Recent Products</CardTitle>
                <CardDescription>Your latest product listings</CardDescription>
              </div>
              <Link
                href="/vendor/products"
                className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 mb-4">No products yet</p>
                  <Button asChild size="sm">
                    <Link href="/vendor/products/new">Add Your First Product</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => {
                    const imageUrl = product.primary_image?.image || product.images?.[0]?.image;
                    const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`) : null;
                    const isActive = product.is_active === true;
                    
                    return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                    >
                      <div className="w-14 h-14 bg-neutral-100 rounded-xl flex-shrink-0 overflow-hidden">
                        {fullImageUrl ? (
                          <Image
                            src={fullImageUrl}
                            alt={product.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{product.name}</p>
                        <p className="text-sm text-neutral-500">
                          {formatPrice(product.price)} • Stock: {product.stock}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={isActive ? 'success' : 'secondary'}
                          className="hidden sm:inline-flex"
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Link
                          href={`/vendor/products/${product.id}/edit`}
                          className="p-2 rounded-lg hover:bg-neutral-100 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Edit className="h-4 w-4 text-neutral-500" />
                        </Link>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '225ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </div>
              <Link
                href="/vendor/orders"
                className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">No orders yet</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Orders will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href="/vendor/orders"
                      className="block p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-neutral-900">#{order.order_number}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-500 truncate">{order.product_name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-neutral-400">{formatDate(order.created_at)}</p>
                        <p className="font-semibold text-neutral-900">{formatPrice(order.subtotal)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              className="animate-fade-in-up"
              style={{ animationDelay: `${(index + 4) * 75}ms` }}
            >
              <Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={cn('p-3 rounded-xl transition-colors', action.color)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900">{action.label}</p>
                    <p className="text-sm text-neutral-500 truncate">{action.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

