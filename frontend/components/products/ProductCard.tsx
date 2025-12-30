'use client';

/**
 * Product Card Component - Minimalist Design
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Plus } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, truncateText } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { WISHLIST_ENDPOINTS } from '@/lib/api-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Check if product is in wishlist
  useEffect(() => {
    if (isAuthenticated && token) {
      checkWishlistStatus();
    }
  }, [isAuthenticated, token, product.id]);

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch(WISHLIST_ENDPOINTS.CHECK(product.id), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsInWishlist(data.is_in_wishlist);
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to save favorites');
      return;
    }

    setIsWishlistLoading(true);
    try {
      const response = await fetch(WISHLIST_ENDPOINTS.TOGGLE(product.id), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsInWishlist(data.status === 'added');
        toast.success(data.status === 'added' ? 'Added to wishlist!' : 'Removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.is_in_stock) {
      toast.error('Product is out of stock');
      return;
    }

    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // Handle image URL - use a placeholder div if no image
  const imageUrl = product.primary_image?.image || product.images?.[0]?.image;
  const hasImage = !!imageUrl;
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`) : '';
  const hasDiscount = product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price);

  return (
    <Link href={`/products/${product.slug}`} className={cn("group block", className)}>
      <div className="relative bg-white rounded-2xl border border-neutral-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          {hasImage ? (
            <Image
              src={fullImageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-300/50 flex items-center justify-center mb-2">
                  <ShoppingCart className="h-8 w-8 text-neutral-400" />
                </div>
                <span className="text-xs text-neutral-400">No image</span>
              </div>
            </div>
          )}
          
          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_featured && (
              <Badge className="bg-neutral-900 hover:bg-neutral-900">Featured</Badge>
            )}
            {hasDiscount && (
              <Badge variant="destructive">-{product.discount_percentage}%</Badge>
            )}
          </div>

          {/* Quick Actions - Top Right */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
              className={cn(
                "p-2 rounded-full shadow-sm transition-all duration-200 hover:scale-110",
                isInWishlist 
                  ? "bg-red-50 hover:bg-red-100" 
                  : "bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-white"
              )}
            >
              {isWishlistLoading ? (
                <div className="h-4 w-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              ) : (
                <Heart className={cn(
                  "h-4 w-4 transition-colors",
                  isInWishlist ? "text-red-500 fill-red-500" : "text-neutral-600"
                )} />
              )}
            </button>
          </div>

          {/* Out of Stock Overlay */}
          {!product.is_in_stock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">Out of Stock</Badge>
            </div>
          )}

          {/* Add to Cart - Bottom */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
            <Button
              onClick={handleAddToCart}
              disabled={!product.is_in_stock}
              className="w-full shadow-lg"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-grow flex flex-col">
          {/* Category */}
          {product.category && (
            <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
              {product.category.name}
            </span>
          )}

          {/* Name */}
          <h3 className="mt-1.5 font-medium text-neutral-900 leading-snug line-clamp-2 group-hover:text-neutral-600 transition-colors">
            {product.name}
          </h3>

          {/* Vendor */}
          <p className="text-sm text-neutral-400 mt-1">
            {product.vendor_name || product.vendor?.store_name}
          </p>

          {/* Price */}
          <div className="mt-auto pt-4 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-neutral-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-neutral-400 line-through">
                {formatPrice(product.compare_price!)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
