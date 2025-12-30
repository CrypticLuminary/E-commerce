'use client';

/**
 * Profile Settings Page - Minimalist Design
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Save, Mail, Phone, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { AUTH_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/profile');
      return;
    }

    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [isAuthenticated, authLoading, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest(AUTH_ENDPOINTS.PROFILE, {
        method: 'PATCH',
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
        },
      });

      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getInitials = () => {
    const first = formData.first_name?.[0] || '';
    const last = formData.last_name?.[0] || '';
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 max-w-3xl animate-fade-in">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
          <div className="p-3 bg-neutral-100 rounded-xl">
            <UserCircle className="h-6 w-6 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Profile</h1>
            <p className="text-neutral-500">Manage your personal information</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '75ms' }}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="text-3xl font-semibold text-neutral-600">
                    {getInitials()}
                  </span>
                </div>

                {/* Basic Info */}
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {formData.first_name || formData.last_name
                      ? `${formData.first_name} ${formData.last_name}`.trim()
                      : 'Add your name'}
                  </h2>
                  <p className="text-neutral-500 mt-1">{user.email}</p>
                  <div className="mt-3">
                    <Badge variant="secondary" className="capitalize">
                      {user.role || 'Customer'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-neutral-400" />
                      First Name
                    </label>
                    <Input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-neutral-400" />
                      Last Name
                    </label>
                    <Input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <Separator />

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="bg-neutral-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-neutral-400">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-neutral-400" />
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+977 98XXXXXXXX"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '225ms' }}>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm">
                    Account Settings
                  </Button>
                </Link>
                <Link href="/dashboard/addresses">
                  <Button variant="outline" size="sm">
                    Manage Addresses
                  </Button>
                </Link>
                <Link href="/orders">
                  <Button variant="outline" size="sm">
                    View Orders
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
