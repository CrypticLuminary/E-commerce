'use client';

/**
 * Vendor Setup Page - Register as a vendor
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, ArrowLeft, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface VendorFormData {
  store_name: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  business_address: string;
  commission_rate: number;
}

export default function VendorSetupPage() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    store_name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    business_address: '',
    commission_rate: 10,
  });

  if (authLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user) {
    router.push('/login?redirect=/vendor/setup');
    return null;
  }

  // If already a vendor, redirect to vendor dashboard
  if (user.role === 'vendor') {
    router.push('/vendor/dashboard');
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.store_name.trim()) {
      toast.error('Store name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest(VENDOR_ENDPOINTS.REGISTER, {
        method: 'POST',
        data: {
          ...formData,
          contact_email: formData.contact_email || user.email,
        },
      });

      await refreshUser();
      toast.success('Vendor application submitted! Please wait for approval.');
      router.push('/vendor/pending');
    } catch (error: any) {
      console.error('Failed to register vendor:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit vendor application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-custom py-8 max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Store className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Become a Seller</h1>
            <p className="text-gray-500">Start selling on our marketplace</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Fill out your store information below</li>
                <li>Submit your application for review</li>
                <li>Once approved, you can start adding products</li>
                <li>Earn money when customers buy your products</li>
              </ol>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name *
            </label>
            <input
              type="text"
              name="store_name"
              value={formData.store_name}
              onChange={handleInputChange}
              placeholder="Your store name"
              required
              className="input-field"
            />
            <p className="text-sm text-gray-500 mt-1">
              This will be displayed to customers
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell customers about your store..."
              rows={4}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleInputChange}
                placeholder={user.email}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Address
            </label>
            <input
              type="text"
              name="business_address"
              value={formData.business_address}
              onChange={handleInputChange}
              placeholder="Your business address"
              className="input-field"
            />
          </div>

          {/* Terms */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Seller Agreement</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Platform commission: 10% per sale</li>
              <li>• Payment processing time: 7-14 business days</li>
              <li>• You're responsible for product quality and shipping</li>
              <li>• Account may be suspended for policy violations</li>
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="agree"
              required
              className="h-4 w-4 text-primary-600 rounded"
            />
            <label htmlFor="agree" className="text-sm text-gray-700">
              I agree to the Seller Agreement and Platform Terms
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
