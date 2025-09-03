import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

export interface Sale {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  received_amount: number;
  change_amount: number;
  created_at: string;
  user_id: string;
  items_count?: number;
  customers?: {
    name: string;
    phone: string;
    loyalty_points: number;
  };
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
  products?: {
    name: string;
    sku: string;
    barcode?: string;
  };
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const { showToast } = useToast();

  const fetchSales = async (filters?: {
    searchQuery?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentMethod?: string;
  }) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('sales')
        .select(`
          *,
          customers (
            name,
            phone,
            loyalty_points
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.searchQuery) {
        query = query.or(`customer_name.ilike.%${filters.searchQuery}%,customer_phone.ilike.%${filters.searchQuery}%,id.ilike.%${filters.searchQuery}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get item counts for each sale
      if (data && data.length > 0) {
        const saleIds = data.map(sale => sale.id);
        const { data: itemCounts, error: countError } = await supabase
          .from('sale_items')
          .select('sale_id')
          .in('sale_id', saleIds);

        if (!countError && itemCounts) {
          const countMap = itemCounts.reduce((acc: any, item) => {
            acc[item.sale_id] = (acc[item.sale_id] || 0) + 1;
            return acc;
          }, {});

          data.forEach(sale => {
            sale.items_count = countMap[sale.id] || 0;
          });
        }
      }

      setSales(data || []);
    } catch (error: any) {
      console.error('Error fetching sales:', error);
      showToast(error.message || 'Failed to load sales', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSaleDetails = async (saleId: string) => {
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          *,
          products (
            name,
            sku,
            barcode
          )
        `)
        .eq('sale_id', saleId)
        .order('id');

      if (error) throw error;

      setSaleItems(data || []);
    } catch (error: any) {
      console.error('Error fetching sale details:', error);
      showToast('Failed to load sale details', 'error');
    }
  };

  const getReceiptNumber = (saleId: string) => {
    return `SALE-${saleId.slice(0, 8).toUpperCase()}`;
  };

  return {
    sales,
    isLoading,
    selectedSale,
    saleItems,
    fetchSales,
    fetchSaleDetails,
    setSelectedSale,
    getReceiptNumber,
  };
}