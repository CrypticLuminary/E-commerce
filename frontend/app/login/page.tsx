'use client';

/**
 * Login Page - Minimalist Design
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push(redirect);
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
              <span className="text-white font-bold text-base">AG</span>
            </div>
            <span className="text-2xl font-semibold text-neutral-800 tracking-tight">EcOM</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-neutral-200/50 border border-neutral-100 p-8 hover:shadow-2xl transition-shadow duration-500">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-neutral-900">Welcome back</h1>
            <p className="mt-1 text-sm text-neutral-500">Sign in to continue shopping</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-neutral-200 bg-neutral-50/50 focus:bg-white transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 rounded-xl border-neutral-200 bg-neutral-50/50 focus:bg-white transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl mt-2 bg-neutral-900 hover:bg-neutral-800 shadow-lg shadow-neutral-900/20 hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-sm">
            <span className="text-neutral-500">Don&apos;t have an account?</span>{' '}
            <Link href="/register" className="text-neutral-900 font-medium hover:underline">
              Create account
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-neutral-600">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-neutral-600">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}