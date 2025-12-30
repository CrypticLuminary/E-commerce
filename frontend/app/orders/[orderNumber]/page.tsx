'use client';

/**
 * Order Detail Page
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  ArrowLeft,
  Truck,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { ORDER_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Order } from '@/lib/types';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderNumber}`);
      return;
    }

    const fetchOrder = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await apiRequest(`${ORDER_ENDPOINTS.LIST}${orderNumber}/`);
        setOrder(response.data);
      } catch (err: any) {
        console.error('Failed to fetch order:', err);
        setError('Order not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrder();
    }
  }, [isAuthenticated, authLoading, orderNumber, router]);

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !order) {
    return (
      <div className="container-custom py-16 text-center">
        <Package className="h-24 w-24 mx-auto text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900 mt-6">Order Not Found</h1>
        <p className="text-gray-600 mt-2">
          We couldn't find the order you're looking for.
        </p>
        <Link href="/orders" className="btn-primary mt-6 inline-block">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Order #{order.order_number}
          </h1>
          <p className="text-gray-500">Placed on {formatDate(order.created_at)}</p>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(
            order.status
          )}`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Order Timeline */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Timeline</h2>
        <div className="space-y-4">
          <TimelineItem
            icon={<Clock className="h-4 w-4" />}
            title="Order Placed"
            description={`Your order was placed on ${formatDate(order.created_at)}`}
            active={true}
          />
          <TimelineItem
            icon={<CheckCircle className="h-4 w-4" />}
            title="Order Confirmed"
            description="Your order has been confirmed"
            active={['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)}
          />
          <TimelineItem
            icon={<Package className="h-4 w-4" />}
            title="Processing"
            description="Your order is being prepared"
            active={['processing', 'shipped', 'delivered'].includes(order.status)}
          />
          <TimelineItem
            icon={<Truck className="h-4 w-4" />}
            title="Shipped"
            description="Your order is on its way"
            active={['shipped', 'delivered'].includes(order.status)}
          />
          <TimelineItem
            icon={<MapPin className="h-4 w-4" />}
            title="Delivered"
            description="Your order has been delivered"
            active={order.status === 'delivered'}
            isLast
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items ({order.items?.length || 0})
            </h2>

            <div className="divide-y">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0" />

                  {/* Product Info */}
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                    <p className="text-sm text-gray-500">by {item.vendor_name || 'Store'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-600">Qty: {item.quantity}</span>
                      <span className="text-gray-600">
                        Unit price: {formatPrice(item.price)}
                      </span>
                    </div>
                    {/* Vendor fulfillment status */}
                    <span
                      className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${getOrderStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status?.charAt(0).toUpperCase() + (item.status?.slice(1) || '')}
                    </span>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Details */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{formatPrice(order.shipping_cost || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatPrice(order.tax || 0)}</span>
              </div>
              {order.discount && parseFloat(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </h2>
            {order.shipping_address ? (
              <div className="text-gray-600 text-sm">
                <p>{order.shipping_address.street_address}</p>
                {order.shipping_address.apartment && (
                  <p>{order.shipping_address.apartment}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Address not available</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment
            </h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="font-medium">Method:</span>{' '}
                {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {order.payment_status?.charAt(0).toUpperCase() +
                    (order.payment_status?.slice(1) || '')}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {order.status === 'delivered' && (
              <button className="btn-primary w-full">Leave a Review</button>
            )}
            {['pending', 'confirmed'].includes(order.status) && (
              <button className="btn-secondary w-full text-red-600 border-red-300 hover:bg-red-50">
                Cancel Order
              </button>
            )}
            <Link
              href="/products"
              className="block text-center text-primary-600 hover:text-primary-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline Item Component
function TimelineItem({
  icon,
  title,
  description,
  active,
  isLast = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
          }`}
        >
          {icon}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-12 ${active ? 'bg-green-500' : 'bg-gray-200'}`} />
        )}
      </div>
      <div>
        <p className={`font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>
          {title}
        </p>
        <p className={`text-sm ${active ? 'text-gray-600' : 'text-gray-400'}`}>
          {description}
        </p>
      </div>
    </div>
  );
}
