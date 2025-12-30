'use client';

/**
 * Vendor Pending Approval Page
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoading } from '@/components/ui/LoadingSpinner';

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

  // If approved, redirect to vendor dashboard
  if (user.role === 'vendor') {
    router.push('/vendor/dashboard');
    return null;
  }

  return (
    <div className="container-custom py-16 max-w-lg text-center">
      <div className="card p-8">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Application Under Review
        </h1>

        <p className="text-gray-600 mb-6">
          Thank you for applying to become a seller! Our team is reviewing your
          application. This usually takes 1-2 business days.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-600 text-left space-y-2">
            <li className="flex gap-2">
              <span className="text-primary-600">•</span>
              We'll review your store information
            </li>
            <li className="flex gap-2">
              <span className="text-primary-600">•</span>
              You'll receive an email notification
            </li>
            <li className="flex gap-2">
              <span className="text-primary-600">•</span>
              Once approved, you can start adding products
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
          <Mail className="h-4 w-4" />
          <span>We'll notify you at: {user.email}</span>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
