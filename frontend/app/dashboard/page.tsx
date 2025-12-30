'use client';

/**
 * User Dashboard Page - Minimalist Design
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Package,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Store,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { ORDER_ENDPOINTS } from '@/lib/api-config';
import { formatPrice, formatDate } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import { Order } from '@/lib/types';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    const fetchData = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await apiRequest(ORDER_ENDPOINTS.LIST) as any;
        const orders = response?.data?.results || response?.data || [];
        setRecentOrders(orders.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      href: '/dashboard/profile',
      description: 'Personal information',
    },
    {
      icon: MapPin,
      label: 'Addresses',
      href: '/dashboard/addresses',
      description: 'Shipping addresses',
    },
    {
      icon: Package,
      label: 'Orders',
      href: '/orders',
      description: 'Order history',
    },
    {
      icon: Heart,
      label: 'Wishlist',
      href: '/dashboard/wishlist',
      description: 'Saved items',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/dashboard/settings',
      description: 'Account settings',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 animate-fade-in">
        {/* Welcome Section */}
        <Card className="mb-8 animate-fade-in-up">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center">
                  <User className="h-7 w-7 text-neutral-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900">
                    Welcome, {user.first_name || user.email.split('@')[0]}
                  </h1>
                  <p className="text-sm text-neutral-500">{user.email}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {user.role === 'vendor' && (
                  <Button asChild>
                    <Link href="/vendor/dashboard">
                      <Store className="h-4 w-4 mr-2" />
                      Vendor Dashboard
                    </Link>
                  </Button>
                )}

                {user.role === 'customer' && (
                  <Button asChild variant="outline">
                    <Link href="/vendor/setup">
                      <Store className="h-4 w-4 mr-2" />
                      Become a Seller
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2 space-y-3">
            {menuItems.map((item, index) => (
              <Link 
                key={item.href} 
                href={item.href}
                className="animate-fade-in-up block"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-neutral-100 rounded-xl group-hover:bg-neutral-200 group-hover:scale-110 transition-all duration-300">
                        <item.icon className="h-5 w-5 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-neutral-900">{item.label}</h3>
                        <p className="text-sm text-neutral-500">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 group-hover:translate-x-1 transition-all duration-300" />
                  </CardContent>
                </Card>
              </Link>
            ))}

            <Separator className="my-4" />

            {/* Logout Button */}
            <button onClick={handleLogout} className="w-full">
              <Card className="hover:bg-red-50 hover:-translate-y-0.5 transition-all duration-300 border-red-100">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <LogOut className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-red-600">Sign Out</h3>
                    <p className="text-sm text-neutral-500">Log out of your account</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          </div>

          {/* Recent Orders */}
          <div>
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                  <Link
                    href="/orders"
                    className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    View All
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-10 w-10 mx-auto text-neutral-300 mb-3" />
                    <p className="text-sm text-neutral-500">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/orders/${order.order_number}`}
                        className="block p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm text-neutral-900">#{order.order_number}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-neutral-900">
                              {formatPrice(order.total)}
                            </p>
                            <Badge className={cn("mt-1 text-xs", getStatusColor(order.status))}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
