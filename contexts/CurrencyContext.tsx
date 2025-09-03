import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from './ToastContext';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after';
}

// Popular currencies
export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before' },
  { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
  { code: 'GBP', symbol: '£', name: 'British Pound', position: 'before' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', position: 'before' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', position: 'before' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', position: 'before' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', position: 'before' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', position: 'before' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', position: 'before' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', position: 'before' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', position: 'before' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', position: 'before' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', position: 'before' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', position: 'before' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', position: 'before' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', position: 'before' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', position: 'before' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', position: 'after' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', position: 'before' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', position: 'before' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', position: 'before' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', position: 'before' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', position: 'before' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', position: 'before' },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  formatAmount: (amount: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]); // Default USD
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Load currency preference on mount
  useEffect(() => {
    loadCurrencyPreference();
  }, []);

  const loadCurrencyPreference = async () => {
    try {
      // First check local storage for offline support
      const cachedCurrency = await AsyncStorage.getItem('currency_preference');
      if (cachedCurrency) {
        const parsed = JSON.parse(cachedCurrency);
        const foundCurrency = CURRENCIES.find(c => c.code === parsed.code);
        if (foundCurrency) {
          setCurrencyState(foundCurrency);
        }
      }

      // Then fetch from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('currency, currency_symbol')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          const foundCurrency = CURRENCIES.find(c => c.code === data.currency) || CURRENCIES[0];
          setCurrencyState(foundCurrency);
          // Cache it locally
          await AsyncStorage.setItem('currency_preference', JSON.stringify(foundCurrency));
        } else if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              currency: 'USD',
              currency_symbol: '$'
            });
        }
      }
    } catch (error) {
      console.error('Error loading currency preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrency = async (newCurrency: Currency) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Please login to save currency preference', 'error');
        return;
      }

      // Update in database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          currency: newCurrency.code,
          currency_symbol: newCurrency.symbol,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setCurrencyState(newCurrency);
      
      // Cache locally
      await AsyncStorage.setItem('currency_preference', JSON.stringify(newCurrency));
      
      showToast(`Currency changed to ${newCurrency.name}`, 'success');
    } catch (error: any) {
      console.error('Error updating currency:', error);
      showToast('Failed to update currency', 'error');
    }
  };

  const formatAmount = (amount: number): string => {
    // Check if the amount has decimals
    const hasDecimals = amount % 1 !== 0;
    
    // Format number with commas for thousands
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    });
    
    if (currency.position === 'before') {
      return `${currency.symbol}${formatted}`;
    } else {
      return `${formatted}${currency.symbol}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatAmount, 
      isLoading 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}