'use client';

/**
 * Vendor Pending Approval Page - Minimalist Design
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ArrowLeft, Mail, CheckCircle2, Bell, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function VendorPendingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user) {
    router.push('/login');
    return null;
  }

  if (user.role === 'vendor') {
    router.push('/vendor/dashboard');
    return null;
  }

  const steps = [
    { icon: CheckCircle2, label: 'Application submitted', status: 'complete' },
    { icon: Clock, label: 'Under review', status: 'current' },
    { icon: Bell, label: 'Email notification', status: 'pending' },
    { icon: Package, label: 'Start selling', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card>
          <CardContent className="pt-8 pb-8 px-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>

            {/* Title */}
            <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                Application Under Review
              </h1>
              <p className="text-neutral-500">
                Thank you for applying! Our team is reviewing your application. This usually takes 1-2 business days.
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {steps.map((step, index) => (
                <div 
                  key={step.label}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    step.status === 'complete' 
                      ? 'bg-emerald-50' 
                      : step.status === 'current'
                      ? 'bg-amber-50'
                      : 'bg-neutral-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    step.status === 'complete'
                      ? 'bg-emerald-100'
                      : step.status === 'current'
                      ? 'bg-amber-100'
                      : 'bg-neutral-100'
                  }`}>
                    <step.icon className={`h-4 w-4 ${
                      step.status === 'complete'
                        ? 'text-emerald-600'
                        : step.status === 'current'
                        ? 'text-amber-600'
                        : 'text-neutral-400'
                    }`} />
                  </div>
                  <span className={`text-sm font-medium ${
                    step.status === 'complete'
                      ? 'text-emerald-700'
                      : step.status === 'current'
                      ? 'text-amber-700'
                      : 'text-neutral-400'
                  }`}>
                    {step.label}
                  </span>
                  {step.status === 'current' && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Email Notification */}
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 mb-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <Mail className="h-4 w-4" />
              <span>We'll notify you at: <span className="font-medium text-neutral-700">{user.email}</span></span>
            </div>

            {/* Back Button */}
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-neutral-400 mt-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          Questions? Contact us at support@example.com
        </p>
      </div>
    </div>
  );
}
