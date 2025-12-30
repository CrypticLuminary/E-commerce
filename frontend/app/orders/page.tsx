'use client';

/**
 * Orders List Page
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { ORDER_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Order } from '@/lib/types';

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
      return;
    }

    const fetchOrders = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await apiRequest<Order[] | { results: Order[] }>(ORDER_ENDPOINTS.LIST);
        const orders = Array.isArray(response.data) ? response.data : response.data.results;
        setOrders(orders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (orders.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <ShoppingBag className="h-24 w-24 mx-auto text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900 mt-6">No orders yet</h1>
        <p className="text-gray-600 mt-2">
          When you place an order, it will appear here.
        </p>
        <Link href="/products" className="btn-primary mt-6 inline-block">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.order_number}`}
            className="card p-6 block hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Order Info */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Order #{order.order_number}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Placed on {formatDate(order.created_at)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.items?.length || 0} item(s)
                  </p>
                </div>
              </div>

              {/* Status & Total */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatPrice(order.total)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Order Items Preview */}
            {order.items && order.items.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2 flex-wrap">
                  {order.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="w-12 h-12 bg-gray-100 rounded"
                      title={item.product_name}
                    />
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
