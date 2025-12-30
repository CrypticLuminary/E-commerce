// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login/`,
  REGISTER: `${API_BASE_URL}/auth/register/`,
  LOGOUT: `${API_BASE_URL}/auth/logout/`,
  REFRESH: `${API_BASE_URL}/auth/refresh/`,
  PROFILE: `${API_BASE_URL}/auth/profile/`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password/`,
  ADDRESSES: `${API_BASE_URL}/auth/addresses/`,
};

// Product endpoints
export const PRODUCT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/products/`,
  FEATURED: `${API_BASE_URL}/products/featured/`,
  SEARCH: `${API_BASE_URL}/products/search/`,
  DETAIL: (slug: string) => `${API_BASE_URL}/products/detail/${slug}/`,
  DETAIL_BY_ID: (id: number) => `${API_BASE_URL}/products/${id}/`,
  CATEGORIES: `${API_BASE_URL}/products/categories/`,
  CATEGORY_DETAIL: (slug: string) => `${API_BASE_URL}/products/categories/${slug}/`,
  VENDOR_PRODUCTS: `${API_BASE_URL}/products/vendor/`,
};

// Wishlist endpoints
export const WISHLIST_ENDPOINTS = {
  LIST: `${API_BASE_URL}/products/wishlist/`,
  DELETE: (id: number) => `${API_BASE_URL}/products/wishlist/${id}/`,
  TOGGLE: (productId: number) => `${API_BASE_URL}/products/wishlist/toggle/${productId}/`,
  CHECK: (productId: number) => `${API_BASE_URL}/products/wishlist/check/${productId}/`,
};

// Cart endpoints
export const CART_ENDPOINTS = {
  GET: `${API_BASE_URL}/cart/`,
  ADD: `${API_BASE_URL}/cart/add/`,
  UPDATE: (itemId: number) => `${API_BASE_URL}/cart/update/${itemId}/`,
  REMOVE: (itemId: number) => `${API_BASE_URL}/cart/remove/${itemId}/`,
  MERGE: `${API_BASE_URL}/cart/merge/`,
  COUNT: `${API_BASE_URL}/cart/count/`,
};

// Order endpoints
export const ORDER_ENDPOINTS = {
  CHECKOUT: `${API_BASE_URL}/orders/checkout/`,
  GUEST_CHECKOUT: `${API_BASE_URL}/orders/guest-checkout/`,
  LIST: `${API_BASE_URL}/orders/`,
  DETAIL: (orderNumber: string) => `${API_BASE_URL}/orders/${orderNumber}/`,
  GUEST_DETAIL: (orderNumber: string) => `${API_BASE_URL}/orders/guest/${orderNumber}/`,
  CANCEL: (orderNumber: string) => `${API_BASE_URL}/orders/${orderNumber}/cancel/`,
  VENDOR_LIST: `${API_BASE_URL}/orders/vendor/list/`,
  VENDOR_DETAIL: (orderNumber: string) => `${API_BASE_URL}/orders/vendor/${orderNumber}/`,
};

// Vendor endpoints
export const VENDOR_ENDPOINTS = {
  LIST: `${API_BASE_URL}/vendors/`,
  DETAIL: (id: number) => `${API_BASE_URL}/vendors/${id}/`,
  REGISTER: `${API_BASE_URL}/vendors/register/`,
  PROFILE: `${API_BASE_URL}/vendors/profile/`,
  DASHBOARD: `${API_BASE_URL}/vendors/dashboard/`,
  MY_PRODUCTS: `${API_BASE_URL}/products/vendor/`,
  MY_ORDERS: `${API_BASE_URL}/orders/vendor/items/`,
  UPDATE_ORDER_ITEM_STATUS: (itemId: number) => `${API_BASE_URL}/orders/vendor/item/${itemId}/status/`,
};
