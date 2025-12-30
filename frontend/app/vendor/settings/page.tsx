'use client';

/**
 * Vendor Store Settings Page - Minimalist Design
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  Settings,
  Star,
  Package,
  TrendingUp,
  Award,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

interface VendorProfile {
  id: number;
  store_name: string;
  store_description: string;
  store_logo: string | null;
  store_banner: string | null;
  business_email: string;
  business_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  status: string;
  is_featured: boolean;
  total_products: number;
  total_sales: number;
  rating: string;
}

export default function VendorSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
    business_email: '',
    business_phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/vendor/settings');
      return;
    }

    if (!authLoading && user && user.role !== 'vendor') {
      router.push('/vendor/setup');
      return;
    }

    fetchProfile();
  }, [isAuthenticated, authLoading, user, router]);

  const fetchProfile = async () => {
    if (!isAuthenticated || user?.role !== 'vendor') return;

    try {
      const response = await apiRequest<VendorProfile>(VENDOR_ENDPOINTS.PROFILE);
      setProfile(response.data);
      setFormData({
        store_name: response.data.store_name || '',
        store_description: response.data.store_description || '',
        business_email: response.data.business_email || '',
        business_phone: response.data.business_phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        postal_code: response.data.postal_code || '',
        country: response.data.country || '',
      });
      if (response.data.store_logo) {
        setLogoPreview(response.data.store_logo);
      }
      if (response.data.store_banner) {
        setBannerPreview(response.data.store_banner);
      }
    } catch (error: any) {
      console.error('Failed to fetch vendor profile:', error);
      if (error?.response?.status === 403 || error?.status === 403) {
        router.push('/vendor/setup');
        return;
      }
      toast.error('Failed to load store settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      if (logoFile) {
        submitData.append('store_logo', logoFile);
      }
      if (bannerFile) {
        submitData.append('store_banner', bannerFile);
      }

      await apiRequest(VENDOR_ENDPOINTS.PROFILE, {
        method: 'PATCH',
        data: submitData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Store settings updated successfully');
      fetchProfile();
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      const errorMessage =
        error?.response?.data?.store_name?.[0] ||
        error?.response?.data?.detail ||
        'Failed to update store settings';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user || user.role !== 'vendor') {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'suspended':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <Link
            href="/vendor/dashboard"
            className="inline-flex items-center text-neutral-500 hover:text-neutral-900 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neutral-900 rounded-2xl">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">Store Settings</h1>
                <p className="text-neutral-500">Manage your store information</p>
              </div>
            </div>
            {profile && (
              <Badge className={cn("border", getStatusBadge(profile.status))}>
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {profile && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Products', value: profile.total_products, icon: Package, color: 'text-blue-600' },
              { label: 'Total Sales', value: profile.total_sales, icon: TrendingUp, color: 'text-emerald-600' },
              { label: 'Store Rating', value: `${parseFloat(profile.rating).toFixed(1)} ★`, icon: Star, color: 'text-amber-600' },
              { label: 'Featured', value: profile.is_featured ? 'Yes' : 'No', icon: Award, color: 'text-violet-600' },
            ].map((stat, index) => (
              <Card key={stat.label} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-100 rounded-xl">
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">{stat.label}</p>
                      <p className="text-xl font-semibold text-neutral-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Store Branding - Left Column */}
            <Card className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-neutral-500" />
                  Store Branding
                </CardTitle>
                <CardDescription>Upload your store logo and banner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">Store Logo</label>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="relative w-32 h-32 mx-auto cursor-pointer group"
                  >
                    {logoPreview ? (
                      <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-neutral-200">
                        <Image
                          src={logoPreview}
                          alt="Store logo"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-2xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center hover:border-neutral-400 transition-colors">
                        <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                        <span className="text-sm text-neutral-500">Upload logo</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>

                <Separator />

                {/* Banner Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">Store Banner</label>
                  <div 
                    onClick={() => bannerInputRef.current?.click()}
                    className="relative w-full h-32 cursor-pointer group"
                  >
                    {bannerPreview ? (
                      <div className="w-full h-full rounded-xl overflow-hidden border-2 border-neutral-200">
                        <Image
                          src={bannerPreview}
                          alt="Store banner"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center hover:border-neutral-400 transition-colors">
                        <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                        <span className="text-sm text-neutral-500">Upload banner</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                  <p className="text-xs text-neutral-400 text-center mt-2">1200×300 recommended</p>
                </div>
              </CardContent>
            </Card>

            {/* Store Information - Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <Card className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-neutral-500" />
                    Store Information
                  </CardTitle>
                  <CardDescription>Basic details about your store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="store_name" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Store Name *
                    </label>
                    <Input
                      type="text"
                      id="store_name"
                      name="store_name"
                      value={formData.store_name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your store name"
                    />
                  </div>

                  <div>
                    <label htmlFor="store_description" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Store Description
                    </label>
                    <textarea
                      id="store_description"
                      name="store_description"
                      value={formData.store_description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all resize-none"
                      placeholder="Tell customers about your store..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info Card */}
              <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-neutral-500" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>How customers can reach you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="business_email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Business Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        type="email"
                        id="business_email"
                        name="business_email"
                        value={formData.business_email}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="business@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="business_phone" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Business Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        type="tel"
                        id="business_phone"
                        name="business_phone"
                        value={formData.business_phone}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="+977 98XXXXXXXX"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Address Card */}
              <Card className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-neutral-500" />
                    Business Address
                  </CardTitle>
                  <CardDescription>Your store's physical location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Street Address
                    </label>
                    <Input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        City
                      </label>
                      <Input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        State / Province
                      </label>
                      <Input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="postal_code" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Postal Code
                      </label>
                      <Input
                        type="text"
                        id="postal_code"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                        placeholder="44600"
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Province
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <select
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="flex h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2 text-sm transition-all duration-200 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
                        >
                          <option value="">Select Province</option>
                          <option value="Koshi">Koshi</option>
                          <option value="Madhesh">Madhesh</option>
                          <option value="Bagmati">Bagmati</option>
                          <option value="Gandaki">Gandaki</option>
                          <option value="Lumbini">Lumbini</option>
                          <option value="Karnali">Karnali</option>
                          <option value="Sudurpashchim">Sudurpashchim</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-8 flex justify-end gap-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Link href="/vendor/dashboard">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
