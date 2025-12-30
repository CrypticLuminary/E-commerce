'use client';

/**
 * Product Detail Page - Minimalist Design
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Minus, Plus, Store, ArrowLeft, Truck, Shield, RotateCcw, Check } from 'lucide-react';
import { PRODUCT_ENDPOINTS, WISHLIST_ENDPOINTS } from '@/lib/api-config';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(PRODUCT_ENDPOINTS.DETAIL(slug));
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        } else {
          router.push('/products');
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug, router]);

  // Check wishlist status when product loads
  useEffect(() => {
    if (product && isAuthenticated && token) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated, token]);

  const checkWishlistStatus = async () => {
    if (!product) return;
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

  const handleWishlistToggle = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to save favorites');
      router.push(`/login?redirect=/products/${slug}`);
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

  const handleAddToCart = async () => {
    if (!product || !product.is_in_stock) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      toast.success(`Added ${quantity} item(s) to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 text-lg mb-4">Product not found.</p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImage] || product.primary_image;

  return (
    <div className="min-h-screen bg-white">
      <div className="container-custom py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-neutral-500 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square relative bg-neutral-50 rounded-2xl overflow-hidden">
              {currentImage ? (
                <Image
                  src={currentImage.image.startsWith('http') ? currentImage.image : `http://localhost:8000${currentImage.image}`}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  No image available
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_featured && (
                  <Badge className="bg-neutral-900 text-white">Featured</Badge>
                )}
                {product.discount_percentage && product.discount_percentage > 0 && (
                  <Badge variant="destructive">
                    -{product.discount_percentage}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                      selectedImage === index 
                        ? "border-neutral-900 ring-2 ring-neutral-900/20" 
                        : "border-transparent hover:border-neutral-300"
                    )}
                  >
                    <Image
                      src={image.image.startsWith('http') ? image.image : `http://localhost:8000${image.image}`}
                      alt={`${product.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="space-y-6">
            {/* Category */}
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-xs font-medium text-neutral-500 uppercase tracking-widest hover:text-neutral-900 transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-semibold text-neutral-900 leading-tight">
              {product.name}
            </h1>

            {/* Vendor */}
            {product.vendor && (
              <Link
                href={`/vendors/${product.vendor.id}`}
                className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <Store className="h-4 w-4" />
                <span>Sold by <span className="font-medium text-neutral-900">{product.vendor.store_name}</span></span>
              </Link>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-neutral-900">
                {formatPrice(product.price)}
              </span>
              {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
                <span className="text-lg text-neutral-400 line-through">
                  {formatPrice(product.compare_price)}
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-neutral-600 leading-relaxed">{product.short_description}</p>
            )}

            <Separator />

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.is_in_stock ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-neutral-600">
                    In Stock <span className="text-neutral-400">({product.stock} available)</span>
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-neutral-600">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-700">Quantity</span>
              <div className="flex items-center border border-neutral-200 rounded-lg">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="p-3 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 min-w-[60px] text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="p-3 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddToCart}
                disabled={!product.is_in_stock || isAddingToCart}
                className="flex-1 h-12 text-base"
                size="lg"
              >
                {isAddingToCart ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className={cn(
                  "h-12 w-12 p-0 transition-all",
                  isInWishlist && "border-red-200 bg-red-50 hover:bg-red-100"
                )}
                onClick={handleWishlistToggle}
                disabled={isWishlistLoading}
              >
                {isWishlistLoading ? (
                  <div className="h-5 w-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                ) : (
                  <Heart className={cn(
                    "h-5 w-5 transition-colors",
                    isInWishlist ? "text-red-500 fill-red-500" : "text-neutral-600"
                  )} />
                )}
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center p-4 rounded-xl bg-neutral-50">
                <Truck className="h-5 w-5 mx-auto text-neutral-600" />
                <p className="text-xs text-neutral-600 mt-2">Free Shipping</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-neutral-50">
                <Shield className="h-5 w-5 mx-auto text-neutral-600" />
                <p className="text-xs text-neutral-600 mt-2">Secure Payment</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-neutral-50">
                <RotateCcw className="h-5 w-5 mx-auto text-neutral-600" />
                <p className="text-xs text-neutral-600 mt-2">Easy Returns</p>
              </div>
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-neutral-400 pt-4">
                SKU: {product.sku}
              </p>
            )}
          </div>
        </div>

        {/* Full Description */}
        <div className="mt-16 max-w-3xl">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Description</h2>
          <div className="prose prose-neutral max-w-none">
            <p className="text-neutral-600 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
