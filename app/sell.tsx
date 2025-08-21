import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import BarcodeScanner from "../components/BarcodeScanner";

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  category: string;
  stock: number;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// Mock products data - in real app, this would come from your database
const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "iPhone 15 Pro", price: 999.99, barcode: "123456789", category: "Electronics", stock: 25 },
  { id: "2", name: "MacBook Air M2", price: 1299.99, barcode: "987654321", category: "Electronics", stock: 15 },
  { id: "3", name: "AirPods Pro", price: 249.99, barcode: "456789123", category: "Electronics", stock: 50 },
  { id: "4", name: "iPad Pro 11", price: 799.99, barcode: "789123456", category: "Electronics", stock: 20 },
  { id: "5", name: "Apple Watch Series 9", price: 399.99, barcode: "321654987", category: "Electronics", stock: 30 },
  { id: "6", name: "Samsung Galaxy S24", price: 899.99, barcode: "654321789", category: "Electronics", stock: 18 },
  { id: "7", name: "Sony WH-1000XM5", price: 379.99, barcode: "147258369", category: "Audio", stock: 22 },
  { id: "8", name: "Dell XPS 13", price: 1199.99, barcode: "369258147", category: "Electronics", stock: 10 },
  { id: "9", name: "Google Pixel 8 Pro", price: 999.99, barcode: "258147369", category: "Electronics", stock: 12 },
  { id: "10", name: "Nintendo Switch", price: 299.99, barcode: "963852741", category: "Gaming", stock: 35 },
];

// Mock customers data
const MOCK_CUSTOMERS: Customer[] = [
  { id: "1", name: "Walk-in Customer", phone: "N/A" },
  { id: "2", name: "John Doe", phone: "+1234567890", email: "john@example.com" },
  { id: "3", name: "Jane Smith", phone: "+0987654321", email: "jane@example.com" },
  { id: "4", name: "Robert Johnson", phone: "+1122334455" },
  { id: "5", name: "Maria Garcia", phone: "+5544332211", email: "maria@example.com" },
];

export default function Sell() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "card" | "mobile">("cash");
  const [showProductList, setShowProductList] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(MOCK_CUSTOMERS[0]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");

  // Filter products based on search query
  const filteredProducts = MOCK_PRODUCTS.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode.includes(searchQuery) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter customers based on search
  const filteredCustomers = MOCK_CUSTOMERS.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );

  const addToCart = (product: Product) => {
    // Check if item already in cart
    const existingItem = cartItems.find(item => item.id === product.id);
    
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
    
    // Don't clear search immediately to allow continuous searching
    // Just hide the dropdown temporarily
    setShowProductList(false);
    
    // Clear search after a brief delay to show feedback
    setTimeout(() => {
      setSearchQuery("");
    }, 100);
  };

  const handleScan = (barcode: string, type: string) => {
    // Look up product by barcode
    const product = MOCK_PRODUCTS.find(p => p.barcode === barcode);
    
    if (product) {
      addToCart(product);
      Alert.alert("Product Added", `${product.name} added to cart`);
    } else {
      Alert.alert("Product Not Found", `No product found with barcode: ${barcode}`);
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
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const calculateLoyaltyPoints = () => {
    // 1 point for every $10 spent
    return Math.floor(calculateTotal() / 10);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Please add items to cart before checkout");
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

  const completeSale = () => {
    const received = parseFloat(receivedAmount) || 0;
    const total = calculateTotal();
    
    if (received < total) {
      Alert.alert("Insufficient Amount", "Received amount is less than total");
      return;
    }
    
    Alert.alert("Success", `Sale completed!\nChange: $${calculateChange().toFixed(2)}`);
    setShowPaymentModal(false);
    setCartItems([]);
    setSearchQuery("");
    setReceivedAmount("");
    setSelectedCustomer(MOCK_CUSTOMERS[0]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Product</Text>
        <TouchableOpacity style={styles.cartInfoButton}>
          <Ionicons name="receipt-outline" size={22} color={colors.text} />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
          </View>
        </TouchableOpacity>
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
                        <Text style={styles.customerItemPhone}>{customer.phone}</Text>
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
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search or scan products..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.length > 0 && !showProductList) {
                    setShowProductList(true);
                  }
                }}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              <TouchableOpacity 
                style={styles.scanIconButton}
                onPress={() => setShowScanner(true)}
              >
                <Ionicons name="barcode-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
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
                            {product.category} • ${product.price}
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
                    <Text style={styles.itemBarcode}>{item.barcode}</Text>
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
                    <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
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
              <Text style={styles.summaryValue}>${calculateSubtotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (10%)</Text>
              <Text style={styles.summaryValue}>${calculateTax().toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
            </View>
            <View style={styles.loyaltyRow}>
              <View style={styles.loyaltyInfo}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={styles.loyaltyLabel}>Points Earned</Text>
              </View>
              <Text style={styles.loyaltyPoints}>+{calculateLoyaltyPoints()} pts</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutContainer}>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>
              Checkout • ${calculateTotal().toFixed(2)}
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.paymentModal}>
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
                <Text style={styles.paymentValue}>${calculateSubtotal().toFixed(2)}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Tax (10%)</Text>
                <Text style={styles.paymentValue}>${calculateTax().toFixed(2)}</Text>
              </View>
              <View style={[styles.paymentRow, styles.paymentTotalRow]}>
                <Text style={styles.paymentTotalLabel}>Total Amount</Text>
                <Text style={styles.paymentTotalValue}>${calculateTotal().toFixed(2)}</Text>
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
                <Text style={styles.currencySymbol}>$</Text>
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
                {[calculateTotal(), 50, 100, 200, 500, 1000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.quickAmountButton,
                      amount === calculateTotal() && styles.exactAmountButton
                    ]}
                    onPress={() => setReceivedAmount(amount.toFixed(2))}
                  >
                    <Text style={[
                      styles.quickAmountText,
                      amount === calculateTotal() && styles.exactAmountText
                    ]}>
                      {amount === calculateTotal() ? "Exact" : `$${amount}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Change Display */}
            {parseFloat(receivedAmount) > 0 && (
              <View style={styles.changeSection}>
                <View style={styles.changeDisplay}>
                  <Text style={styles.changeLabel}>Change to Return</Text>
                  <Text style={styles.changeAmount}>${calculateChange().toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={completeSale}
              >
                <Text style={styles.completeButtonText}>Complete Sale</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  loyaltyRow: {
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
  paymentModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "90%",
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
  changeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  changeAmount: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.success,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
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