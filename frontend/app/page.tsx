'use client';

/**
 * Home Page - Minimalist Design
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Package, Store, Truck, Shield, ChevronRight } from 'lucide-react';
import { PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
              <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-center p-8">
                  <Package className="h-24 w-24 mx-auto text-neutral-300 mb-4" />
                  <p className="text-neutral-400">Featured Product Showcase</p>
                </div>
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
              href="/products" 
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category, index) => (
                <Link 
                  key={category.id} 
                  href={`/products?category=${category.slug}`}
                  className="group animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="p-6 text-center hover:shadow-lg hover:border-neutral-300 hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:scale-110 transition-all duration-300">
                      <Package className="h-6 w-6 text-neutral-600 group-hover:text-white transition-colors" />
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
              ))}
            </div>
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
