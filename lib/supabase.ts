import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (will be generated from Supabase later)
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level?: number;
  category_id?: string;
  supplier_id?: string;
  image_url?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyalty_points?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  customer_id?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount?: number;
  payment_method: 'cash' | 'card' | 'mobile';
  status: 'completed' | 'pending' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total: number;
  created_at?: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_number?: string;
  supplier_id?: string;
  notes?: string;
  user_id?: string;
  created_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}