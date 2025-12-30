'use client';

/**
 * Account Settings Page - Minimalist Design
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { AUTH_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Notification preferences (local state for UI demo)
  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_promotions: false,
    email_newsletter: true,
  });

  if (authLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !user) {
    router.push('/login?redirect=/dashboard/settings');
    return null;
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest(`${AUTH_ENDPOINTS.PROFILE}change-password/`, {
        method: 'POST',
        data: {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        },
      });
      toast.success('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      'This will permanently delete all your data including orders, addresses, and wishlist. Continue?'
    );
    if (!doubleConfirmed) return;

    try {
      await apiRequest(`${AUTH_ENDPOINTS.PROFILE}delete/`, {
        method: 'DELETE',
      });
      toast.success('Account deleted successfully');
      await logout();
      router.push('/');
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete account');
    }
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
            <Settings className="h-6 w-6 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Account Settings</h1>
            <p className="text-neutral-500">Manage your account preferences and security</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Password Section */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '75ms' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <Lock className="h-4 w-4 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Password</CardTitle>
                  <CardDescription>Change your account password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <Button
                  variant="outline"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="current_password"
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        name="new_password"
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update Password'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          current_password: '',
                          new_password: '',
                          confirm_password: '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <Bell className="h-4 w-4 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Email Notifications</CardTitle>
                  <CardDescription>Manage what emails you receive</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-neutral-900">Order Updates</p>
                  <p className="text-sm text-neutral-500">
                    Receive emails about your order status
                  </p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      email_orders: !prev.email_orders,
                    }))
                  }
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    notifications.email_orders ? 'bg-neutral-900' : 'bg-neutral-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      notifications.email_orders ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-neutral-900">Promotions</p>
                  <p className="text-sm text-neutral-500">
                    Receive emails about deals and offers
                  </p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      email_promotions: !prev.email_promotions,
                    }))
                  }
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    notifications.email_promotions ? 'bg-neutral-900' : 'bg-neutral-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      notifications.email_promotions ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-neutral-900">Newsletter</p>
                  <p className="text-sm text-neutral-500">
                    Weekly updates and new arrivals
                  </p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      email_newsletter: !prev.email_newsletter,
                    }))
                  }
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    notifications.email_newsletter ? 'bg-neutral-900' : 'bg-neutral-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      notifications.email_newsletter ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Section */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '225ms' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <Shield className="h-4 w-4 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Privacy</CardTitle>
                  <CardDescription>Manage your data and privacy</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-neutral-900">Connected Email</p>
                  <p className="text-sm text-neutral-500">{user.email}</p>
                </div>
                <Mail className="h-5 w-5 text-neutral-400" />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-100 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Delete Account</p>
                  <p className="text-sm text-neutral-500">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
