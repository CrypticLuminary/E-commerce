'use client';

/**
 * Order Confirmation Page
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle, Package, Truck, Home, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { ORDER_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Order } from '@/lib/types';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await apiRequest<Order>(`${ORDER_ENDPOINTS.LIST}${orderNumber}/`);
        setOrder(response.data);
      } catch (err: any) {
        console.error('Failed to fetch order:', err);
        setError('Order not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !order) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
        <p className="text-gray-600 mt-2">
          We couldn't find the order you're looking for.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Order Confirmed!</h1>
        <p className="text-gray-600 mt-2">
          Thank you for your order. We've sent a confirmation to your email.
        </p>
        <p className="text-lg font-semibold text-primary-600 mt-4">
          Order #{order.order_number}
        </p>
      </div>

      {/* Order Progress */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
        <div className="relative">
          <div className="flex justify-between items-center">
            {/* Order Placed */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium mt-2">Order Placed</span>
            </div>

            {/* Processing */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 ${order.status === 'pending' ? 'bg-gray-200' : 'bg-green-500'} rounded-full flex items-center justify-center`}>
                <Package className={`h-5 w-5 ${order.status === 'pending' ? 'text-gray-400' : 'text-white'}`} />
              </div>
              <span className="text-sm font-medium mt-2">Processing</span>
            </div>

            {/* Shipped */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 ${['shipped', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                <Truck className={`h-5 w-5 ${['shipped', 'delivered'].includes(order.status) ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <span className="text-sm font-medium mt-2">Shipped</span>
            </div>

            {/* Delivered */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                <Home className={`h-5 w-5 ${order.status === 'delivered' ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <span className="text-sm font-medium mt-2">Delivered</span>
            </div>
          </div>

          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{
                width:
                  order.status === 'pending'
                    ? '0%'
                    : order.status === 'confirmed'
                    ? '33%'
                    : order.status === 'shipped'
                    ? '66%'
                    : order.status === 'delivered'
                    ? '100%'
                    : '0%',
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>

          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0" />
                <div className="flex-grow">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-gray-500">
                    by {item.vendor_name || 'Store'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity} × {formatPrice(item.price || item.product_price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <div className="space-y-2 text-sm">
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
            <hr />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            {order.shipping_address ? (
              typeof order.shipping_address === 'string' ? (
                <p className="text-gray-600">{order.shipping_address}</p>
              ) : (
                <div className="text-gray-600">
                  {order.shipping_address.street_address && <p>{order.shipping_address.street_address}</p>}
                  {order.shipping_address.apartment && <p>{order.shipping_address.apartment}</p>}
                  <p>
                    {order.shipping_address.city && `${order.shipping_address.city}, `}
                    {order.shipping_address.state && `${order.shipping_address.state} `}
                    {order.shipping_address.postal_code}
                  </p>
                  {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
                </div>
              )
            ) : (
              <p className="text-gray-500">Address not available</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="text-gray-600">
              {order.payment_method && (
                <p>
                  <span className="font-medium">Method:</span>{' '}
                  {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                </p>
              )}
              {order.payment_status && (
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      order.payment_status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </p>
              )}
              <p className="mt-2">
                <span className="font-medium">Order Date:</span> {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
        <Link
          href="/orders"
          className="btn-secondary px-8 py-3 flex items-center justify-center gap-2"
        >
          View All Orders
        </Link>
        <Link
          href="/products"
          className="btn-primary px-8 py-3 flex items-center justify-center gap-2"
        >
          Continue Shopping
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
