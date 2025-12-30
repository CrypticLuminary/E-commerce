'use client';

/**
 * Vendor Orders Management Page
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Search, ChevronDown, Truck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
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
      // If 403, user has vendor role but no vendor_profile - redirect to setup
      if (error?.response?.status === 403 || error?.status === 403) {
        router.push('/vendor/setup');
        return;
      }
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await apiRequest(`${VENDOR_ENDPOINTS.MY_ORDERS}${orderId}/update-status/`, {
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

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/vendor/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">{orders.length} orders total</p>
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
              placeholder="Search by order # or product..."
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field md:w-48"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No orders found</h3>
          <p className="text-gray-500 mt-2">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Orders will appear here when customers purchase your products'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Order Info */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Package className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-500">{order.product_name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {order.quantity} × {formatPrice(order.price)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>

                {/* Shipping Info */}
                {order.shipping_address && (
                  <div className="text-sm text-gray-500">
                    <p className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Ship to: {order.shipping_address.city}, {order.shipping_address.state}
                    </p>
                  </div>
                )}

                {/* Status & Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPrice(order.subtotal)}
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className={`appearance-none px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer ${getOrderStatusColor(
                        order.status
                      )}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
