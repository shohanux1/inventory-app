import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
  total_purchases: number;
  total_spent: number;
  loyalty_points: number;
  loyalty_enabled: boolean;
  email_updates: boolean;
  sms_notifications: boolean;
  status: 'active' | 'inactive';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  sale_id: string | null;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  description: string | null;
  created_at: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  loyalty_enabled: boolean;
  email_updates: boolean;
  sms_notifications: boolean;
}

interface CustomerContextType {
  customers: Customer[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: 'all' | 'active' | 'inactive';
  setFilterStatus: (status: 'all' | 'active' | 'inactive') => void;
  filteredCustomers: Customer[];
  totalCustomers: number;
  totalLoyaltyPoints: number;
  activeCustomers: number;
  
  // CRUD operations
  fetchCustomers: () => Promise<void>;
  createCustomer: (data: CustomerFormData) => Promise<Customer | null>;
  updateCustomer: (id: string, data: Partial<CustomerFormData>) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  getCustomerById: (id: string) => Promise<Customer | null>;
  getCustomerByPhone: (phone: string) => Promise<Customer | null>;
  
  // Loyalty operations
  getLoyaltyHistory: (customerId: string) => Promise<LoyaltyTransaction[]>;
  adjustLoyaltyPoints: (customerId: string, points: number, description: string) => Promise<boolean>;
  redeemPoints: (customerId: string, points: number, description: string) => Promise<boolean>;
  
  // Utility functions
  calculatePointsValue: (points: number) => number;
  getPointsToEarn: (saleTotal: number, costTotal: number) => number;
  addLoyaltyPointsFromSale: (customerId: string, saleId: string, points: number) => Promise<boolean>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      showToast('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new customer
  const createCustomer = async (data: CustomerFormData): Promise<Customer | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('User not authenticated', 'error');
        return null;
      }

      // Check if customer with same phone already exists
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', data.phone)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        showToast('Customer with this phone number already exists', 'warning');
        return null;
      }

      const { data: customer, error } = await supabase
        .from('customers')
        .insert({
          ...data,
          user_id: user.id,
          total_purchases: 0,
          total_spent: 0,
          loyalty_points: 0,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setCustomers([customer, ...customers]);
      showToast('Customer added successfully', 'success');
      return customer;
    } catch (error: any) {
      console.error('Error creating customer:', error);
      showToast('Failed to add customer', 'error');
      return null;
    }
  };

  // Update customer
  const updateCustomer = async (id: string, data: Partial<CustomerFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setCustomers(customers.map(c => 
        c.id === id ? { ...c, ...data } : c
      ));
      
      showToast('Customer updated successfully', 'success');
      return true;
    } catch (error: any) {
      console.error('Error updating customer:', error);
      showToast('Failed to update customer', 'error');
      return false;
    }
  };

  // Delete customer
  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomers(customers.filter(c => c.id !== id));
      showToast('Customer deleted successfully', 'success');
      return true;
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      showToast('Failed to delete customer', 'error');
      return false;
    }
  };

  // Get customer by ID
  const getCustomerById = async (id: string): Promise<Customer | null> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching customer:', error);
      return null;
    }
  };

  // Get customer by phone
  const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching customer by phone:', error);
      return null;
    }
  };

  // Get loyalty history
  const getLoyaltyHistory = async (customerId: string): Promise<LoyaltyTransaction[]> => {
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching loyalty history:', error);
      return [];
    }
  };

  // Adjust loyalty points
  const adjustLoyaltyPoints = async (
    customerId: string, 
    points: number, 
    description: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Update customer points
      const { data: customer } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();

      if (!customer) return false;

      const newPoints = Math.max(0, customer.loyalty_points + points);

      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          loyalty_points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: customerId,
          type: 'adjusted',
          points: points,
          description: description,
          user_id: user.id
        });

      if (transactionError) throw transactionError;

      await fetchCustomers();
      showToast('Loyalty points adjusted successfully', 'success');
      return true;
    } catch (error: any) {
      console.error('Error adjusting loyalty points:', error);
      showToast('Failed to adjust loyalty points', 'error');
      return false;
    }
  };

  // Redeem points
  const redeemPoints = async (
    customerId: string, 
    points: number, 
    description: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if customer has enough points
      const { data: customer } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();

      if (!customer || customer.loyalty_points < points) {
        showToast('Insufficient loyalty points', 'warning');
        return false;
      }

      // Update customer points
      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          loyalty_points: customer.loyalty_points - points,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: customerId,
          type: 'redeemed',
          points: -points,
          description: description,
          user_id: user.id
        });

      if (transactionError) throw transactionError;

      await fetchCustomers();
      showToast('Points redeemed successfully', 'success');
      return true;
    } catch (error: any) {
      console.error('Error redeeming points:', error);
      showToast('Failed to redeem points', 'error');
      return false;
    }
  };

  // Calculate points value (1 point = $0.01)
  const calculatePointsValue = (points: number): number => {
    return points * 0.01;
  };

  // Calculate points to earn (5% of profit)
  const getPointsToEarn = (saleTotal: number, costTotal: number): number => {
    const profit = Math.max(0, saleTotal - costTotal);
    return Math.floor(profit * 0.05);
  };
  
  // Add loyalty points after a sale
  const addLoyaltyPointsFromSale = async (
    customerId: string,
    saleId: string,
    points: number
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get current customer data
      const { data: customer } = await supabase
        .from('customers')
        .select('loyalty_points, total_purchases, total_spent')
        .eq('id', customerId)
        .single();
      
      if (!customer) return false;
      
      // Update customer points
      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          loyalty_points: customer.loyalty_points + points,
          total_purchases: customer.total_purchases + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: customerId,
          sale_id: saleId,
          type: 'earned',
          points: points,
          description: 'Points earned from sale (5% of profit)',
          user_id: user.id
        });

      if (transactionError) throw transactionError;

      await fetchCustomers();
      return true;
    } catch (error: any) {
      console.error('Error adding loyalty points from sale:', error);
      return false;
    }
  };

  // Filtered customers based on search and filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Statistics
  const totalCustomers = customers.length;
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + c.loyalty_points, 0);
  const activeCustomers = customers.filter(c => c.status === 'active').length;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const value = {
    customers,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filteredCustomers,
    totalCustomers,
    totalLoyaltyPoints,
    activeCustomers,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomerByPhone,
    getLoyaltyHistory,
    adjustLoyaltyPoints,
    redeemPoints,
    calculatePointsValue,
    getPointsToEarn,
    addLoyaltyPointsFromSale,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};