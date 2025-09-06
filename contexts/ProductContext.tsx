import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './ToastContext';

// Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level?: number;
  category?: string;
  category_id?: string;
  description?: string;
  brand?: string;
  supplier?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  categories?: {
    id: string;
    name: string;
  };
}

export interface Category {
  id?: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface StockHistory {
  id: string;
  product_id: string;
  type: "in" | "out" | "adjust";
  quantity: number;
  note?: string;
  created_at: string;
}

export interface ProductFormData {
  id?: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: string;
  costPrice?: string;
  stock: string;
  minStock?: string;
  category?: string;
  categoryId?: string;
  imageUrl?: string;
}

interface ProductContextType {
  // State
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  isRefreshing: boolean;
  selectedProduct: Product | null;
  stockHistory: StockHistory[];
  totalProductCount: number;
  
  // Search and Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  filteredProducts: Product[];
  
  // Actions
  fetchProducts: (refresh?: boolean) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
  fetchStockHistory: (productId: string) => Promise<StockHistory[]>;
  updateProduct: (id: string, data: ProductFormData, imageFile?: string) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  adjustStock: (productId: string, type: "in" | "out" | "adjust", quantity: number, note?: string) => Promise<boolean>;
  addProductToState: (product: Product) => void;
  updateProductInState: (productId: string, updates: Partial<Product>) => void;
  
