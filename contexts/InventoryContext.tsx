import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './ToastContext';
import { Product } from './ProductContext';

// Types
export interface StockBatch {
  id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  reference?: string;
  supplier?: string;
  total_items: number;
  total_quantity: number;
  total_value: number;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  user_id: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reference?: string;
  supplier?: string;
  notes?: string;
  batch_id?: string;
  created_at: string;
  product?: Product;
}

export interface InventoryAlert {
  id: string;
  product_id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'overstock';
  message: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
  created_at: string;
  product?: Product;
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  recentMovements: number;
  topMovingProducts: Product[];
  stockValueByCategory: Array<{
    category: string;
    value: number;
    quantity: number;
  }>;
}

export interface StockAdjustmentData {
  product_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference?: string;
  supplier?: string;
  notes?: string;
}

export interface BatchOperation {
  products: string[];
  operation: 'adjust' | 'transfer' | 'count';
  data: any;
}

interface InventoryFilters {
  category?: string;
  stockLevel?: 'all' | 'low' | 'out' | 'overstock' | 'optimal';
  sortBy?: 'name' | 'stock' | 'value' | 'movement';
  searchQuery?: string;
}

interface InventoryContextType {
  // State
  stockMovements: StockMovement[];
  stockBatches: StockBatch[];
  alerts: InventoryAlert[];
  stats: InventoryStats | null;
  isLoading: boolean;
  filters: InventoryFilters;
  
  // Filters and Search
  setFilters: (filters: InventoryFilters) => void;
  clearFilters: () => void;
  
  // Stock Operations
  recordStockMovement: (data: StockAdjustmentData) => Promise<boolean>;
  recordBatchStockMovement: (items: StockAdjustmentData[], batchInfo: { type: 'in' | 'out', reference?: string, supplier?: string, notes?: string }) => Promise<string | null>;
  batchStockAdjustment: (operations: BatchOperation) => Promise<boolean>;
  performStockCount: (productId: string, actualCount: number) => Promise<boolean>;
  
  // Alerts Management
  fetchAlerts: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<boolean>;
  clearAlert: (alertId: string) => Promise<boolean>;
  generateAlerts: () => Promise<void>;
  
  // Analytics
  fetchInventoryStats: () => Promise<void>;
  fetchStockMovements: (productId?: string, limit?: number) => Promise<void>;
  fetchStockBatches: (limit?: number) => Promise<void>;
  getProductMovementHistory: (productId: string) => Promise<StockMovement[]>;
  
  // Reports
  generateInventoryReport: (type: 'summary' | 'detailed' | 'movements') => Promise<any>;
  exportInventoryData: (format: 'csv' | 'pdf') => Promise<string>;
  
