'use client';

/**
 * Cart Page - Minimalist Design
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, guestCart, isLoading, updateQuantity, removeItem, cartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  const handleUpdateQuantity = async (itemId: number, productId: number, newQuantity: number) => {
    setUpdatingItem(itemId);
    try {
      await updateQuantity(isAuthenticated ? itemId : productId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId: number, productId: number) => {
    try {
      await removeItem(isAuthenticated ? itemId : productId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (cartCount === 0) {
      toast.error('Your cart is empty');
      return;
    }
    router.push('/checkout');
  };

  if (isLoading) {
    return <PageLoading />;
  }

  // Determine items to display
  const items = isAuthenticated
    ? cart?.items || []
    : guestCart.filter(item => item.product);

  // Calculate totals
  const subtotal = isAuthenticated
    ? parseFloat(cart?.subtotal || '0')
    : guestCart.reduce((sum, item) => {
        if (item.product) {
          return sum + (parseFloat(item.product.price) * item.quantity);
        }
        return sum;
      }, 0);

  const shipping = subtotal >= 50 ? 0 : 5;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="container-custom py-24 text-center animate-fade-in-up">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-6 animate-bounce-subtle">
            <ShoppingBag className="h-10 w-10 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">Your cart is empty</h1>
          <p className="text-neutral-500 mt-2 mb-8">Looks like you haven't added anything yet.</p>
          <Button size="lg" asChild className="hover:scale-105 transition-transform">
            <Link href="/products">
              Start Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 lg:py-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Shopping Cart</h1>
          <p className="text-neutral-500 mt-1">{cartCount} item{cartCount !== 1 ? 's' : ''} in your cart</p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = isAuthenticated
              ? (item as any).product
              : (item as any).product;
            const itemId = isAuthenticated ? (item as any).id : product?.id;
            const quantity = item.quantity;

            if (!product) return null;

            const imageUrl = product.primary_image?.image || product.images?.[0]?.image;

            return (
              <Card key={itemId} className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-4 sm:gap-6">
                    {/* Product Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-neutral-100 rounded-lg overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`}
                          alt={product.name}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-neutral-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow min-w-0">
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-2"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-neutral-400 mt-0.5">
                        {product.vendor_name || product.vendor?.store_name}
                      </p>
                      <p className="font-medium text-neutral-900 mt-2">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex flex-col items-end justify-between">
                      <p className="font-semibold text-neutral-900">
                        {formatPrice(parseFloat(product.price) * quantity)}
                      </p>
                      
                      <div className="flex items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-neutral-200 rounded-lg">
                          <button
                            onClick={() => handleUpdateQuantity(itemId, product.id, quantity - 1)}
                            disabled={quantity <= 1 || updatingItem === itemId}
                            className="p-2 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 py-1 min-w-[40px] text-center text-sm font-medium">
                            {updatingItem === itemId ? '...' : quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(itemId, product.id, quantity + 1)}
                            disabled={quantity >= product.stock || updatingItem === itemId}
                            className="p-2 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(itemId, product.id)}
                          className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal ({cartCount} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Tax (10%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              {subtotal < 50 && (
                <div className="bg-neutral-50 rounded-lg p-3 text-sm">
                  <p className="text-neutral-600">
                    Add <span className="font-medium text-neutral-900">{formatPrice(50 - subtotal)}</span> more for free shipping
                  </p>
                  <div className="mt-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-neutral-900 rounded-full transition-all"
                      style={{ width: `${Math.min((subtotal / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleCheckout} className="w-full" size="lg">
                Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-xs text-center text-neutral-400">
                Secure checkout powered by Stripe
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
