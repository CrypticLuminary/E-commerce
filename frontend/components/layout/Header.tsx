'use client';

/**
 * Header Component - Minimalist Design
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  User, 
  Search, 
  Menu, 
  X, 
  LogOut,
  Package,
  Store,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
              <span className="text-white font-bold text-sm">AG</span>
            </div>
            <span className="text-lg font-semibold text-neutral-900 hidden sm:block">EcOM</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/products" 
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Products
            </Link>
            <Link 
              href="/vendors" 
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Vendors
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:block relative">
              <form onSubmit={handleSearch}>
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9 h-9 bg-neutral-100 border-0 focus-visible:ring-1"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              </form>
            </div>

            {/* Mobile Search Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[10px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount > 99 ? '99' : cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {mounted && isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-neutral-600" />
                  </div>
                  <span className="hidden sm:inline text-sm">{user?.first_name || 'Account'}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                </Button>

                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 animate-slide-down">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-sm font-medium text-neutral-900">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-neutral-500">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 mr-3 text-neutral-400" />
                          Dashboard
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Package className="h-4 w-4 mr-3 text-neutral-400" />
                          Orders
                        </Link>
                        {user?.role === 'vendor' && (
                          <Link
                            href="/vendor/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Store className="h-4 w-4 mr-3 text-neutral-400" />
                            Vendor Dashboard
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-neutral-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : mounted ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            ) : null}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden pb-4 animate-slide-down">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-neutral-100 border-0"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-neutral-100 animate-slide-down">
            <nav className="flex flex-col pt-4 space-y-1">
              <Link 
                href="/products" 
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                href="/vendors" 
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Vendors
              </Link>
              <Link 
                href="/cart" 
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors flex items-center justify-between"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="bg-neutral-900 text-white text-xs px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              {mounted && isAuthenticated ? (
                <>
                  <div className="border-t border-neutral-100 my-2" />
                  <Link 
                    href="/dashboard" 
                    className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/orders" 
                    className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  {user?.role === 'vendor' && (
                    <Link 
                      href="/vendor/dashboard" 
                      className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Vendor Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 text-sm font-medium text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                  >
                    Sign out
                  </button>
                </>
              ) : mounted ? (
                <>
                  <div className="border-t border-neutral-100 my-2" />
                  <div className="px-4 pt-2 flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </div>
                </>
              ) : null}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
