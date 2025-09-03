import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import BarcodeScanner from "../components/BarcodeScanner";
import { SearchBarWithScanner } from "../components/SearchBarWithScanner";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { useToast } from "../contexts/ToastContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useProducts, Product } from "../contexts/ProductContext";
import { useInventory } from "../contexts/InventoryContext";

interface StockOutEntry {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export default function StockOut() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const { formatAmount } = useCurrency();

  // Context hooks
  const { products, fetchProducts } = useProducts();
  const { recordBatchStockMovement } = useInventory();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockOutEntries, setStockOutEntries] = useState<StockOutEntry[]>([]);
  const [quantity, setQuantity] = useState("");
  const [discount, setDiscount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [saleType, setSaleType] = useState<"retail" | "wholesale">("retail");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery))
  );

  const handleAddToCart = () => {
    if (!selectedProduct || !quantity) {
      showToast("Please select a product and enter quantity", "warning");
      return;
    }

    const qty = parseInt(quantity);
    const currentStock = selectedProduct.stock_quantity || 0;

    if (qty > currentStock) {
      showToast(`Only ${currentStock} units available`, "error");
      return;
    }

    if (qty <= 0) {
      showToast("Please enter a valid quantity", "warning");
      return;
    }

    const newEntry: StockOutEntry = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: qty,
      price: selectedProduct.price,
      discount: discount ? parseFloat(discount) : 0,
    };

    setStockOutEntries([...stockOutEntries, newEntry]);
    showToast(`Added ${qty} units of ${selectedProduct.name}`, "success");
    
    // Reset form
    setSelectedProduct(null);
    setQuantity("");
    setDiscount("");
    setSearchQuery("");
    setIsFocused(false);
  };

  const handleRemoveEntry = (index: number) => {
    const entry = stockOutEntries[index];
    setStockOutEntries(stockOutEntries.filter((_, i) => i !== index));
    showToast(`Removed ${entry.productName}`, "info");
  };

  const calculateSubtotal = () => {
    return stockOutEntries.reduce((sum, entry) => {
      const itemTotal = entry.quantity * entry.price;
      const discountAmount = (itemTotal * entry.discount) / 100;
      return sum + (itemTotal - discountAmount);
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return stockOutEntries.reduce((sum, entry) => {
      const itemTotal = entry.quantity * entry.price;
      return sum + (itemTotal * entry.discount) / 100;
    }, 0);
  };

  const handleCheckout = async () => {
    if (stockOutEntries.length === 0) {
      showToast("Please add at least one item to stock out", "warning");
      return;
    }

    if (!reason.trim()) {
      showToast("Please provide a reason for stock out", "warning");
      return;
    }

    Alert.alert(
      "Confirm Stock Out",
      `You are about to remove ${stockOutEntries.length} item(s) worth ${formatAmount(calculateSubtotal())}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              // Prepare items for batch processing
              const items = stockOutEntries.map(entry => ({
                product_id: entry.productId,
                type: 'out' as const,
                quantity: entry.quantity,
                notes: `Stock out: ${entry.quantity} units at ${formatAmount(entry.price)} each${entry.discount ? ` with ${entry.discount}% discount` : ''}`,
              }));

              // Create batch with all items (similar to sales)
              const batchId = await recordBatchStockMovement(
                items,
                {
                  type: 'out',
                  reference: customerPhone || undefined,
                  supplier: customerName || reason,
                  notes: notes || `Stock out batch: ${stockOutEntries.length} items - ${reason}`,
                }
              );

              if (!batchId) {
                throw new Error('Failed to create stock out batch');
              }

              showToast(`Successfully removed stock for ${stockOutEntries.length} products`, "success");
              
              // Reset form and navigate back
              setStockOutEntries([]);
              setCustomerName("");
              setCustomerPhone("");
              setNotes("");
              setReason("");
              router.back();
            } catch (error: any) {
              console.error('Error submitting stock out:', error);
              showToast(error.message || "Failed to submit stock out", "error");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleOutsideClick = () => {
    if (isFocused) {
      setIsFocused(false);
      Keyboard.dismiss();
    }
  };

  const handleBarcodeScan = (data: string) => {
    setShowScanner(false);
    setSearchQuery(data);
    
    // Try to find product by barcode or SKU
    const product = products.find(p => p.barcode === data || p.sku === data);
    
    if (product) {
      setSelectedProduct(product);
      setSearchQuery(product.name);
      setIsFocused(false);
    } else {
      // If not found, put the barcode in search field
      setSearchQuery(data);
      setIsFocused(true); // Open search dropdown
      showToast("Product not found with this barcode", "warning");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Stock Out</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isFocused}
          >
            {/* Sale Type Toggle */}
            <View style={styles.saleTypeContainer}>
              <TouchableOpacity
                style={[styles.saleTypeButton, saleType === "retail" && styles.saleTypeActive]}
                onPress={() => setSaleType("retail")}
              >
                <Ionicons name="person-outline" size={18} color={saleType === "retail" ? colors.surface : colors.textSecondary} />
                <Text style={[styles.saleTypeText, saleType === "retail" && styles.saleTypeTextActive]}>
                  Retail Sale
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saleTypeButton, saleType === "wholesale" && styles.saleTypeActive]}
                onPress={() => setSaleType("wholesale")}
              >
                <Ionicons name="people-outline" size={18} color={saleType === "wholesale" ? colors.surface : colors.textSecondary} />
                <Text style={[styles.saleTypeText, saleType === "wholesale" && styles.saleTypeTextActive]}>
                  Wholesale
                </Text>
              </TouchableOpacity>
            </View>

            {/* Product Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Product</Text>
              
              <View style={styles.searchWrapper}>
                <SearchBarWithScanner
                  searchQuery={searchQuery}
                  onSearchChange={(text) => {
                    setSearchQuery(text);
                    if (text.length === 0) {
                      setSelectedProduct(null);
                    }
                    if (text.length > 0 && !isFocused) {
                      setIsFocused(true);
                    }
                  }}
                  onSearchFocus={() => setIsFocused(true)}
                  onSearchBlur={() => {
                    setTimeout(() => {
                      if (!selectedProduct) {
                        setIsFocused(false);
                      }
                    }, 200);
                  }}
                  onScanPress={() => setShowScanner(true)}
                  placeholder="Search product or scan barcode"
                />
                
                {/* Product Search Results Dropdown */}
                {isFocused && searchQuery.length > 0 && !selectedProduct && (
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
                            activeOpacity={0.7}
                            onPress={() => {
                              setSelectedProduct(product);
                              setSearchQuery(product.name);
                              setIsFocused(false);
                              Keyboard.dismiss();
                            }}
                          >
                            <View style={styles.productDropdownInfo}>
                              <Text style={styles.productDropdownName} numberOfLines={1}>
                                {product.name}
                              </Text>
                              <Text style={styles.productDropdownDetails}>
                                SKU: {product.sku} • {formatAmount(product.price)}
                              </Text>
                            </View>
                            <View style={[
                              styles.stockBadge,
                              (product.stock_quantity || 0) < 10 && styles.stockBadgeLow
                            ]}>
                              <Text style={[
                                styles.stockBadgeText,
                                (product.stock_quantity || 0) < 10 && styles.stockBadgeTextLow
                              ]}>
                                {product.stock_quantity || 0} left
                              </Text>
                            </View>
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

              {/* Selected Product Info */}
              {selectedProduct && (
                <View style={styles.selectedProductInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Available Stock:</Text>
                    <Text style={[
                      styles.infoValue,
                      (selectedProduct.stock_quantity || 0) < 10 && styles.lowStockText
                    ]}>
                      {selectedProduct.stock_quantity || 0} units
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Unit Price:</Text>
                    <Text style={styles.infoValue}>{formatAmount(selectedProduct.price)}</Text>
                  </View>
                </View>
              )}

              {/* Quantity and Discount */}
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Discount (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={discount}
                    onChangeText={setDiscount}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addButton, (!selectedProduct || !quantity) && styles.addButtonDisabled]}
                onPress={handleAddToCart}
                disabled={!selectedProduct || !quantity}
              >
                <Ionicons name="cart-outline" size={20} color={colors.surface} />
                <Text style={styles.addButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>

            {/* Shopping Cart */}
            {stockOutEntries.length > 0 && (
              <View style={styles.section}>
                <View style={styles.cartHeader}>
                  <Text style={styles.sectionTitle}>Shopping Cart</Text>
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{stockOutEntries.length}</Text>
                  </View>
                </View>
                
                {stockOutEntries.map((entry, index) => (
                  <View key={index} style={styles.cartItem}>
                    <View style={styles.cartItemContent}>
                      <Text style={styles.cartItemName}>{entry.productName}</Text>
                      <View style={styles.cartItemDetails}>
                        <Text style={styles.cartItemText}>
                          {entry.quantity} × {formatAmount(entry.price)}
                        </Text>
                        {entry.discount > 0 && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{entry.discount}%</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.cartItemRight}>
                      <Text style={styles.cartItemTotal}>
                        {formatAmount((entry.quantity * entry.price) * (1 - entry.discount/100))}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveEntry(index)}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                {/* Cart Summary */}
                <View style={styles.cartSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal:</Text>
                    <Text style={styles.summaryValue}>
                      {formatAmount(calculateSubtotal() + calculateTotalDiscount())}
                    </Text>
                  </View>
                  {calculateTotalDiscount() > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Discount:</Text>
                      <Text style={styles.discountValue}>
                        -{formatAmount(calculateTotalDiscount())}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>{formatAmount(calculateSubtotal())}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Stock Out Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stock Out Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason for Stock Out *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Damaged, Expired, Internal Use, etc."
                  value={reason}
                  onChangeText={setReason}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

          </ScrollView>

          <View style={{ height: 100 }} />


          {/* Checkout Button - Fixed at bottom */}
          <View style={styles.footer}>
            <View style={styles.footerContent}>
              <View>
                <Text style={styles.footerLabel}>Total Amount</Text>
                <Text style={styles.footerAmount}>{formatAmount(calculateSubtotal())}</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkoutButton, (stockOutEntries.length === 0 || isSubmitting) && styles.checkoutButtonDisabled]}
                onPress={handleCheckout}
                disabled={stockOutEntries.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.surface} />
                    <Text style={styles.checkoutButtonText}>
                      Confirm ({stockOutEntries.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
      </KeyboardAvoidingView>
      
      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
        title="Scan Product"
        subtitle="Point camera at product barcode"
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
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
      paddingBottom: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    scanButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      flex: 1,
    },
    saleTypeContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
      backgroundColor: colors.surface,
    },
    saleTypeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    saleTypeActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    saleTypeText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    saleTypeTextActive: {
      color: colors.surface,
    },
    section: {
      backgroundColor: colors.surface,
      marginTop: 2,
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    searchWrapper: {
      position: "relative",
      zIndex: 1000,
      marginBottom: 12,
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInputContainerActive: {
      borderColor: colors.primary,
    },
    searchInput: {
      flex: 1,
      marginLeft: 12,
      fontSize: 15,
      color: colors.text,
      height: 50,
      paddingVertical: 0,
    },
    clearButton: {
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
    stockBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    stockBadgeTextLow: {
      color: colors.error,
    },
    stockBadgeLow: {
      backgroundColor: colors.error + "20",
    },
    noProductsFound: {
      padding: 20,
      alignItems: "center",
    },
    noProductsText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    dropdownContainer: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      maxHeight: 200,
      overflow: "hidden",
      zIndex: 9999,
    },
    productList: {
      flex: 1,
    },
    productItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    productName: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 4,
    },
    productMeta: {
      flexDirection: "row",
      gap: 12,
    },
    productSku: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    productPrice: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    stockBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.primary + "20",
    },
    productStock: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.success,
    },
    lowStock: {
      color: colors.warning,
    },
    noResults: {
      padding: 20,
      alignItems: "center",
    },
    noResultsText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    selectedProductInfo: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.text,
    },
    lowStockText: {
      color: colors.warning,
    },
    inputRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    inputGroup: {
      flex: 1,
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      paddingTop: 14,
      textAlignVertical: "top",
      minHeight: 80,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
    },
    addButtonDisabled: {
      backgroundColor: colors.border,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.surface,
    },
    cartHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    cartBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 24,
      alignItems: "center",
    },
    cartBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.surface,
    },
    cartItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    cartItemContent: {
      flex: 1,
    },
    cartItemName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    cartItemDetails: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cartItemText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    discountBadge: {
      backgroundColor: `${colors.success}15`,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    discountText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.success,
    },
    cartItemRight: {
      alignItems: "flex-end",
      gap: 8,
    },
    cartItemTotal: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    removeButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${colors.error}15`,
      justifyContent: "center",
      alignItems: "center",
    },
    cartSummary: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
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
    discountValue: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.success,
    },
    totalRow: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.primary,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    footerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    footerAmount: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    checkoutButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      gap: 6,
    },
    checkoutButtonDisabled: {
      backgroundColor: colors.border,
    },
    checkoutButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.surface,
    },
  });