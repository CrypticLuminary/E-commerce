'use client';

/**
 * Edit Product Page - Minimalist Design with Image Upload
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Upload, ImagePlus, Package, DollarSign, Boxes, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { Category, Product } from '@/lib/types';
import toast from 'react-hot-toast';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  compare_price: string;
  sku: string;
  stock: string;
  category_id: string;
  is_active: boolean;
}

interface ExistingImage {
  id: number;
  image: string;
  is_primary: boolean;
}

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    sku: '',
    stock: '0',
    category_id: '',
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/vendor/products/${productId}/edit`);
      return;
    }

    if (!authLoading && user && user.role !== 'vendor') {
      router.push('/vendor/setup');
      return;
    }

    if (isAuthenticated && user?.role === 'vendor') {
      fetchData();
    }
  }, [isAuthenticated, authLoading, user, router, productId]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      newImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [newImages]);

  const fetchData = async () => {
    try {
      // Fetch categories and product in parallel
      const [categoriesRes, productRes] = await Promise.all([
        apiRequest<Category[] | { results: Category[] }>(PRODUCT_ENDPOINTS.CATEGORIES),
        apiRequest<Product>(`${PRODUCT_ENDPOINTS.VENDOR_PRODUCTS}${productId}/`),
      ]);

      const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.results;
      setCategories(categories);

      const product = productRes.data;
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        compare_price: product.compare_price?.toString() || '',
        sku: product.sku || '',
        stock: product.stock?.toString() || '0',
        category_id: product.category?.id?.toString() || '',
        is_active: product.is_active ?? true,
      });

      // Set existing images
      const images: ExistingImage[] = [];
      if (product.primary_image) {
        images.push({
          id: product.primary_image.id,
          image: product.primary_image.image,
          is_primary: true,
        });
      }
      if (product.images) {
        product.images.forEach((img: any) => {
          if (!images.find(i => i.id === img.id)) {
            images.push({
              id: img.id,
              image: img.image,
              is_primary: img.is_primary || false,
            });
          }
        });
      }
      setExistingImages(images);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      if (error?.response?.status === 404) {
        toast.error('Product not found');
        router.push('/vendor/products');
      } else {
        toast.error('Failed to load product');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    const totalImages = existingImages.length - imagesToDelete.length + newImages.length;
    const remaining = 5 - totalImages;
    
    if (remaining <= 0) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const imagesToAdd = validFiles.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewImages(prev => [...prev, ...imagesToAdd]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => {
      const newImgs = [...prev];
      URL.revokeObjectURL(newImgs[index].preview);
      newImgs.splice(index, 1);
      return newImgs;
    });
  };

  const markImageForDeletion = (imageId: number) => {
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const restoreImage = (imageId: number) => {
    setImagesToDelete(prev => prev.filter(id => id !== imageId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:8000${imagePath}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update product data
      await apiRequest(`${PRODUCT_ENDPOINTS.VENDOR_PRODUCTS}${productId}/`, {
        method: 'PATCH',
        data: {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          compare_price: formData.compare_price || null,
          sku: formData.sku || null,
          stock: parseInt(formData.stock) || 0,
          category: formData.category_id || null,
          is_active: formData.is_active,
        },
      });

      // Delete marked images
      for (const imageId of imagesToDelete) {
        try {
          await apiRequest(`${PRODUCT_ENDPOINTS.VENDOR_PRODUCTS}images/${imageId}/`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error(`Failed to delete image ${imageId}:`, err);
        }
      }

      // Upload new images
      if (newImages.length > 0) {
        for (const img of newImages) {
          const formData = new FormData();
          formData.append('image', img.file);
          try {
            await apiRequest(`${PRODUCT_ENDPOINTS.VENDOR_PRODUCTS}${productId}/images/`, {
              method: 'POST',
              data: formData,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          } catch (err) {
            console.error('Failed to upload image:', err);
          }
        }
      }

      toast.success('Product updated successfully!');
      router.push('/vendor/products');
    } catch (error: any) {
      console.error('Failed to update product:', error);
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.message ||
                       (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : null) ||
                       'Failed to update product';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await apiRequest(`${PRODUCT_ENDPOINTS.VENDOR_PRODUCTS}${productId}/`, {
        method: 'PATCH',
        data: { is_active: !formData.is_active },
      });
      setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
      toast.success(`Product ${!formData.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user || user.role !== 'vendor') {
    return null;
  }

  const visibleExistingImages = existingImages.filter(img => !imagesToDelete.includes(img.id));
  const totalImageCount = visibleExistingImages.length + newImages.length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 max-w-4xl animate-fade-in">
        {/* Back Link */}
        <Link
          href="/vendor/products"
          className="inline-flex items-center text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-900 rounded-2xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Edit Product</h1>
              <p className="text-neutral-500">Update your product details</p>
            </div>
          </div>

          {/* Quick Status Toggle */}
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            className={cn(
              formData.is_active 
                ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50" 
                : "text-neutral-500 border-neutral-200 hover:bg-neutral-100"
            )}
          >
            {formData.is_active ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Active
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Inactive
              </>
            )}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '75ms' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <ImagePlus className="h-4 w-4 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Product Images</CardTitle>
                  <CardDescription>Manage product images (max 5)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-neutral-700 mb-2">Current Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {existingImages.map((img, index) => {
                      const isMarkedForDeletion = imagesToDelete.includes(img.id);
                      return (
                        <div 
                          key={img.id} 
                          className={cn(
                            "relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group",
                            isMarkedForDeletion && "opacity-50"
                          )}
                        >
                          <Image
                            src={getImageUrl(img.image)}
                            alt={`Product image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {img.is_primary && !isMarkedForDeletion && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="default" className="text-xs">Main</Badge>
                            </div>
                          )}
                          {isMarkedForDeletion ? (
                            <button
                              type="button"
                              onClick={() => restoreImage(img.id)}
                              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-medium"
                            >
                              Click to Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => markImageForDeletion(img.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Images */}
              {newImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-neutral-700 mb-2">New Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {newImages.map((img, index) => (
                      <div 
                        key={index} 
                        className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group"
                      >
                        <Image
                          src={img.preview}
                          alt={`New image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drop Zone */}
              {totalImageCount < 5 && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
                    isDragging 
                      ? "border-neutral-900 bg-neutral-100" 
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="font-medium text-neutral-900 text-sm">
                    Add more images ({5 - totalImageCount} remaining)
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Drag and drop or click to browse
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <Package className="h-4 w-4 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <CardDescription>Product name and description</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Product Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product..."
                  rows={4}
                  className="flex w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm transition-all duration-200 ease-out ring-offset-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:border-neutral-300 hover:border-neutral-300 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm transition-all duration-200 ease-out ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:border-neutral-300 hover:border-neutral-300"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '225ms' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pricing</CardTitle>
                  <CardDescription>Set your product price</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 text-sm">
                      Rs.
                    </span>
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Compare at Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 text-sm">
                      Rs.
                    </span>
                    <Input
                      type="number"
                      name="compare_price"
                      value={formData.compare_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-neutral-400">
                    Original price for showing discount
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <Boxes className="h-4 w-4 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Inventory</CardTitle>
                  <CardDescription>Stock and SKU information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    SKU
                  </label>
                  <Input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Stock keeping unit"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '375ms' }}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      formData.is_active ? 'bg-neutral-900' : 'bg-neutral-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        formData.is_active ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                  <div>
                    <p className="font-medium text-neutral-900">
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formData.is_active ? 'Product is visible to customers' : 'Product is hidden from customers'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="flex-1 sm:flex-none"
                  >
                    <Link href="/vendor/products">Cancel</Link>
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
