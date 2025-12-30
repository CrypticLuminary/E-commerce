'use client';

/**
 * Register Page - Minimalist Design
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ShoppingBag, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') as 'customer' | 'vendor' || 'customer';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: defaultRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      toast.success('Registration successful! Welcome to AG-EcOM.');
      
      if (formData.role === 'vendor') {
        router.push('/vendor/setup');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
              <span className="text-white font-bold text-base">AG</span>
            </div>
            <span className="text-2xl font-semibold text-neutral-800 tracking-tight">EcOM</span>
          </Link>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">Create account</CardTitle>
            <CardDescription className="text-center">
              Join AG-EcOM to start shopping or selling
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">I want to</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'customer' })}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      formData.role === 'customer'
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    )}
                  >
                    <ShoppingBag className={cn(
                      "h-5 w-5 mx-auto mb-2",
                      formData.role === 'customer' ? "text-white" : "text-neutral-500"
                    )} />
                    <span className="font-medium text-sm">Shop</span>
                    <p className={cn(
                      "text-xs mt-1",
                      formData.role === 'customer' ? "text-neutral-300" : "text-neutral-500"
                    )}>Buy products</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'vendor' })}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      formData.role === 'vendor'
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    )}
                  >
                    <Store className={cn(
                      "h-5 w-5 mx-auto mb-2",
                      formData.role === 'vendor' ? "text-white" : "text-neutral-500"
                    )} />
                    <span className="font-medium text-sm">Sell</span>
                    <p className={cn(
                      "text-xs mt-1",
                      formData.role === 'vendor' ? "text-neutral-300" : "text-neutral-500"
                    )}>As a vendor</p>
                  </button>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="text-sm font-medium text-neutral-700">
                    First name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      autoComplete="given-name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="pl-10 h-11"
                      placeholder="John"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="last_name" className="text-sm font-medium text-neutral-700">
                    Last name
                  </label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="h-11"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-11"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-neutral-700">
                  Phone <span className="text-neutral-400">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 h-11"
                    placeholder="+977 98XXXXXXXX"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-11"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">At least 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="password2" className="text-sm font-medium text-neutral-700">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    id="password2"
                    name="password2"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password2}
                    onChange={handleChange}
                    className="pl-10 h-11"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-neutral-500">Already have an account?</span>{' '}
              <Link href="/login" className="text-neutral-900 font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-neutral-500">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-neutral-700">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-neutral-700">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
