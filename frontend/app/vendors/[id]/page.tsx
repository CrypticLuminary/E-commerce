'use client';

/**
 * Vendor Detail Page - Minimalist Design
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Store, Star, Package, MapPin, Mail, Phone, ArrowLeft, Globe } from 'lucide-react';
import { VENDOR_ENDPOINTS, PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { Vendor, Product, PaginatedResponse } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const vendorResponse = await fetch(VENDOR_ENDPOINTS.DETAIL(Number(vendorId)));
        
        if (!vendorResponse.ok) {
          if (vendorResponse.status === 404) {
            setError('Vendor not found');
          } else {
            setError('Failed to load vendor');
          }
          return;
        }

        const vendorData = await vendorResponse.json();
        setVendor(vendorData);

        const productsResponse = await fetch(
          `${PRODUCT_ENDPOINTS.LIST}?vendor=${vendorId}`
        );
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(Array.isArray(productsData) ? productsData : (productsData.results || []));
        }
      } catch (err) {
        console.error('Error fetching vendor data:', err);
        setError('An error occurred while loading the vendor');
      } finally {
        setIsLoading(false);
      }
    };

    if (vendorId) {
      fetchVendorData();
    }
  }, [vendorId]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !vendor) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">
            {error || 'Vendor not found'}
          </h2>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/vendors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to vendors
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Banner Section */}
      <div className="relative h-48 md:h-56 bg-gradient-to-br from-neutral-800 to-neutral-900">
        {vendor.store_banner && (
          <Image
            src={vendor.store_banner}
            alt={`${vendor.store_name} banner`}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <Link href="/vendors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Vendors
            </Link>
          </Button>
        </div>
      </div>

      <div className="container-custom">
        {/* Vendor Header */}
        <div className="relative -mt-12 mb-8">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="-mt-16 md:-mt-20">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden">
                  {vendor.store_logo ? (
                    <Image
                      src={vendor.store_logo}
                      alt={vendor.store_name}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
                      <Store className="h-10 w-10 text-neutral-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-semibold text-neutral-900">
                        {vendor.store_name}
                      </h1>
                      {vendor.is_featured && (
                        <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                      {vendor.rating && Number(vendor.rating) > 0 && (
                        <span className="flex items-center">
                          <Star className="h-4 w-4 text-amber-400 fill-current mr-1" />
                          {Number(vendor.rating).toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        {vendor.total_products} products
                      </span>
                      {(vendor.city || vendor.state) && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {[vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-2">
                    {vendor.business_email && (
                      <Button asChild variant="outline" size="sm">
                        <a href={`mailto:${vendor.business_email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </a>
                      </Button>
                    )}
                    {vendor.business_phone && (
                      <Button asChild variant="outline" size="sm">
                        <a href={`tel:${vendor.business_phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {vendor.store_description && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-neutral-600 leading-relaxed">
                      {vendor.store_description}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Products Section */}
        <div className="pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Products
            </h2>
            <span className="text-sm text-neutral-500">
              {products.length} item{products.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {products.length === 0 ? (
            <Card className="text-center py-16">
              <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <Package className="h-7 w-7 text-neutral-400" />
              </div>
              <p className="text-neutral-500">
                This vendor hasn&apos;t listed any products yet.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
