'use client';

/**
 * Wishlist Page - User's saved products
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, Package, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { WISHLIST_ENDPOINTS } from '@/lib/api-config';
import { Product } from '@/lib/types';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: number;
  product: Product;
  created_at: string;
}

export default function WishlistPage() {
  const { user, isAuthenticated, token } = useAuth();
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchWishlist();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(WISHLIST_ENDPOINTS.LIST, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: number) => {
    setRemovingIds(prev => new Set(prev).add(itemId));
    
    try {
      const response = await fetch(WISHLIST_ENDPOINTS.DELETE(itemId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setWishlistItems(items => items.filter(item => item.id !== itemId));
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product.id, 1);
    toast.success('Added to cart');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Sign in to view your wishlist</h2>
          <p className="mt-2 text-neutral-500">Save your favorite products for later</p>
          <Link href="/login?redirect=/dashboard/wishlist">
            <Button className="mt-6">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">My Wishlist</h1>
          <p className="mt-1 text-neutral-500">
            {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">Your wishlist is empty</h2>
            <p className="mt-2 text-neutral-500">Start saving products you love</p>
            <Link href="/products">
              <Button className="mt-6">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden border-neutral-100">
                {/* Image */}
                <Link href={`/products/${item.product.slug}`}>
                  <div className="relative aspect-square bg-neutral-50">
                    {item.product.primary_image?.image ? (
                      <Image
                        src={item.product.primary_image.image}
                        alt={item.product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-neutral-300" />
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromWishlist(item.id);
                      }}
                      disabled={removingIds.has(item.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      {removingIds.has(item.id) ? (
                        <div className="h-4 w-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-neutral-500 hover:text-red-500" />
                      )}
                    </button>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4">
                  <Link href={`/products/${item.product.slug}`}>
                    <h3 className="font-medium text-neutral-900 truncate group-hover:text-neutral-600 transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>
                  
                  <p className="mt-1 text-xs text-neutral-500">{item.product.vendor_name}</p>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">
                      Rs. {Number(item.product.price).toFixed(2)}
                    </span>
                    {item.product.compare_price && Number(item.product.compare_price) > Number(item.product.price) && (
                      <span className="text-sm text-neutral-400 line-through">
                        Rs. {Number(item.product.compare_price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleAddToCart(item.product)}
                    disabled={!item.product.is_in_stock}
                    className="w-full mt-4 h-10"
                    variant={item.product.is_in_stock ? 'default' : 'secondary'}
                  >
                    {item.product.is_in_stock ? (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </>
                    ) : (
                      'Out of Stock'
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
