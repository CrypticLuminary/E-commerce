'use client';

/**
 * Cart Context
 * Manages cart state for both authenticated and guest users
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { CART_ENDPOINTS, PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { Cart, CartItem, GuestCartItem, Product, CartResponse } from '@/lib/types';
import { 
  getGuestCart, 
  addToGuestCart, 
  updateGuestCartItem, 
  removeFromGuestCart, 
  clearGuestCart,
  getGuestCartCount 
} from '@/lib/utils';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  guestCart: GuestCartItem[];
  isLoading: boolean;
  cartCount: number;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cart based on authentication state
  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.get<Cart>(CART_ENDPOINTS.GET);
        setCart(response);
        setGuestCart([]);
      } else {
        const localCart = getGuestCart();
        // Fetch product details for guest cart items
        if (localCart.length > 0) {
          const productPromises = localCart.map(item =>
            api.get<Product>(PRODUCT_ENDPOINTS.DETAIL_BY_ID(item.product_id), { skipAuth: true })
              .catch(() => null)
          );
          const products = await Promise.all(productPromises);
          const cartWithProducts = localCart.map((item, index) => ({
            ...item,
            product: products[index] || undefined,
          }));
          setGuestCart(cartWithProducts);
        } else {
          setGuestCart([]);
        }
        setCart(null);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Refresh cart when authentication state changes
  useEffect(() => {
    if (!authLoading) {
      refreshCart();
    }
  }, [isAuthenticated, authLoading, refreshCart]);

  // Add to cart
  const addToCart = async (productId: number, quantity: number = 1) => {
    if (isAuthenticated) {
      const response = await api.post<CartResponse>(CART_ENDPOINTS.ADD, {
        product_id: productId,
        quantity,
      });
      setCart(response.cart);
    } else {
      addToGuestCart(productId, quantity);
      await refreshCart();
    }
  };

  // Update quantity
  const updateQuantity = async (itemId: number, quantity: number) => {
    if (isAuthenticated) {
      const response = await api.patch<CartResponse>(
        CART_ENDPOINTS.UPDATE(itemId),
        { quantity }
      );
      setCart(response.cart);
    } else {
      // For guest cart, itemId is actually productId
      updateGuestCartItem(itemId, quantity);
      await refreshCart();
    }
  };

  // Remove item
  const removeItem = async (itemId: number) => {
    if (isAuthenticated) {
      const response = await api.delete<CartResponse>(CART_ENDPOINTS.REMOVE(itemId));
      setCart(response.cart);
    } else {
      // For guest cart, itemId is actually productId
      removeFromGuestCart(itemId);
      await refreshCart();
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (isAuthenticated) {
      await api.delete(CART_ENDPOINTS.GET);
      setCart(null);
    } else {
      clearGuestCart();
      setGuestCart([]);
    }
  };

  // Calculate cart count
  const cartCount = isAuthenticated
    ? (cart?.total_items || 0)
    : getGuestCartCount();

  return (
    <CartContext.Provider
      value={{
        cart,
        guestCart,
        isLoading,
        cartCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