  // UI State
  viewMode: "list" | "grid";
  setViewMode: (mode: "list" | "grid") => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  {name: "All"},
  {name: "Smartphones", icon: "phone-portrait-outline", color: "#3B82F6"},
  {name: "Laptops", icon: "laptop-outline", color: "#10B981"},
  {name: "Tablets", icon: "tablet-portrait-outline", color: "#F59E0B"},
  {name: "Accessories", icon: "headset-outline", color: "#8B5CF6"},
  {name: "Wearables", icon: "watch-outline", color: "#EF4444"}
];

// Sample products for fallback
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    sku: "IPH-15PM-256",
    price: 1199.99,
    stock_quantity: 45,
    category: "Smartphones",
  },
  {
    id: "2",
    name: "MacBook Air M2",
    sku: "MB-AIR-M2-512",
    price: 1499.99,
    stock_quantity: 8,
    category: "Laptops",
  },
  {
    id: "3",
    name: "iPad Pro 12.9",
    sku: "735745809198",
    price: 1099.99,
    stock_quantity: 0,
    category: "Tablets",
  },
  {
    id: "4",
    name: "AirPods Pro 2",
    sku: "APP-PRO-2",
    price: 249.99,
    stock_quantity: 120,
    category: "Accessories",
  },
  {
    id: "5",
    name: "Apple Watch Series 9",
    sku: "AW-S9-45MM",
    price: 429.99,
    stock_quantity: 35,
    category: "Wearables",
  },
];

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [totalProductCount, setTotalProductCount] = useState<number>(0);
  
  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest First");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Load initial data
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Fetch all products
  const fetchProducts = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      // Fetch the exact count of all active (non-deleted) products
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      
      // Store the total count
      setTotalProductCount(count || 0);
      
      // Fetch all products in a single query (works after running increase-max-rows.sql)
      // The limit is now 2000 which covers all our products
      // Only fetch products that haven't been deleted (deleted_at is null)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .is('deleted_at', null)  // Filter out soft-deleted products
        .order('created_at', { ascending: false })
        .limit(2000); // Explicitly set limit to 2000
      
      if (error) {
        if (error.code === 'PGRST205') {
          console.log('Products table not found. Using sample data.');
          showToast('Database setup needed. Using sample data.', 'info');
          setProducts(SAMPLE_PRODUCTS);
          setTotalProductCount(SAMPLE_PRODUCTS.length);
        } else {
          throw error;
        }
      } else if (data && data.length > 0) {
        setProducts(data);
        console.log(`Loaded ${data.length} products`);
      } else {
        setProducts(SAMPLE_PRODUCTS);
        setTotalProductCount(SAMPLE_PRODUCTS.length);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      showToast('Using offline mode', 'warning');
      setProducts(SAMPLE_PRODUCTS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, color')
        .order('name');
      
      if (error) {
        if (error.code === 'PGRST205') {
          console.log('Categories table not found. Using default categories.');
          setCategories(DEFAULT_CATEGORIES);
        } else {
          throw error;
        }
      } else if (data && data.length > 0) {
        const mappedCategories = data.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || "folder-outline",
          color: cat.color || "#3B82F6"
        }));
        setCategories([{name: "All"}, ...mappedCategories]);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  // Fetch single product by ID (including archived products for viewing history)
  const fetchProductById = async (id: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // If product is deleted, show a warning
      if (data?.deleted_at) {
        showToast("This product has been archived", "info");
      }
      
      return data;
    } catch (error: any) {
      console.error('Error fetching product:', error);
      showToast("Failed to load product details", "error");
      return null;
    }
  };

  // Fetch stock history
  const fetchStockHistory = async (productId: string): Promise<StockHistory[]> => {
    try {
      const { data, error } = await supabase
        .from('stock_history')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error && error.code !== 'PGRST205') {
        console.error('Error fetching stock history:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching stock history:', error);
      return [];
    }
  };

  // Update product
  const updateProduct = async (id: string, formData: ProductFormData, imageFile?: string): Promise<boolean> => {
    try {
      // Upload image if provided
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        // Implementation for image upload would go here
        // For now, we'll use the existing URL
      }

      // Find category ID if only name is provided
      let categoryId = formData.categoryId;
      if (formData.category && !categoryId) {
        const category = categories.find(c => c.name === formData.category);
        categoryId = category?.id;
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode || null,
          description: formData.description || null,
          price: parseFloat(formData.price),
          cost_price: formData.costPrice ? parseFloat(formData.costPrice) : null,
          stock_quantity: parseInt(formData.stock) || 0,
          min_stock_level: formData.minStock ? parseInt(formData.minStock) : 0,
          category_id: categoryId || null,
          image_url: imageUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      showToast("Product updated successfully", "success");
      await fetchProducts(); // Refresh products list
      return true;
    } catch (error: any) {
      console.error('Error updating product:', error);
      showToast(error.message || "Failed to update product", "error");
      return false;
    }
  };

  // Delete product (soft delete - keeps history)
  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      // Soft delete: set deleted_at timestamp instead of removing record
      const { error } = await supabase
        .from('products')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove product from local state (it's soft deleted in DB)
      setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
      setTotalProductCount(prev => Math.max(0, prev - 1));
      
      showToast("Product archived successfully", "success");
      return true;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showToast("Failed to delete product", "error");
      return false;
    }
  };

  // Add new product to state (for optimistic updates)
  const addProductToState = (product: Product) => {
    console.log('Adding product to state:', product);
    // Add the new product at the beginning since we sort by created_at desc
    setProducts(prevProducts => {
      const newProducts = [product, ...prevProducts];
      console.log('Updated products list length:', newProducts.length);
      return newProducts;
    });
    // Update total count
    setTotalProductCount(prev => prev + 1);
  };

  // Update product in state (for optimistic updates)
  const updateProductInState = (productId: string, updates: Partial<Product>) => {
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === productId ? { ...p, ...updates } : p
      )
    );
  };

  // Adjust stock
  const adjustStock = async (
    productId: string, 
    type: "in" | "out" | "adjust", 
    quantity: number, 
    note?: string
  ): Promise<boolean> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast("User not authenticated", "error");
        return false;
      }

      // Get current product
      const product = products.find(p => p.id === productId);
      if (!product) {
        showToast("Product not found", "error");
        return false;
      }

      let movementType: "in" | "out" | "adjustment" = type === "adjust" ? "adjustment" : type;

      // Record stock movement - the database trigger will handle the stock update
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          type: movementType,
          quantity: quantity,
          notes: note || null,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      if (movementError) throw movementError;

      showToast("Stock adjusted successfully", "success");
      await fetchProducts(); // Refresh products
      return true;
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      showToast("Failed to adjust stock", "error");
      return false;
    }
  };

  // Filter and sort products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || 
                          product.categories?.name === selectedCategory ||
                          product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case "Name":
        return a.name.localeCompare(b.name);
      case "Price: Low to High":
        return a.price - b.price;
      case "Price: High to Low":
        return b.price - a.price;
      case "Stock":
        return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      case "Newest First":
      default:
        // Keep the original order (newest first) from the products array
        // Products are already sorted by created_at desc from the database
        return 0;
    }
  });

  const value: ProductContextType = {
    // State
    products,
    categories,
    isLoading,
    isRefreshing,
    selectedProduct,
    stockHistory,
    totalProductCount,
    
    // Search and Filter
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    filteredProducts,
    
    // Actions
    fetchProducts,
    fetchCategories,
    fetchProductById,
    fetchStockHistory,
    updateProduct,
    deleteProduct,
    adjustStock,
    addProductToState,
    updateProductInState,
    
    // UI State
    viewMode,
    setViewMode,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

// Custom hook for using the product context
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};