'use client';

/**
 * Vendors Page - Minimalist Design
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Store, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { VENDOR_ENDPOINTS } from '@/lib/api-config';
import { Vendor, PaginatedResponse } from '@/lib/types';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

export default function VendorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const search = searchParams.get('search') || '';
  const featured = searchParams.get('featured') || '';

  useEffect(() => {
    const fetchVendors = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (featured) params.append('is_featured', featured);
        params.append('page', currentPage.toString());

        const response = await fetch(
          `${VENDOR_ENDPOINTS.LIST}?${params.toString()}`,
          { cache: 'no-store' }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setVendors(data);
            setTotalCount(data.length);
          } else {
            setVendors(data.results || []);
            setTotalCount(data.count || 0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, [search, featured, currentPage]);

  const updateSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`/vendors?${params.toString()}`);
    setCurrentPage(1);
  };

  const toggleFeatured = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (featured) {
      params.delete('featured');
    } else {
      params.set('featured', 'true');
    }
    params.delete('page');
    router.push(`/vendors?${params.toString()}`);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / 12);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-neutral-50/50">
        <div className="container-custom py-12">
          <h1 className="text-3xl font-semibold text-neutral-900">Our Vendors</h1>
          <p className="mt-2 text-neutral-500">
            Discover trusted sellers offering quality products
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search vendors..."
              defaultValue={search}
              onChange={(e) => updateSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Button
            variant={featured ? 'default' : 'outline'}
            onClick={toggleFeatured}
            className="gap-2"
          >
            <Star className={cn("h-4 w-4", featured && "fill-current")} />
            Featured Only
          </Button>
        </div>

        {/* Results Count */}
        <p className="mb-6 text-sm text-neutral-500">
          {totalCount} vendor{totalCount !== 1 ? 's' : ''} found
        </p>

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900">No vendors found</h3>
            <p className="mt-1 text-neutral-500">
              {search ? 'Try adjusting your search terms' : 'Check back later for new vendors'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor, index) => (
                <div 
                  key={vendor.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <VendorCard vendor={vendor} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link href={`/vendors/${vendor.id}`}>
      <Card className="group p-6 border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all duration-200">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-14 h-14 rounded-full bg-neutral-50 border border-neutral-100 overflow-hidden flex-shrink-0">
            {vendor.store_logo ? (
              <Image
                src={vendor.store_logo}
                alt={vendor.store_name}
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store className="h-5 w-5 text-neutral-300" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-600 transition-colors">
                {vendor.store_name}
              </h3>
              {vendor.is_featured && (
                <Star className="h-3.5 w-3.5 text-amber-400 fill-current flex-shrink-0" />
              )}
            </div>
            
            {vendor.store_description && (
              <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {vendor.store_description}
              </p>
            )}

            <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400">
              {vendor.rating && Number(vendor.rating) > 0 && (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-neutral-600">{Number(vendor.rating).toFixed(1)}</span>
                  <Star className="h-3 w-3 text-amber-400 fill-current" />
                </span>
              )}
              <span>{vendor.total_products} products</span>
              {(vendor.city || vendor.state) && (
                <span className="truncate">
                  {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
