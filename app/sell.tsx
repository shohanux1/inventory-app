import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BarcodeScanner from "../components/BarcodeScanner";
import { SearchBarWithScanner } from "../components/SearchBarWithScanner";
import { Colors } from "../constants/Colors";
import { useInventory } from "../contexts/InventoryContext";
import { Product, useProducts } from "../contexts/ProductContext";
import { useToast } from "../contexts/ToastContext";
import { useCustomers, Customer } from "../contexts/CustomerContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useColorScheme } from "../hooks/useColorScheme";
import { ReceiptSuccessModal } from "../components/ReceiptSuccessModal";

// Receipt data interface (previously from printer-expo)
export interface ReceiptData {
  saleId?: string;  // Added for Chrome extension to fetch full sale data
  storeName?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  cashier?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    sku?: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  customerPayment: number;
  change: number;
  changeAmount?: number;
  receivedAmount?: number;
  paymentMethod: string;
  date: string;
  time: string;
  receiptNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  loyaltyPoints?: number;
  loyaltyPointsFromChange?: number;
  changeToPoints?: number;
  qrCode?: string;
  footerMessage?: string;
  barcode?: string;
}

interface CartItem extends Product {
  quantity: number;
}

// Default walk-in customer
const WALK_IN_CUSTOMER: Customer = {
  id: 'walk-in',
  name: 'Walk-in Customer',
  phone: 'N/A',
  email: null,
  address: null,
  notes: null,
  total_purchases: 0,
  total_spent: 0,
  loyalty_points: 0,
  loyalty_enabled: false,
  email_updates: false,
  sms_notifications: false,
  status: 'active',
  user_id: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function Sell() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const { currency, formatAmount } = useCurrency();
  
  // Context hooks
  const { products, fetchProducts } = useProducts();
  const { recordBatchStockMovement } = useInventory();
  const { customers, fetchCustomers, getPointsToEarn, addLoyaltyPointsFromSale } = useCustomers();
  
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "card" | "mobile">("cash");
  const [showProductList, setShowProductList] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(WALK_IN_CUSTOMER);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceiptData, setLastReceiptData] = useState<ReceiptData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [convertChangeToPoints, setConvertChangeToPoints] = useState(false);
  const [changeAmount, setChangeAmount] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce timer ref
  const searchDebounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  // Debounce search query
  useEffect(() => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    searchDebounceTimer.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200); // 200ms debounce delay

    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Create search index for faster lookups
  const productSearchIndex = useMemo(() => {
    const index = new Map<string, Product[]>();
    
    products.forEach(product => {
      // Index by name tokens
      const nameTokens = product.name.toLowerCase().split(' ');
      nameTokens.forEach(token => {
        if (!index.has(token)) {
          index.set(token, []);
        }
        index.get(token)?.push(product);
      });
      
      // Index by SKU
      const skuLower = product.sku.toLowerCase();
      if (!index.has(skuLower)) {
        index.set(skuLower, []);
      }
      index.get(skuLower)?.push(product);
      
      // Index by barcode
      if (product.barcode) {
        if (!index.has(product.barcode)) {
          index.set(product.barcode, []);
        }
        index.get(product.barcode)?.push(product);
      }
    });
    
    return index;
  }, [products]);

  // Optimized product filtering with memoization
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length === 0) {
      return [];
    }

    const query = debouncedSearchQuery.toLowerCase();
    const searchTokens = query.split(' ').filter(t => t.length > 0);
    
    // For very short queries, use simple filtering
    if (query.length <= 2) {
      return products
        .filter(product => 
          product.name.toLowerCase().startsWith(query) ||
          product.sku.toLowerCase().startsWith(query)
        )
        .slice(0, 15); // Limit results
    }

    // Use Set to avoid duplicates
    const resultSet = new Set<Product>();
    
    // Quick exact matches first
    searchTokens.forEach(token => {
      const exactMatches = productSearchIndex.get(token) || [];
      exactMatches.forEach(p => resultSet.add(p));
    });

    // If we have enough exact matches, return early
    if (resultSet.size >= 10) {
      return Array.from(resultSet).slice(0, 15);
    }

    // Fallback to partial matching for remaining items
    const results = products.filter(product => {
      // Skip if already in results
      if (resultSet.has(product)) return false;
      
      const productName = product.name.toLowerCase();
      const productSku = product.sku.toLowerCase();
      
      // Check if all search tokens are found
      const allTokensMatch = searchTokens.every(token => 
        productName.includes(token) || 
        productSku.includes(token) ||
        (product.barcode && product.barcode.includes(token))
      );
      
      return allTokensMatch;
    });

    // Combine and limit results
    return [...Array.from(resultSet), ...results].slice(0, 15);
  }, [debouncedSearchQuery, products, productSearchIndex]);

  // Get all customers including walk-in
  const allCustomers = useMemo(() => [WALK_IN_CUSTOMER, ...customers], [customers]);
  
  // Filter customers based on search with memoization
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return allCustomers;
    
    const search = customerSearch.toLowerCase();
    return allCustomers.filter(customer =>
      customer.name.toLowerCase().includes(search) ||
      customer.phone.includes(search)
    );
  }, [allCustomers, customerSearch]);

  const addToCart = (product: Product) => {
    // Check stock availability
    const existingItem = cartItems.find(item => item.id === product.id);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    
    if (currentQuantityInCart >= (product.stock_quantity || 0)) {
      showToast(`Not enough stock. Only ${product.stock_quantity} available`, "warning");
      return;
    }
    
    if (existingItem) {
      // Increase quantity
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Add new item with quantity 1
      const cartItem: CartItem = { ...product, quantity: 1 };
      setCartItems([...cartItems, cartItem]);
    }
    
    showToast(`${product.name} added to cart`, "success");
    
    // Don't clear search immediately to allow continuous searching
    // Just hide the dropdown temporarily
    setShowProductList(false);
    
    // Clear search after a brief delay to show feedback
    setTimeout(() => {
      setSearchQuery("");
    }, 100);
  };

  const handleScan = (barcode: string) => {
    // Look up product by barcode or SKU
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    
    if (product) {
      addToCart(product);
      setShowScanner(false);
    } else {
      // Show the barcode in search field if not found
      setSearchQuery(barcode);
      setShowScanner(false);
      showToast("Product not found with this barcode", "warning");
    }
  };

  const handleSearchFocus = () => {
    setShowProductList(true);
  };

  const handleSearchBlur = () => {
    // Only hide if search is empty
    if (!searchQuery) {
      setTimeout(() => setShowProductList(false), 200);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item;
        
        // Check stock availability
        if (newQuantity > (item.stock_quantity || 0)) {
          showToast(`Only ${item.stock_quantity} available in stock`, "warning");
          return item;
        }
        
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return 0; // No tax for now
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };


  const calculateLoyaltyPoints = () => {
    // Calculate 5% of profit as loyalty points
    // Only for customers with loyalty enabled
    if (!selectedCustomer || !selectedCustomer.loyalty_enabled || selectedCustomer.id === 'walk-in') {
      return 0;
    }
    
    // Calculate total cost of items in cart
    const totalCost = cartItems.reduce((sum, item) => {
      // Use actual cost_price, or default to 80% of selling price (20% profit margin)
      const costPrice = item.cost_price || item.price * 0.8;
      console.log(`Item: ${item.name}, Price: $${item.price}, Cost: $${costPrice}, Qty: ${item.quantity}`);
      return sum + (costPrice * item.quantity);
    }, 0);
    
    // Use subtotal (before tax) for profit calculation
    const saleSubtotal = calculateSubtotal();
    const profit = saleSubtotal - totalCost;
    
    // 5% of profit as loyalty points (1 point = 1 cent)
    // profit * 0.05 gives dollars, multiply by 100 for cents
    const points = Math.max(0, Math.floor(profit * 0.05 * 100));
    
    console.log(`Subtotal: $${saleSubtotal}, Total Cost: $${totalCost}, Profit: $${profit}, Points: ${points}`);
    
    return points;
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showToast("Please add items to cart before checkout", "warning");
      return;
    }
    setShowPaymentModal(true);
    setReceivedAmount(calculateTotal().toFixed(2));
  };

  const calculateChange = () => {
    const received = parseFloat(receivedAmount) || 0;
    const total = calculateTotal();
    return Math.max(0, received - total);
  };

  const completeSale = async () => {
    const received = parseFloat(receivedAmount) || 0;
    const total = calculateTotal();
    
    if (received < total) {
      showToast("Received amount is less than total", "error");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate actual change and points if converting
      const actualChange = calculateChange();
      const pointsFromChange = convertChangeToPoints && selectedCustomer.id !== 'walk-in' 
        ? Math.floor(actualChange * 100) // 100 points = ৳1
        : 0;
      const cashChange = convertChangeToPoints && selectedCustomer.id !== 'walk-in'
        ? 0  // No cash change if converting to points
        : actualChange;
      
      // Create sale record
      const saleData: any = {
        customer_name: selectedCustomer.name,
        customer_phone: selectedCustomer.phone,
        customer_email: selectedCustomer.email,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        payment_method: selectedPaymentMethod,
        received_amount: received,
        change_amount: cashChange, // Cash change (0 if converted to points)
        change_to_points: pointsFromChange, // Points from change conversion
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      
      // Add customer_id if it's not a walk-in customer
      if (selectedCustomer.id !== 'walk-in') {
        saleData.customer_id = selectedCustomer.id;
      }
      
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (saleError) throw saleError;

      // Create stock batch for the sale (like stock out batch)
      const stockItems = cartItems.map(item => ({
        product_id: item.id,
        type: 'out' as const,
        quantity: item.quantity,
        notes: `Sold ${item.quantity} units at ${formatAmount(item.price)} each`
      }));

      const batchId = await recordBatchStockMovement(
        stockItems,
        {
          type: 'out',
          reference: `SALE-${sale.id}`,
          supplier: selectedCustomer.name,
          notes: `Sale to ${selectedCustomer.name} - ${cartItems.length} items`
        }
      );

      if (!batchId) {
        console.error('Failed to create stock batch for sale');
      }

      // Create sale item records
      for (const item of cartItems) {
        await supabase
          .from('sale_items')
          .insert({
            sale_id: sale.id,
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          });
      }

      // Add loyalty points if applicable
      const pointsEarned = calculateLoyaltyPoints();
      const totalPointsToAdd = pointsEarned + pointsFromChange; // Include change conversion points
      
      if (totalPointsToAdd > 0 && selectedCustomer.id !== 'walk-in') {
        await addLoyaltyPointsFromSale(selectedCustomer.id, sale.id, totalPointsToAdd);
      }
      
      // Refresh products and customers to get updated data
      await fetchProducts();
      await fetchCustomers();
      
      // Prepare receipt data
      const receiptData: ReceiptData = {
        saleId: sale.id,
        businessName: "My POS Store",
        businessAddress: "123 Main Street, City",
        businessPhone: "+1 234 567 8900",
        businessEmail: "store@mypos.com",
        receiptNumber: `RCP-${sale.id.substring(0, 8).toUpperCase()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        cashier: user.email?.split('@')[0] || 'Staff',
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerEmail: selectedCustomer.email || undefined,
        loyaltyPoints: totalPointsToAdd > 0 ? totalPointsToAdd : undefined,
        changeToPoints: pointsFromChange > 0 ? pointsFromChange : undefined,
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          sku: item.sku
        })),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        discount: 0, // No discount feature implemented yet
        total: calculateTotal(),
        customerPayment: received,
        change: cashChange,
        paymentMethod: selectedPaymentMethod.charAt(0).toUpperCase() + selectedPaymentMethod.slice(1),
        receivedAmount: received,
        changeAmount: cashChange,
        footerMessage: "30-day return policy with receipt",
        barcode: sale.id.substring(0, 12).toUpperCase()
      };
      
      // Store receipt data for reprinting
      setLastReceiptData(receiptData);
      
      // Hide payment modal and show success modal
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      
      // Reset cart and form
      setCartItems([]);
      setSearchQuery("");
      setReceivedAmount("");
      setSelectedCustomer(WALK_IN_CUSTOMER);
      setConvertChangeToPoints(false);
      
    } catch (error: any) {
      console.error('Error completing sale:', error);
      showToast(error.message || "Failed to complete sale", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Product</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.cartInfoButton}>
            <Ionicons name="receipt-outline" size={22} color={colors.text} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Section - Customer and Actions */}
        <View style={styles.topSection}>
          {/* Customer Selector with Dropdown */}
          <View style={styles.customerSelectorWrapper}>
            <TouchableOpacity 
              style={styles.customerCard}
              onPress={() => setShowCustomerList(!showCustomerList)}
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
              <View style={styles.customerInfo}>
                <Text style={styles.customerLabel}>Customer</Text>
                <Text style={styles.customerName} numberOfLines={1}>
                  {selectedCustomer.name}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Customer Dropdown */}
            {showCustomerList && (
              <View style={styles.customerDropdown}>
                <View style={styles.customerSearchContainer}>
                  <Ionicons name="search" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={styles.customerSearchInput}
                    placeholder="Search customer..."
                    placeholderTextColor={colors.textMuted}
                    value={customerSearch}
                    onChangeText={setCustomerSearch}
                  />
                </View>
                <ScrollView style={styles.customerList} nestedScrollEnabled={true}>
                  {filteredCustomers.map((customer) => (
                    <TouchableOpacity
                      key={customer.id}
                      style={styles.customerItem}
                      onPress={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerList(false);
                        setCustomerSearch("");
                      }}
                    >
                      <View style={styles.customerItemInfo}>
                        <Text style={styles.customerItemName}>{customer.name}</Text>
                        <View style={styles.customerItemDetails}>
                          <Text style={styles.customerItemPhone}>{customer.phone}</Text>
                          {customer.loyalty_enabled && customer.id !== 'walk-in' && (
                            <Text style={styles.customerItemPoints}>• {customer.loyalty_points} pts</Text>
                          )}
                        </View>
                      </View>
                      {selectedCustomer.id === customer.id && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <SearchBarWithScanner
              searchQuery={searchQuery}
              onSearchChange={(text) => {
                setSearchQuery(text);
                if (text.length > 0 && !showProductList) {
                  setShowProductList(true);
                }
              }}
              onSearchFocus={handleSearchFocus}
              onSearchBlur={handleSearchBlur}
              onScanPress={() => setShowScanner(true)}
              placeholder="Search or scan products..."
            />
            
            {/* Product Search Results Dropdown */}
            {showProductList && searchQuery.length > 0 && (
              <View style={styles.productDropdown}>
                <ScrollView 
                  style={styles.productDropdownScroll}
                  keyboardShouldPersistTaps="always"
                  nestedScrollEnabled={true}
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.productDropdownItem}
                        onPress={() => addToCart(product)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.productDropdownInfo}>
                          <Text style={styles.productDropdownName} numberOfLines={1}>
                            {product.name}
                          </Text>
                          <Text style={styles.productDropdownDetails}>
                            {product.categories?.name || 'Uncategorized'} • {formatAmount(product.price)} • Stock: {product.stock_quantity || 0}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.addProductButton}
                          onPress={() => addToCart(product)}
                        >
                          <Ionicons name="add" size={18} color="white" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noProductsFound}>
                      <Text style={styles.noProductsText}>No products found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Cart Items */}
        <View style={styles.cartSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cart Items</Text>
            <Text style={styles.itemCount}>{cartItems.length} items</Text>
          </View>

          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <Text style={styles.emptyCartSubtext}>Scan or search products to add</Text>
            </View>
          ) : (
            <View style={styles.cartItems}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </Text>
                    <Text style={styles.itemBarcode}>SKU: {item.sku}</Text>
                  </View>
                  
                  <View style={styles.quantityControl}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, -1)}
                    >
                      <Ionicons name="remove" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, 1)}
                    >
                      <Ionicons name="add" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.itemPriceSection}>
                    <Text style={styles.itemPrice}>{formatAmount(item.price * item.quantity)}</Text>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Summary */}
        {cartItems.length > 0 && (
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatAmount(calculateSubtotal())}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{formatAmount(calculateTax())}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatAmount(calculateTotal())}</Text>
            </View>
            {selectedCustomer.loyalty_enabled && selectedCustomer.id !== 'walk-in' && (
              <View style={styles.summaryLoyaltyRow}>
                <View style={styles.loyaltyInfo}>
                  <Ionicons name="star" size={16} color={colors.warning} />
                  <Text style={styles.loyaltyLabel}>Points Earned</Text>
                </View>
                <Text style={styles.loyaltyPoints}>+{calculateLoyaltyPoints()} pts</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      {cartItems.length > 0 && !showPaymentModal && (
        <View style={styles.checkoutContainer}>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>
              Checkout • {formatAmount(calculateTotal())}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        title="Scan Product"
        subtitle="Point camera at product barcode"
      />

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View style={styles.paymentModal}>
            <ScrollView 
              contentContainerStyle={styles.paymentModalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Customer Info */}
            <View style={styles.paymentCustomerInfo}>
              <Ionicons name="person-circle-outline" size={24} color={colors.textSecondary} />
              <View style={styles.paymentCustomerDetails}>
                <Text style={styles.paymentCustomerName}>{selectedCustomer.name}</Text>
                <Text style={styles.paymentCustomerPhone}>{selectedCustomer.phone}</Text>
              </View>
            </View>

            {/* Amount Summary */}
            <View style={styles.paymentSummary}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Subtotal</Text>
                <Text style={styles.paymentValue}>{formatAmount(calculateSubtotal())}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Tax (10%)</Text>
                <Text style={styles.paymentValue}>{formatAmount(calculateTax())}</Text>
              </View>
              <View style={[styles.paymentRow, styles.paymentTotalRow]}>
                <Text style={styles.paymentTotalLabel}>Total Amount</Text>
                <Text style={styles.paymentTotalValue}>{formatAmount(calculateTotal())}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Loyalty Points</Text>
                <Text style={styles.loyaltyValue}>+{calculateLoyaltyPoints()} pts</Text>
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.paymentMethodSection}>
              <Text style={styles.paymentSectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethodOptions}>
                {["cash", "card", "mobile"].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentMethodOption,
                      selectedPaymentMethod === method && styles.paymentMethodActive
                    ]}
                    onPress={() => setSelectedPaymentMethod(method as "cash" | "card" | "mobile")}
                  >
                    <Ionicons 
                      name={method === "cash" ? "cash-outline" : method === "card" ? "card-outline" : "phone-portrait-outline"} 
                      size={20} 
                      color={selectedPaymentMethod === method ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === method && styles.paymentMethodTextActive
                    ]}>{method.charAt(0).toUpperCase() + method.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Received Amount */}
            <View style={styles.receivedAmountSection}>
              <Text style={styles.paymentSectionTitle}>Received Amount</Text>
              <View style={styles.receivedAmountInput}>
                <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={receivedAmount}
                  onChangeText={setReceivedAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              
              {/* Quick Amount Buttons */}
              <View style={styles.quickAmounts}>
                {(() => {
                  const total = calculateTotal();
                  const amounts = [50, 100, 200, 500, 1000];
                  // Only add total if it's not already in the amounts array
                  const uniqueAmounts = amounts.includes(total) ? amounts : [total, ...amounts];
                  
                  return uniqueAmounts.map((amount, index) => (
                    <TouchableOpacity
                      key={`amount-${index}-${amount}`}
                      style={[
                        styles.quickAmountButton,
                        amount === total && styles.exactAmountButton
                      ]}
                      onPress={() => setReceivedAmount(amount.toFixed(2))}
                    >
                      <Text style={[
                        styles.quickAmountText,
                        amount === total && styles.exactAmountText
                      ]}>
                        {amount === total ? "Exact" : formatAmount(amount)}
                      </Text>
                    </TouchableOpacity>
                  ));
                })()}
              </View>
            </View>

            {/* Change Display */}
            {parseFloat(receivedAmount) > 0 && (
              <View style={styles.changeSection}>
                <View style={styles.changeDisplay}>
                  <Text style={styles.paymentChangeLabel}>Change to Return</Text>
                  <Text style={styles.paymentChangeAmount}>{formatAmount(calculateChange())}</Text>
                </View>
                
                {/* Convert Change to Points Option */}
                {calculateChange() > 0 && selectedCustomer.id !== 'walk-in' && (
                  <TouchableOpacity 
                    style={styles.changeToPointsOption}
                    onPress={() => setConvertChangeToPoints(!convertChangeToPoints)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.changeToPointsCheckbox}>
                      {convertChangeToPoints && (
                        <Ionicons name="checkmark" size={16} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.changeToPointsInfo}>
                      <Text style={styles.changeToPointsText}>
                        Convert change to loyalty points
                      </Text>
                      <Text style={styles.changeToPointsValue}>
                        {Math.floor(calculateChange() * 100)} points (৳1 = 100 points)
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            </ScrollView>
            
            {/* Action Buttons - Outside ScrollView */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.completeButton, isProcessing && { opacity: 0.6 }]}
                onPress={completeSale}
                disabled={isProcessing}
              >
                <Text style={styles.completeButtonText}>
                  {isProcessing ? "Processing..." : "Complete Sale"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success Modal with Print Options */}
      <ReceiptSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        receiptData={lastReceiptData}
        showNewSaleButton={true}
        onNewSale={() => setShowSuccessModal(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  printIconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${colors.primary}15`,
    borderRadius: 18,
  },
  cartInfoButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  topSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  customerSelectorWrapper: {
    position: "relative",
    marginBottom: 12,
    zIndex: 1001,
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  customerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  customerDropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  customerSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  customerSearchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: colors.text,
  },
  customerList: {
    maxHeight: 150,
  },
  customerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  customerItemInfo: {
    gap: 2,
  },
  customerItemName: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  customerItemPhone: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  customerItemDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  customerItemPoints: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: "500",
  },
  searchWrapper: {
    position: "relative",
    zIndex: 999,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  scanIconButton: {
    padding: 4,
  },
  productDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productDropdownScroll: {
    maxHeight: 250,
  },
  productDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  productDropdownInfo: {
    flex: 1,
    marginRight: 10,
  },
  productDropdownName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  productDropdownDetails: {
    fontSize: 11,
    color: colors.textMuted,
  },
  addProductButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  noProductsFound: {
    padding: 20,
    alignItems: "center",
  },
  noProductsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cartSection: {
    padding: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  itemCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyCart: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cartItems: {
    gap: 12,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  itemBarcode: {
    fontSize: 11,
    color: colors.textMuted,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 20,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    minWidth: 20,
    textAlign: "center",
  },
  itemPriceSection: {
    alignItems: "flex-end",
    gap: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  deleteButton: {
    padding: 0,
  },
  summarySection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  summaryLoyaltyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  loyaltyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loyaltyLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loyaltyPoints: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.warning,
  },
  checkoutContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  checkoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Payment Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  paymentModalScroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  paymentModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: Platform.OS === "android" ? "85%" : "90%",
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  paymentCustomerInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 12,
    backgroundColor: `${colors.primary}08`,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  paymentCustomerDetails: {
    flex: 1,
  },
  paymentCustomerName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  paymentCustomerPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentSummary: {
    padding: 20,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  loyaltyValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warning,
  },
  paymentTotalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: 0,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  paymentMethodSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  paymentMethodOptions: {
    flexDirection: "row",
    gap: 10,
  },
  paymentMethodOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  paymentMethodActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  paymentMethodTextActive: {
    color: colors.primary,
  },
  receivedAmountSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  receivedAmountInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
    color: colors.text,
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exactAmountButton: {
    backgroundColor: `${colors.primary}08`,
    borderColor: colors.primary,
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  exactAmountText: {
    color: colors.primary,
  },
  changeToPointsOption: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeToPointsCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  changeToPointsInfo: {
    flex: 1,
  },
  changeToPointsText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  changeToPointsValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  changeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  changeDisplay: {
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentChangeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentChangeAmount: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.success,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  completeButton: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});