  // Utilities
  calculateReorderPoint: (productId: string) => number;
  predictStockout: (productId: string) => Date | null;
  getOptimalStockLevel: (productId: string) => number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  
  // State
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockBatches, setStockBatches] = useState<StockBatch[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({
    stockLevel: 'all',
    sortBy: 'name'
  });

  // Record stock movement
  const recordStockMovement = async (data: StockAdjustmentData): Promise<boolean> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Record the movement - the database trigger will handle stock update
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: data.product_id,
          type: data.type,
          quantity: data.quantity,
          reference: data.reference,
          supplier: data.supplier,
          notes: data.notes,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      if (movementError) {
        throw movementError;
      }

      // Get updated product stock after trigger has run
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_level')
        .eq('id', data.product_id)
        .single();

      if (productError) throw productError;

      const newStock = product?.stock_quantity || 0;
      const minStock = product?.min_stock_level || 10;

      // Check for stock alerts
      if (newStock === 0) {
        await createAlert(data.product_id, 'out_of_stock', 'Product is now out of stock', 'high');
      } else if (newStock < minStock) {
        await createAlert(data.product_id, 'low_stock', 
          `Stock level (${newStock}) is below minimum (${minStock})`, 
          'medium');
      }

      showToast('Stock updated successfully', 'success');
      
      // Refresh data
      await fetchStockMovements();
      await fetchInventoryStats();
      
      return true;
    } catch (error: any) {
      console.error('Error recording stock movement:', error);
      showToast('Failed to record stock movement', 'error');
      return false;
    }
  };

  // Record batch stock movement (similar to sales)
  const recordBatchStockMovement = async (
    items: StockAdjustmentData[], 
    batchInfo: { type: 'in' | 'out', reference?: string, supplier?: string, notes?: string }
  ): Promise<string | null> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create batch record (like sales record)
      const { data: batch, error: batchError } = await supabase
        .from('stock_batches')
        .insert({
          type: batchInfo.type,
          reference: batchInfo.reference,
          supplier: batchInfo.supplier,
          notes: batchInfo.notes,
          total_items: items.length,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          user_id: user.id,
          status: 'completed'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Record each stock movement linked to the batch
      for (const item of items) {
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: item.product_id,
            type: batchInfo.type,
            quantity: item.quantity,
            reference: batchInfo.reference,
            supplier: batchInfo.supplier,
            notes: item.notes,
            batch_id: batch.id,  // Link to batch
            user_id: user.id,
            created_at: new Date().toISOString()
          });

        if (movementError) {
          throw movementError;
        }

        // Get updated product stock after trigger has run
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity, min_stock_level')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newStock = product.stock_quantity || 0;
          const minStock = product.min_stock_level || 10;

          // Check for stock alerts
          if (newStock === 0) {
            await createAlert(item.product_id, 'out_of_stock', 'Product is now out of stock', 'high');
          } else if (newStock < minStock) {
            await createAlert(item.product_id, 'low_stock', 
              `Stock level (${newStock}) is below minimum (${minStock})`, 
              'medium');
          }
        }
      }

      showToast(`Stock ${batchInfo.type} completed successfully`, 'success');
      
      // Refresh data
      await fetchStockMovements();
      await fetchInventoryStats();
      
      return batch.id; // Return batch ID for reference
    } catch (error: any) {
      console.error('Error recording batch stock movement:', error);
      showToast('Failed to record batch stock movement', 'error');
      return null;
    }
  };

  // Batch stock adjustment
  const batchStockAdjustment = async (operation: BatchOperation): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      for (const productId of operation.products) {
        await recordStockMovement({
          product_id: productId,
          type: operation.data.type || 'adjustment',
          quantity: operation.data.quantity,
          notes: operation.data.notes
        });
      }

      showToast('Batch operation completed successfully', 'success');
      return true;
    } catch (error) {
      console.error('Error in batch operation:', error);
      showToast('Batch operation failed', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Perform stock count
  const performStockCount = async (productId: string, actualCount: number): Promise<boolean> => {
    try {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', productId)
        .single();

      if (!product) {
        showToast('Product not found', 'error');
        return false;
      }

      const difference = actualCount - (product.stock_quantity || 0);
      
      if (difference !== 0) {
        const success = await recordStockMovement({
          product_id: productId,
          type: 'adjustment',
          quantity: actualCount,
          notes: `Stock count adjustment: ${difference > 0 ? '+' : ''}${difference} units`
        });

        if (success) {
          showToast(`Stock count updated for ${product.name}`, 'success');
        }
        return success;
      }

      showToast('Stock count matches current quantity', 'info');
      return true;
    } catch (error) {
      console.error('Error performing stock count:', error);
      showToast('Failed to perform stock count', 'error');
      return false;
    }
  };

  // Create alert
  const createAlert = async (
    productId: string, 
    type: InventoryAlert['type'], 
    _message: string, 
    _severity: InventoryAlert['severity']
  ) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Check if alert already exists for this product and type
      const { data: existingAlert } = await supabase
        .from('stock_alerts')
        .select('id')
        .eq('product_id', productId)
        .eq('alert_type', type)
        .eq('user_id', user.id)
        .single();

      if (existingAlert) {
        // Update existing alert
        await supabase
          .from('stock_alerts')
          .update({
            last_triggered: new Date().toISOString(),
            is_active: true
          })
          .eq('id', existingAlert.id);
      } else {
        // Create new alert
        const { error } = await supabase
          .from('stock_alerts')
          .insert({
            product_id: productId,
            alert_type: type,
            threshold: type === 'low_stock' ? 10 : 0,
            is_active: true,
            user_id: user.id,
            last_triggered: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating alert:', error);
        }
      }
    } catch (error) {
      console.error('Error in createAlert:', error);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select(`
          *,
          product:product_id (
            id,
            name,
            sku,
            stock_quantity
          )
        `)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST205') {
        console.error('Alerts table may not exist');
        setAlerts([]);
      } else if (data) {
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('stock_alerts')
        .update({ acknowledged: true })
        .eq('id', alertId);

      if (error) throw error;

      await fetchAlerts();
      showToast('Alert acknowledged', 'success');
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  };

  // Clear alert
  const clearAlert = async (alertId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('stock_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      await fetchAlerts();
      return true;
    } catch (error) {
      console.error('Error clearing alert:', error);
      return false;
    }
  };

  // Generate alerts based on current inventory
  const generateAlerts = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('*');

      if (!products) return;

      for (const product of products) {
        const stock = product.stock_quantity || 0;
        const minStock = product.min_stock_level || 10;

        if (stock === 0) {
          await createAlert(product.id, 'out_of_stock', 
            `${product.name} is out of stock`, 'high');
        } else if (stock < minStock) {
          await createAlert(product.id, 'low_stock', 
            `${product.name} stock (${stock}) is below minimum (${minStock})`, 'medium');
        } else if (stock > minStock * 5) {
          await createAlert(product.id, 'overstock', 
            `${product.name} may be overstocked (${stock} units)`, 'low');
        }
      }

      await fetchAlerts();
      showToast('Alerts generated successfully', 'success');
    } catch (error) {
      console.error('Error generating alerts:', error);
      showToast('Failed to generate alerts', 'error');
    }
  };

  // Fetch inventory statistics
  const fetchInventoryStats = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            name
          )
        `);

      if (!products) {
        setStats(null);
        return;
      }

      // Calculate statistics
      const totalProducts = products.length;
      const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0);
      const lowStockItems = products.filter(p => 
        (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < (p.min_stock_level || 10)
      ).length;
      const outOfStockItems = products.filter(p => (p.stock_quantity || 0) === 0).length;
      const overstockItems = products.filter(p => 
        (p.stock_quantity || 0) > (p.min_stock_level || 10) * 5
      ).length;

      // Get recent movements count
      const { count: movementsCount } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate top moving products (products with most movements)
      const { data: movements } = await supabase
        .from('stock_movements')
        .select('product_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const movementCounts: Record<string, number> = {};
      movements?.forEach(m => {
        movementCounts[m.product_id] = (movementCounts[m.product_id] || 0) + 1;
      });

      const topMovingIds = Object.entries(movementCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      const topMovingProducts = products.filter(p => topMovingIds.includes(p.id));

      // Calculate stock value by category
      const categoryValues: Record<string, { value: number; quantity: number }> = {};
      products.forEach(p => {
        const category = p.categories?.name || 'Uncategorized';
        if (!categoryValues[category]) {
          categoryValues[category] = { value: 0, quantity: 0 };
        }
        categoryValues[category].value += p.price * (p.stock_quantity || 0);
        categoryValues[category].quantity += p.stock_quantity || 0;
      });

      const stockValueByCategory = Object.entries(categoryValues).map(([category, data]) => ({
        category,
        value: data.value,
        quantity: data.quantity
      }));

      setStats({
        totalProducts,
        totalValue,
        lowStockItems,
        outOfStockItems,
        overstockItems,
        recentMovements: movementsCount || 0,
        topMovingProducts,
        stockValueByCategory
      });
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      setStats(null);
    }
  };

  // Fetch stock batches
  const fetchStockBatches = async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('stock_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error && error.code !== 'PGRST205') {
        console.error('Stock batches table may not exist');
        setStockBatches([]);
      } else if (data) {
        setStockBatches(data);
      }
    } catch (error) {
      console.error('Error fetching stock batches:', error);
      setStockBatches([]);
    }
  };

  // Fetch stock movements
  const fetchStockMovements = async (productId?: string, limit = 50) => {
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product:product_id (
            id,
            name,
            sku,
            price,
            cost_price,
            barcode
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error && error.code !== 'PGRST205') {
        console.error('Stock movements table may not exist');
        setStockMovements([]);
      } else if (data) {
        setStockMovements(data);
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      setStockMovements([]);
    }
  };

  // Get product movement history
  const getProductMovementHistory = async (productId: string): Promise<StockMovement[]> => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching product movement history:', error);
      return [];
    }
  };

  // Generate inventory report
  const generateInventoryReport = async (type: 'summary' | 'detailed' | 'movements'): Promise<any> => {
    try {
      await fetchInventoryStats();
      
      const report = {
        type,
        generatedAt: new Date().toISOString(),
        stats,
        data: null as any
      };

      if (type === 'summary') {
        report.data = {
          overview: stats,
          alerts: alerts.filter(a => !a.acknowledged)
        };
      } else if (type === 'detailed') {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        report.data = {
          products,
          totalValue: products?.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0) || 0
        };
      } else if (type === 'movements') {
        report.data = {
          movements: stockMovements,
          period: '30 days'
        };
      }

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      showToast('Failed to generate report', 'error');
      return null;
    }
  };

  // Export inventory data
  const exportInventoryData = async (format: 'csv' | 'pdf'): Promise<string> => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (format === 'csv') {
        // Generate CSV
        const headers = ['Name', 'SKU', 'Stock', 'Price', 'Value'];
        const rows = products?.map(p => [
          p.name,
          p.sku,
          p.stock_quantity || 0,
          p.price,
          p.price * (p.stock_quantity || 0)
        ]) || [];

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        
        // In a real app, you'd save this to a file or download it
        showToast('CSV generated successfully', 'success');
        return csv;
      } else {
        // PDF generation would require a library like react-native-pdf
        showToast('PDF export not yet implemented', 'info');
        return '';
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Failed to export data', 'error');
      return '';
    }
  };

  // Calculate reorder point
  const calculateReorderPoint = (productId: string): number => {
    // Simple calculation: min_stock_level * 1.5
    // In a real app, this would consider lead time, demand variability, etc.
    const product = stockMovements.find(m => m.product_id === productId)?.product;
    const minStock = product?.min_stock_level || 10;
    return Math.ceil(minStock * 1.5);
  };

  // Predict stockout date
  const predictStockout = (productId: string): Date | null => {
    // Simple linear prediction based on recent movements
    const recentMovements = stockMovements
      .filter(m => m.product_id === productId && m.type === 'out')
      .slice(0, 30);

    if (recentMovements.length === 0) return null;

    const dailyUsage = recentMovements.reduce((sum, m) => sum + m.quantity, 0) / 30;
    const product = recentMovements[0]?.product;
    const currentStock = product?.stock_quantity || 0;

    if (dailyUsage === 0) return null;

    const daysUntilStockout = currentStock / dailyUsage;
    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);

    return stockoutDate;
  };

  // Get optimal stock level
  const getOptimalStockLevel = (productId: string): number => {
    // Simple calculation based on movement history
    const movements = stockMovements.filter(m => m.product_id === productId);
    const avgMonthlyUsage = movements
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + m.quantity, 0) / 3; // 3 months average

    // Optimal stock = 2 months of average usage
    return Math.ceil(avgMonthlyUsage * 2);
  };

  // Load initial data
  useEffect(() => {
    fetchInventoryStats();
    fetchAlerts();
    fetchStockMovements();
  }, []);

  const value: InventoryContextType = {
    // State
    stockMovements,
    stockBatches,
    alerts,
    stats,
    isLoading,
    filters,
    
    // Filters
    setFilters,
    clearFilters: () => setFilters({ stockLevel: 'all', sortBy: 'name' }),
    
    // Stock Operations
    recordStockMovement,
    recordBatchStockMovement,
    batchStockAdjustment,
    performStockCount,
    
    // Alerts
    fetchAlerts,
    acknowledgeAlert,
    clearAlert,
    generateAlerts,
    
    // Analytics
    fetchInventoryStats,
    fetchStockMovements,
    fetchStockBatches,
    getProductMovementHistory,
    
    // Reports
    generateInventoryReport,
    exportInventoryData,
    
    // Utilities
    calculateReorderPoint,
    predictStockout,
    getOptimalStockLevel,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

// Custom hook for using inventory context
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};