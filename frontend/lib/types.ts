/**
 * TypeScript Type Definitions for AG-EcOM
 */

// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  role: 'customer' | 'vendor' | 'admin';
  is_active?: boolean;
  date_joined?: string;
}

export interface Address {
  id: number;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  street_address?: string;
  apartment?: string;
  label?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: 'shipping' | 'billing';
  is_default: boolean;
  full_address?: string;
}

// Vendor types
export interface Vendor {
  id: number;
  user?: number;
  user_email?: string;
  owner_name: string;
  store_name: string;
  store_description: string;
  store_logo?: string;
  store_banner?: string;
  business_email?: string;
  business_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  is_featured: boolean;
  total_products: number;
  total_sales: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  custom_icon?: string;
  display_icon?: string;
  parent?: number;
  order: number;
  is_active: boolean;
  subcategories?: Category[];
  product_count?: number;
  full_path?: string;
}

// Product types
export interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: string;
  compare_price?: string;
  discount_percentage?: number;
  stock: number;
  sku?: string;
  is_in_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  weight?: string;
  view_count?: number;
  sales_count?: number;
  category?: Category;
  vendor?: Vendor;
  vendor_name?: string;
  images?: ProductImage[];
  primary_image?: ProductImage;
  created_at: string;
  updated_at?: string;
}

// Cart types
export interface CartItem {
  id: number;
  product: Product;
  product_id?: number;
  quantity: number;
  subtotal: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_items: number;
  subtotal: string;
  total: string;
  created_at: string;
  updated_at: string;
}

// Guest cart item (localStorage)
export interface GuestCartItem {
  product_id: number;
  quantity: number;
  product?: Product;
}

// Order types
export interface OrderItem {
  id: number;
  product?: number;
  product_name: string;
  product_price: string;
  price?: string;
  product_sku?: string;
  vendor_name: string;
  quantity: number;
  subtotal: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  order_number: string;
  user?: number;
  guest_email?: string;
  customer_email: string;
  customer_name: string;
  status: OrderStatus;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_address: ShippingAddress | string;
  payment_method?: string;
  payment_status?: string;
  subtotal: string;
  shipping_cost: string;
  tax: string;
  total: string;
  customer_notes?: string;
  items: OrderItem[];
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  street_address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface CartResponse {
  message: string;
  cart_item?: CartItem;
  cart: Cart;
}

export interface OrderResponse {
  message: string;
  order: Order;
}

// Dashboard statistics
export interface VendorStatistics {
  vendor: Vendor;
  statistics: {
    products: {
      total: number;
      active: number;
      out_of_stock: number;
    };
    orders: {
      total: number;
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
    };
    revenue: {
      total: number;
    };
  };
}

export interface AdminStatistics {
  users: {
    total: number;
    customers: number;
    vendors: number;
  };
  vendors: {
    total: number;
    approved: number;
    pending: number;
  };
  products: {
    total: number;
    active: number;
  };
  orders: {
    total: number;
    by_status: Record<OrderStatus, number>;
  };
  revenue: {
    total: number;
  };
}
