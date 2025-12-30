'use client';

/**
 * Vendor Orders Management Page - Minimalist Design
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Search, ChevronDown, Truck, ShoppingBag, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

interface VendorOrderItem {
  id: number;
  order_number: string;
  product_name: string;
  product_id: number;
  quantity: number;
  price: string;
  subtotal: string;
  status: string;
  created_at: string;
  customer_name?: string;
  shipping_address?: {
    city: string;
    state: string;
  };
}

export default function VendorOrdersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<VendorOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/vendor/orders');
      return;
    }

    if (!authLoading && user && user.role !== 'vendor') {
      router.push('/vendor/setup');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, authLoading, user, router]);

  const fetchOrders = async () => {
    if (!isAuthenticated || user?.role !== 'vendor') return;

    try {
      const response = await apiRequest<VendorOrderItem[] | { results: VendorOrderItem[] }>(VENDOR_ENDPOINTS.MY_ORDERS);
      const orders = Array.isArray(response.data) ? response.data : response.data.results;
      setOrders(orders);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      if (error?.response?.status === 403 || error?.status === 403) {
        router.push('/vendor/setup');
        return;
      }
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (itemId: number, newStatus: string) => {
    try {
      await apiRequest(VENDOR_ENDPOINTS.UPDATE_ORDER_ITEM_STATUS(itemId), {
        method: 'PATCH',
        data: { status: newStatus },
      });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user || user.role !== 'vendor') {
    return null;
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Orders', icon: ShoppingBag },
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { value: 'processing', label: 'Processing', icon: Package },
    { value: 'shipped', label: 'Shipped', icon: Truck },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'shipped':
        return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
    shipped: orders.filter(o => o.status === 'shipped').length,
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <Link
            href="/vendor/dashboard"
            className="inline-flex items-center text-neutral-500 hover:text-neutral-900 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-900 rounded-2xl">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Orders</h1>
              <p className="text-neutral-500">{orders.length} orders total</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: orderStats.total, color: 'bg-neutral-100 text-neutral-600' },
            { label: 'Pending', value: orderStats.pending, color: 'bg-amber-50 text-amber-600' },
            { label: 'Processing', value: orderStats.processing, color: 'bg-blue-50 text-blue-600' },
            { label: 'Shipped', value: orderStats.shipped, color: 'bg-violet-50 text-violet-600' },
          ].map((stat, index) => (
            <Card key={stat.label} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CardContent className="p-4">
                <p className="text-sm text-neutral-500">{stat.label}</p>
                <p className={cn("text-2xl font-semibold mt-1", stat.color.split(' ')[1])}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order # or product..."
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 flex-wrap">
                {statusOptions.slice(0, 4).map((option) => (
                  <Button
                    key={option.value}
                    variant={statusFilter === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(option.value)}
                  >
                    <option.icon className="h-4 w-4 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No orders found</h3>
              <p className="text-neutral-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Orders will appear here when customers purchase your products'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <Card 
                key={order.id} 
                className="hover:shadow-md transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${(index + 3) * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-neutral-100 rounded-xl">
                        <Package className="h-5 w-5 text-neutral-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-neutral-900">
                            #{order.order_number}
                          </h3>
                          <Badge className={cn("border", getStatusBadgeColor(order.status))}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-neutral-600">{order.product_name}</p>
                        <p className="text-sm text-neutral-500 mt-1">
                          Qty: {order.quantity} × {formatPrice(order.price)}
                        </p>
                        <p className="text-xs text-neutral-400 mt-2">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Shipping & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Shipping Info */}
                      {order.shipping_address && (
                        <div className="text-sm text-neutral-500 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span>{order.shipping_address.city}, {order.shipping_address.state}</span>
                        </div>
                      )}

                      {/* Price & Status Update */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-neutral-900">
                            {formatPrice(order.subtotal)}
                          </p>
                        </div>

                        {/* Status Dropdown */}
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className={cn(
                              "appearance-none px-4 py-2 pr-10 rounded-xl text-sm font-medium cursor-pointer border transition-colors",
                              getStatusBadgeColor(order.status)
                            )}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
