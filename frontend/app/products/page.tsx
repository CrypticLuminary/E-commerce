'use client';

/**
 * Products Page - Minimalist Design
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { Product, Category, PaginatedResponse } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states from URL params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const inStock = searchParams.get('in_stock') || '';
  const ordering = searchParams.get('ordering') || '-created_at';

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category_slug', category);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        if (inStock) params.append('in_stock', inStock);
        if (ordering) params.append('ordering', ordering);
        params.append('page', currentPage.toString());

        const response = await fetch(
          `${PRODUCT_ENDPOINTS.LIST}?${params.toString()}`,
          { cache: 'no-store' }
        );
        
        if (response.ok) {
          const data: PaginatedResponse<Product> = await response.json();
          setProducts(data.results);
          setTotalCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [search, category, minPrice, maxPrice, inStock, ordering, currentPage]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(PRODUCT_ENDPOINTS.CATEGORIES);
        if (response.ok) {
          const data = await response.json();
          setCategories(Array.isArray(data) ? data : (data.results || []));
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Update URL params
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    router.push('/products');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || category || minPrice || maxPrice || inStock;
  const totalPages = Math.ceil(totalCount / 12);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-neutral-50/50">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Products</h1>
              <p className="text-neutral-500 mt-1">
                {totalCount} product{totalCount !== 1 ? 's' : ''} found
                {search && <span className="text-neutral-900"> for &quot;{search}&quot;</span>}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Select */}
              <select
                value={ordering}
                onChange={(e) => updateFilters('ordering', e.target.value)}
                className="h-9 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950"
              >
                <option value="-created_at">Newest</option>
                <option value="created_at">Oldest</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-sales_count">Best Selling</option>
              </select>

              {/* Filter Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                    !
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {search && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Search: {search}
                  <button onClick={() => updateFilters('search', '')} className="ml-1 hover:bg-neutral-300 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {category && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {categories.find(c => c.slug === category)?.name || category}
                  <button onClick={() => updateFilters('category', '')} className="ml-1 hover:bg-neutral-300 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(minPrice || maxPrice) && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Price: {minPrice || '0'} - {maxPrice || '∞'}
                  <button onClick={() => { updateFilters('min_price', ''); updateFilters('max_price', ''); }} className="ml-1 hover:bg-neutral-300 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {inStock && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  In Stock
                  <button onClick={() => updateFilters('in_stock', '')} className="ml-1 hover:bg-neutral-300 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className={cn(
            "transition-all duration-300",
            showFilters ? "w-64 flex-shrink-0" : "w-0 overflow-hidden"
          )}>
            <Card className="p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-neutral-900">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">Category</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => updateFilters('category', '')}
                      className={cn(
                        "block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        !category ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                      )}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => updateFilters('category', cat.slug)}
                        className={cn(
                          "block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          category === cat.slug ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">Price Range</h3>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => updateFilters('min_price', e.target.value)}
                      className="h-9"
                      min="0"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => updateFilters('max_price', e.target.value)}
                      className="h-9"
                      min="0"
                    />
                  </div>
                </div>

                <Separator />

                {/* Availability */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">Availability</h3>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      inStock === 'true' 
                        ? "bg-neutral-900 border-neutral-900" 
                        : "border-neutral-300 group-hover:border-neutral-400"
                    )}>
                      {inStock === 'true' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={inStock === 'true'}
                      onChange={(e) => updateFilters('in_stock', e.target.checked ? 'true' : '')}
                      className="sr-only"
                    />
                    <span className="text-sm text-neutral-600">In Stock Only</span>
                  </label>
                </div>
              </div>
            </Card>
          </aside>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-neutral-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900">No products found</h3>
                <p className="text-neutral-500 mt-1 mb-6">Try adjusting your filters or search term</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {products.map((product, index) => (
                    <div 
                      key={product.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "ghost"}
                            size="icon"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
