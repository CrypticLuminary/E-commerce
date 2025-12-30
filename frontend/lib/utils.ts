/**
 * Cart Utility Functions
 * Handles guest cart in localStorage
 */

import { GuestCartItem, Product } from './types';

const GUEST_CART_KEY = 'ag_ecom_guest_cart';

// Get guest cart from localStorage
export const getGuestCart = (): GuestCartItem[] => {
  if (typeof window === 'undefined') return [];
  const cart = localStorage.getItem(GUEST_CART_KEY);
  return cart ? JSON.parse(cart) : [];
};

// Save guest cart to localStorage
export const saveGuestCart = (cart: GuestCartItem[]): void => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

// Add item to guest cart
export const addToGuestCart = (productId: number, quantity: number = 1): GuestCartItem[] => {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex(item => item.product_id === productId);
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ product_id: productId, quantity });
  }
  
  saveGuestCart(cart);
  return cart;
};

// Update item quantity in guest cart
export const updateGuestCartItem = (productId: number, quantity: number): GuestCartItem[] => {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex(item => item.product_id === productId);
  
  if (existingIndex > -1) {
    if (quantity <= 0) {
      cart.splice(existingIndex, 1);
    } else {
      cart[existingIndex].quantity = quantity;
    }
  }
  
  saveGuestCart(cart);
  return cart;
};

// Remove item from guest cart
export const removeFromGuestCart = (productId: number): GuestCartItem[] => {
  const cart = getGuestCart().filter(item => item.product_id !== productId);
  saveGuestCart(cart);
  return cart;
};

// Clear guest cart
export const clearGuestCart = (): void => {
  localStorage.removeItem(GUEST_CART_KEY);
};

// Get guest cart item count
export const getGuestCartCount = (): number => {
  const cart = getGuestCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
};

// Calculate guest cart subtotal (needs products with prices)
export const calculateGuestCartSubtotal = (cartWithProducts: GuestCartItem[]): number => {
  return cartWithProducts.reduce((total, item) => {
    if (item.product) {
      return total + (parseFloat(item.product.price) * item.quantity);
    }
    return total;
  }, 0);
};

// Format price
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numPrice);
};

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Get order status badge color
export const getOrderStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
