'use client';

/**
 * Checkout Page - Minimalist Design
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { apiRequest } from '@/lib/api-client';
import { AUTH_ENDPOINTS, ORDER_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, getGuestCart, clearGuestCart } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';
import { CreditCard, Truck, ArrowLeft, Check, MapPin, Shield } from 'lucide-react';

interface Address {
  id: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface ShippingFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street_address: string;
  apartment: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const { cart, guestCart, cartCount, refreshCart } = useCart();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [formData, setFormData] = useState<ShippingFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Bagmati',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        try {
          const response = await apiRequest(AUTH_ENDPOINTS.ADDRESSES) as any;
          const addrs = response?.data?.results || response?.data || [];
          setAddresses(addrs);
          if (addrs.length > 0) {
            const defaultAddr = addrs.find((a: Address) => a.is_default);
            setSelectedAddressId(defaultAddr?.id || addrs[0].id);
          } else {
            setUseNewAddress(true);
          }
        } catch (error) {
          console.error('Failed to fetch addresses:', error);
          setUseNewAddress(true);
        }
      } else {
        setUseNewAddress(true);
      }

      if (user) {
        setFormData((prev) => ({
          ...prev,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
        }));
      }

      setIsLoading(false);
    };

    fetchData();
  }, [isAuthenticated, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (useNewAddress || !isAuthenticated) {
      const requiredFields: (keyof ShippingFormData)[] = [
        'first_name',
        'last_name',
        'email',
        'street_address',
        'city',
        'state',
        'postal_code',
        'country',
      ];

      for (const field of requiredFields) {
        if (!formData[field].trim()) {
          toast.error(`Please fill in ${field.replace('_', ' ')}`);
          return false;
        }
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
    } else if (!selectedAddressId) {
      toast.error('Please select a shipping address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartCount === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let orderData: any = {
        customer_notes: '',
      };

      if (isAuthenticated) {
        if (useNewAddress) {
          // Send flat shipping fields as expected by backend
          orderData.shipping_full_name = `${formData.first_name} ${formData.last_name}`.trim();
          orderData.shipping_phone = formData.phone || '';
          orderData.shipping_address_line1 = formData.street_address;
          orderData.shipping_address_line2 = formData.apartment || '';
          orderData.shipping_city = formData.city;
          orderData.shipping_state = formData.state;
          orderData.shipping_postal_code = formData.postal_code;
          orderData.shipping_country = formData.country;
          orderData.save_address = true;
        } else {
          // Use saved address ID
          orderData.address_id = selectedAddressId;
        }
      } else {
        // Guest checkout
        orderData.guest_email = formData.email;
        orderData.shipping_full_name = `${formData.first_name} ${formData.last_name}`.trim();
        orderData.shipping_phone = formData.phone || '';
        orderData.shipping_address_line1 = formData.street_address;
        orderData.shipping_address_line2 = formData.apartment || '';
        orderData.shipping_city = formData.city;
        orderData.shipping_state = formData.state;
        orderData.shipping_postal_code = formData.postal_code;
        orderData.shipping_country = formData.country;
        orderData.items = guestCart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }));
      }

      const endpoint = isAuthenticated
        ? ORDER_ENDPOINTS.CHECKOUT
        : ORDER_ENDPOINTS.GUEST_CHECKOUT;

      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(orderData),
      }) as any;

      if (isAuthenticated) {
        await refreshCart();
      } else {
        clearGuestCart();
        await refreshCart();
      }

      toast.success('Order placed successfully!');
      router.push(`/orders/${response?.data?.order_number || response?.data?.id}/confirmation`);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = isAuthenticated ? cart?.items || [] : guestCart;
  const subtotal = isAuthenticated
    ? parseFloat(cart?.subtotal || '0')
    : guestCart.reduce((sum, item) => {
        if (item.product) {
          return sum + parseFloat(item.product.price) * item.quantity;
        }
        return sum;
      }, 0);
  const shipping = subtotal >= 50 ? 0 : 5;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  if (isLoading) {
    return <PageLoading />;
  }

  if (cartCount === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8">
        <Link
          href="/cart"
          className="inline-flex items-center text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Link>

        <h1 className="text-2xl font-semibold text-neutral-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Saved Addresses */}
              {isAuthenticated && addresses.length > 0 && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={cn(
                          "block p-4 border rounded-xl cursor-pointer transition-all",
                          selectedAddressId === address.id && !useNewAddress
                            ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                            : "border-neutral-200 hover:border-neutral-300"
                        )}
                      >
                        <input
                          type="radio"
                          name="savedAddress"
                          value={address.id}
                          checked={selectedAddressId === address.id && !useNewAddress}
                          onChange={() => {
                            setSelectedAddressId(address.id);
                            setUseNewAddress(false);
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">
                              {address.city}, {address.state}
                            </p>
                            <p className="text-sm text-neutral-600 mt-1">
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                            </p>
                            <p className="text-sm text-neutral-600">
                              {address.city}, {address.state} {address.postal_code}
                            </p>
                          </div>
                          {selectedAddressId === address.id && !useNewAddress && (
                            <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </label>
                    ))}

                    <button
                      type="button"
                      onClick={() => setUseNewAddress(true)}
                      className={cn(
                        "w-full p-4 border rounded-xl text-left transition-all",
                        useNewAddress
                          ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                          : "border-neutral-200 hover:border-neutral-300"
                      )}
                    >
                      <span className="font-medium text-neutral-900">+ Use a new address</span>
                    </button>
                  </CardContent>
                </Card>
              )}

              {/* New Address Form */}
              {(useNewAddress || !isAuthenticated) && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      {isAuthenticated ? 'New Shipping Address' : 'Shipping Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">First Name *</label>
                        <Input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Last Name *</label>
                        <Input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Email *</label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Phone</label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="h-11"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Street Address *</label>
                        <Input
                          type="text"
                          name="street_address"
                          value={formData.street_address}
                          onChange={handleInputChange}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Apartment, Suite, etc.</label>
                        <Input
                          type="text"
                          name="apartment"
                          value={formData.apartment}
                          onChange={handleInputChange}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">City *</label>
                        <Input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">State/Province *</label>
                        <Input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Postal Code *</label>
                        <Input
                          type="text"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleInputChange}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Province *</label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full h-11 px-3 rounded-md border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950"
                          required
                        >
                          <option value="Koshi">Koshi</option>
                          <option value="Madhesh">Madhesh</option>
                          <option value="Bagmati">Bagmati</option>
                          <option value="Gandaki">Gandaki</option>
                          <option value="Lumbini">Lumbini</option>
                          <option value="Karnali">Karnali</option>
                          <option value="Sudurpashchim">Sudurpashchim</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-4">
                    <p className="text-sm text-amber-800">
                      <strong>Demo Mode:</strong> No actual payment will be processed.
                    </p>
                  </div>

                  <label className={cn(
                    "flex items-center gap-3 p-4 border rounded-xl cursor-pointer",
                    "border-neutral-900 bg-neutral-50"
                  )}>
                    <div className="w-5 h-5 rounded-full border-2 border-neutral-900 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                    </div>
                    <span className="font-medium text-neutral-900">Cash on Delivery</span>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      defaultChecked
                      className="sr-only"
                    />
                  </label>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Cart Items Preview */}
                  <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                    {items.map((item: any) => {
                      const product = item.product;
                      if (!product) return null;

                      return (
                        <div key={product.id} className="flex gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {product.primary_image && (
                              <Image
                                src={product.primary_image.image.startsWith('http') 
                                  ? product.primary_image.image 
                                  : `http://localhost:8000${product.primary_image.image}`}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">{product.name}</p>
                            <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-neutral-900">
                            {formatPrice(parseFloat(product.price) * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Subtotal</span>
                      <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Shipping</span>
                      <span className="font-medium text-neutral-900">
                        {shipping === 0 ? 'Free' : formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Tax (10%)</span>
                      <span className="font-medium text-neutral-900">{formatPrice(tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold text-neutral-900">Total</span>
                      <span className="font-semibold text-neutral-900">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 h-12"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      `Place Order • ${formatPrice(total)}`
                    )}
                  </Button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
                    <Shield className="h-4 w-4" />
                    <span>Secure checkout</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
