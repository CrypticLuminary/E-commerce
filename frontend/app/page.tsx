'use client';

/**
 * Home Page - Minimalist Design
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Package, Store, Truck, Shield, ChevronRight, ChevronLeft,
  ShoppingBag, Shirt, Smartphone, Laptop, Headphones, Watch,
  Home, Sofa, Utensils, Book, Gamepad2, Dumbbell, Bike, Car,
  Baby, Heart, Sparkles, Gift, Music, Camera, Tv, Flower2,
  Dog, Plane, Coffee, Gem, Brush, Wrench, Zap
} from 'lucide-react';
import { PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';
import { cn } from '@/lib/cn';

// Icon mapping for Lucide icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'shopping-bag': ShoppingBag,
  'shirt': Shirt,
  'smartphone': Smartphone,
  'laptop': Laptop,
  'headphones': Headphones,
  'watch': Watch,
  'home': Home,
  'sofa': Sofa,
  'utensils': Utensils,
  'book': Book,
  'gamepad-2': Gamepad2,
  'dumbbell': Dumbbell,
  'bike': Bike,
  'car': Car,
  'baby': Baby,
  'heart': Heart,
  'sparkles': Sparkles,
  'gift': Gift,
  'music': Music,
  'camera': Camera,
  'tv': Tv,
  'flower-2': Flower2,
  'dog': Dog,
  'plane': Plane,
  'coffee': Coffee,
  'gem': Gem,
  'brush': Brush,
  'wrench': Wrench,
  'zap': Zap,
  'package': Package,
};

// Get icon component for a category
const getCategoryIcon = (category: Category) => {
  const iconName = category.display_icon || category.custom_icon || category.icon;
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return Package; // Default icon
};

// Slideshow layout types
type LayoutType = 'two-equal' | 'three-left-big' | 'three-right-big' | 'three-top-big' | 'four-grid';

// All available layouts
const ALL_LAYOUTS: LayoutType[] = [
  'two-equal',
  'three-left-big',
  'three-right-big', 
  'three-top-big',
  'four-grid',
];

const getLayoutCount = (layout: LayoutType): number => {
  if (layout === 'two-equal') return 2;
  if (layout === 'four-grid') return 4;
  return 3;
};

// Seeded random number generator for consistent randomization
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Shuffle array with seed for deterministic results
const shuffleWithSeed = <T,>(array: T[], seed: number): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate a sequence of layouts that covers all products
const generateLayoutSequence = (productCount: number, seed: number): LayoutType[] => {
  const layouts: LayoutType[] = [];
  let covered = 0;
  let iteration = 0;
  
  while (covered < productCount) {
    // Shuffle layouts for this iteration
    const shuffledLayouts = shuffleWithSeed(ALL_LAYOUTS, seed + iteration * 100);
    
    for (const layout of shuffledLayouts) {
      if (covered >= productCount) break;
      layouts.push(layout);
      covered += getLayoutCount(layout);
    }
    iteration++;
  }
  
  return layouts;
};

interface Slide {
  products: Product[];
  layout: LayoutType;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [cycleSeed, setCycleSeed] = useState(() => Date.now()); // Seed for randomization
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // Create slides from featured products with randomized layouts
  const slides = useMemo<Slide[]>(() => {
    if (featuredProducts.length === 0) return [];
    
    const layoutSequence = generateLayoutSequence(featuredProducts.length, cycleSeed);
    const slideArray: Slide[] = [];
    let productIndex = 0;
    
    for (const layout of layoutSequence) {
      if (productIndex >= featuredProducts.length) break;
      
      const count = getLayoutCount(layout);
      const slideProducts = featuredProducts.slice(productIndex, productIndex + count);
      
      if (slideProducts.length > 0) {
        // Adjust layout if we don't have enough products for this slide
        let actualLayout = layout;
        if (slideProducts.length === 1) {
          actualLayout = 'two-equal'; // Will just show 1 product
        } else if (slideProducts.length === 2 && layout !== 'two-equal') {
          actualLayout = 'two-equal';
        } else if (slideProducts.length === 3 && layout === 'four-grid') {
          actualLayout = 'three-left-big';
        }
        
        slideArray.push({ products: slideProducts, layout: actualLayout });
      }
      
      productIndex += count;
    }
    
    return slideArray;
  }, [featuredProducts, cycleSeed]);

  // Navigate to next slide
  const goToNext = useCallback(() => {
    if (isAnimating || slides.length <= 1) return;
    
    setSlideDirection('next');
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentSlide((prev) => {
        const next = prev + 1;
        // If we've completed a full cycle, generate new random layouts
        if (next >= slides.length) {
          setCycleSeed(Date.now());
          return 0;
        }
        return next;
      });
      setIsAnimating(false);
    }, 500);
  }, [isAnimating, slides.length]);

  // Navigate to previous slide
  const goToPrev = useCallback(() => {
    if (isAnimating || slides.length <= 1) return;
    
    setSlideDirection('prev');
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setIsAnimating(false);
    }, 500);
  }, [isAnimating, slides.length]);

  // Go to specific slide
  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    
    setSlideDirection(index > currentSlide ? 'next' : 'prev');
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentSlide]);

  // Reset autoplay timer
  const resetAutoplay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    
    if (!isPausedRef.current && slides.length > 1) {
      autoPlayRef.current = setInterval(goToNext, 5000);
    }
  }, [goToNext, slides.length]);

  // Auto-advance slideshow
  useEffect(() => {
    if (slides.length <= 1) return;
    
    autoPlayRef.current = setInterval(goToNext, 5000);
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [slides.length, goToNext]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(PRODUCT_ENDPOINTS.FEATURED),
          fetch(PRODUCT_ENDPOINTS.CATEGORIES)
        ]);

        if (productsRes.ok) {
          const products = await productsRes.json();
          setFeaturedProducts(Array.isArray(products) ? products : (products.results || []));
        }

        if (categoriesRes.ok) {
          const cats = await categoriesRes.json();
          setCategories(Array.isArray(cats) ? cats : (cats.results || []));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Minimalist */}
      <section className="relative overflow-hidden bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-sm text-neutral-600">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                New arrivals every week
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900">
                Discover Quality
                <span className="block text-neutral-400">From Trusted Vendors</span>
              </h1>
              <p className="text-lg text-neutral-600 max-w-md">
                Your one-stop marketplace connecting you with verified sellers. 
                Quality products, competitive prices, seamless experience.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="xl" asChild>
                  <Link href="/products">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link href="/vendors">
                    Explore Vendors
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative lg:h-[500px] animate-slide-up">
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl"></div>
              <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <Package className="h-24 w-24 mx-auto text-neutral-300 mb-4 animate-pulse" />
                      <p className="text-neutral-400">Loading products...</p>
                    </div>
                  </div>
                ) : slides.length > 0 ? (
                  <div className="relative w-full h-full overflow-hidden group">
                    {slides.map((slide, slideIndex) => {
                      const isActive = slideIndex === currentSlide;
                      
                      // Render product item
                      const renderProduct = (product: Product, className: string = '') => {
                        const imageUrl = product.primary_image?.image || product.images?.[0]?.image;
                        const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`) : null;
                        
                        return (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className={cn("relative rounded-xl overflow-hidden bg-neutral-100 group", className)}
                          >
                            {fullImageUrl ? (
                              <img
                                src={fullImageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-neutral-300" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white text-sm font-medium truncate">{product.name}</p>
                                <p className="text-white/80 text-xs">Rs. {product.price}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      };
                      
                      // Get layout-specific grid structure
                      const getLayoutContent = () => {
                        const products = slide.products;
                        
                        switch (slide.layout) {
                          case 'two-equal':
                            // Two equal columns
                            return (
                              <div className="grid grid-cols-2 gap-2 h-full">
                                {products[0] && renderProduct(products[0])}
                                {products[1] && renderProduct(products[1])}
                              </div>
                            );
                          
                          case 'three-left-big':
                            // Big left, two small stacked right
                            return (
                              <div className="grid grid-cols-5 gap-2 h-full">
                                <div className="col-span-3">
                                  {products[0] && renderProduct(products[0], 'h-full')}
                                </div>
                                <div className="col-span-2 grid grid-rows-2 gap-2">
                                  {products[1] && renderProduct(products[1])}
                                  {products[2] && renderProduct(products[2])}
                                </div>
                              </div>
                            );
                          
                          case 'three-right-big':
                            // Two small stacked left, big right
                            return (
                              <div className="grid grid-cols-5 gap-2 h-full">
                                <div className="col-span-2 grid grid-rows-2 gap-2">
                                  {products[0] && renderProduct(products[0])}
                                  {products[1] && renderProduct(products[1])}
                                </div>
                                <div className="col-span-3">
                                  {products[2] && renderProduct(products[2], 'h-full')}
                                </div>
                              </div>
                            );
                          
                          case 'three-top-big':
                            // Big top, two small bottom
                            return (
                              <div className="grid grid-rows-5 gap-2 h-full">
                                <div className="row-span-3">
                                  {products[0] && renderProduct(products[0], 'h-full')}
                                </div>
                                <div className="row-span-2 grid grid-cols-2 gap-2">
                                  {products[1] && renderProduct(products[1])}
                                  {products[2] && renderProduct(products[2])}
                                </div>
                              </div>
                            );
                          
                          case 'four-grid':
                            // 2x2 grid
                            return (
                              <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
                                {products[0] && renderProduct(products[0])}
                                {products[1] && renderProduct(products[1])}
                                {products[2] && renderProduct(products[2])}
                                {products[3] && renderProduct(products[3])}
                              </div>
                            );
                          
                          default:
                            return null;
                        }
                      };
                      
                      return (
                        <div
                          key={slideIndex}
                          className={cn(
                            "absolute inset-0 p-3 transition-all duration-500 ease-out",
                            // Current active slide
                            isActive && !isAnimating && "translate-y-0 opacity-100",
                            // Animating out (current slide leaving)
                            isActive && isAnimating && slideDirection === 'next' && "-translate-y-full opacity-0",
                            isActive && isAnimating && slideDirection === 'prev' && "translate-y-full opacity-0",
                            // Not active - position based on relation to current
                            !isActive && slideIndex > currentSlide && "translate-y-full opacity-0",
                            !isActive && slideIndex < currentSlide && "-translate-y-full opacity-0"
                          )}
                        >
                          {getLayoutContent()}
                        </div>
                      );
                    })}
                    
                    {/* Navigation arrows */}
                    {slides.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            goToPrev();
                            resetAutoplay();
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/90 shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                          aria-label="Previous slide"
                        >
                          <ChevronLeft className="h-4 w-4 text-neutral-700" />
                        </button>
                        <button
                          onClick={() => {
                            goToNext();
                            resetAutoplay();
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/90 shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                          aria-label="Next slide"
                        >
                          <ChevronRight className="h-4 w-4 text-neutral-700" />
                        </button>
                      </>
                    )}
                    
                    {/* Slide indicators */}
                    {slides.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {slides.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              goToSlide(index);
                              resetAutoplay();
                            }}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all duration-300",
                              currentSlide === index 
                                ? "bg-neutral-900 w-6" 
                                : "bg-neutral-300 hover:bg-neutral-400"
                            )}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Slide counter */}
                    <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
                      {currentSlide + 1} / {slides.length}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <Package className="h-24 w-24 mx-auto text-neutral-300 mb-4" />
                      <p className="text-neutral-400">Featured Product Showcase</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-neutral-900 rounded-2xl shadow-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">%</span>
              </div>
              <div className="absolute -bottom-4 -left-4 px-4 py-2 bg-white rounded-full shadow-lg border">
                <span className="text-sm font-medium">Free Shipping 🚚</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-y border-neutral-200 bg-neutral-50/50">
        <div className="container-custom py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Package, label: 'Wide Selection', desc: '10,000+ Products' },
              { icon: Store, label: 'Verified Vendors', desc: 'Trusted Sellers' },
              { icon: Truck, label: 'Fast Delivery', desc: '2-5 Business Days' },
              { icon: Shield, label: 'Secure Checkout', desc: '100% Protected' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="p-3 rounded-xl bg-white border border-neutral-200 transition-all duration-300 hover:shadow-md hover:scale-105">
                  <item.icon className="h-5 w-5 text-neutral-700" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{item.label}</p>
                  <p className="text-sm text-neutral-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
                Shop by Category
              </h2>
              <p className="mt-2 text-neutral-500">Find what you need, fast</p>
            </div>
            <Link 
              href="/categories" 
              className="hidden md:flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              View all categories
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="w-14 h-14 mx-auto mb-4 rounded-2xl" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </Card>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.filter(c => !c.parent).slice(0, 6).map((category, index) => {
                  const IconComponent = getCategoryIcon(category);
                  return (
                    <Link 
                      key={category.id} 
                      href={`/products?category=${category.slug}`}
                      className="group animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Card className="p-6 text-center hover:shadow-lg hover:border-neutral-300 hover:-translate-y-1 transition-all duration-300 h-full">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:scale-110 transition-all duration-300">
                          <IconComponent className="h-6 w-6 text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
                          {category.name}
                        </h3>
                        {category.product_count !== undefined && (
                          <p className="text-xs text-neutral-400 mt-1">
                            {category.product_count} items
                          </p>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
              {/* View all on mobile */}
              <div className="mt-6 text-center md:hidden">
                <Link href="/categories">
                  <Button variant="outline">
                    View All Categories
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-neutral-500">No categories available</p>
            </Card>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
                Featured Products
              </h2>
              <p className="mt-2 text-neutral-500">Handpicked for you</p>
            </div>
            <Link 
              href="/products" 
              className="hidden md:flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              View all products
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product, index) => (
                <div 
                  key={product.id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
              <p className="text-neutral-500 mb-4">No featured products yet</p>
              <Button variant="outline" asChild>
                <Link href="/products">Browse All Products</Link>
              </Button>
            </Card>
          )}
          
          <div className="mt-10 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link href="/products">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <Card className="bg-neutral-900 border-0 overflow-hidden animate-fade-in-up">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 md:p-12 lg:p-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Start Selling Today
                </h2>
                <p className="text-neutral-400 mb-8 max-w-md">
                  Join thousands of vendors on our platform. Low fees, powerful tools, 
                  and access to a growing customer base.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 hover:scale-105 transition-all duration-300" asChild>
                    <Link href="/vendor/setup">
                      Become a Vendor
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="lg" className="text-white hover:text-white hover:bg-white/10" asChild>
                    <Link href="/about">Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="relative hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-700"></div>
                <div className="absolute inset-8 border border-neutral-600 rounded-2xl flex items-center justify-center">
                  <Store className="h-20 w-20 text-neutral-500 animate-float" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
