'use client';

/**
 * Vendor Setup Page - Register as a vendor - Minimalist Design
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, ArrowLeft, Info, Mail, Phone, MapPin, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { VENDOR_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
  const [agreeToTerms, setAgreeToTerms] = useState(false);
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

    if (!agreeToTerms) {
      toast.error('Please agree to the seller agreement');
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

  const steps = [
    { step: 1, label: 'Fill out store information' },
    { step: 2, label: 'Submit for review' },
    { step: 3, label: 'Get approved & start selling' },
    { step: 4, label: 'Earn from your products' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 max-w-4xl animate-fade-in">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Header Card */}
            <Card className="animate-fade-in-up">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Become a Seller</h1>
                  <p className="text-neutral-500">Start your journey as a marketplace seller</p>
                </div>
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '50ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4 text-neutral-500" />
                  How it works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((item, index) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-neutral-600">
                      {item.step}
                    </div>
                    <span className="text-sm text-neutral-600 pt-0.5">{item.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Seller Terms */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="text-base">Seller Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Platform commission', value: '10% per sale' },
                  { label: 'Payment processing', value: '7-14 business days' },
                  { label: 'Responsibilities', value: 'Product quality & shipping' },
                ].map((term) => (
                  <div key={term.label} className="flex justify-between text-sm">
                    <span className="text-neutral-500">{term.label}</span>
                    <span className="text-neutral-900 font-medium">{term.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form */}
          <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-neutral-500" />
                Store Information
              </CardTitle>
              <CardDescription>Tell us about your store</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Store Name *
                  </label>
                  <Input
                    type="text"
                    name="store_name"
                    value={formData.store_name}
                    onChange={handleInputChange}
                    placeholder="Your store name"
                    required
                  />
                  <p className="text-xs text-neutral-400 mt-1.5">
                    This will be displayed to customers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Store Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell customers about your store, what you sell, and what makes you unique..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Contact Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        type="email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleInputChange}
                        placeholder={user.email}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        type="tel"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Business Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      type="text"
                      name="business_address"
                      value={formData.business_address}
                      onChange={handleInputChange}
                      placeholder="Your business address"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Separator />

                {/* Agreement Checkbox */}
                <div 
                  onClick={() => setAgreeToTerms(!agreeToTerms)}
                  className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    agreeToTerms ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-300'
                  }`}>
                    {agreeToTerms && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">I agree to the Seller Agreement</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      By checking this box, you agree to our platform terms, commission rates, and seller policies.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !agreeToTerms}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
