'use client';

/**
 * Vendor Store Settings Page
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Store,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
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
    } catch (error: any) {
      console.error('Failed to fetch vendor profile:', error);
      // If 403, user has vendor role but no vendor_profile - redirect to setup
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await apiRequest(VENDOR_ENDPOINTS.PROFILE, {
        method: 'PATCH',
        data: formData,
      });
      toast.success('Store settings updated successfully');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/vendor/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Store className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
              <p className="text-gray-500">Manage your store information</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {profile && (
          <div className="mb-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                profile.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : profile.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : profile.status === 'suspended'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Store Status: {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Store Information */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-500" />
                Store Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="store_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Store Name *
                  </label>
                  <input
                    type="text"
                    id="store_name"
                    name="store_name"
                    value={formData.store_name}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="Your store name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="store_description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Store Description
                  </label>
                  <textarea
                    id="store_description"
                    name="store_description"
                    value={formData.store_description}
                    onChange={handleInputChange}
                    rows={4}
                    className="input-field"
                    placeholder="Tell customers about your store..."
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                Contact Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="business_email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Business Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="business_email"
                      name="business_email"
                      value={formData.business_email}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                      placeholder="business@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="business_phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Business Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      id="business_phone"
                      name="business_phone"
                      value={formData.business_phone}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div className="card p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                Business Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    State / Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label
                    htmlFor="postal_code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="10001"
                  />
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Store Statistics (Read Only) */}
            {profile && (
              <div className="card p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Store Statistics
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Total Products</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {profile.total_products}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Total Sales</p>
                    <p className="text-2xl font-bold text-green-900">
                      {profile.total_sales}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600">Rating</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {parseFloat(profile.rating).toFixed(1)} ⭐
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Featured</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {profile.is_featured ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end gap-4">
            <Link
              href="/vendor/dashboard"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
