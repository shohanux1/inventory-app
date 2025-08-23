import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import BarcodeScanner from "../components/BarcodeScanner";
import { SearchBarWithScanner } from "../components/SearchBarWithScanner";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  image?: string;
}

interface StockEntry {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export default function StockIn() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reference, setReference] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Mock product data - replace with actual data from your backend
  const mockProducts: Product[] = [
    { id: "1", name: "iPhone 14 Pro", sku: "735745809198", currentStock: 45 },
    { id: "2", name: "MacBook Air M2", sku: "MBA-M2", currentStock: 23 },
    { id: "3", name: "AirPods Pro", sku: "APP-2", currentStock: 67 },
    { id: "4", name: "iPad Pro 11", sku: "IPD11", currentStock: 12 },
    { id: "5", name: "Apple Watch S9", sku: "AWS9", currentStock: 34 },
  ];

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToList = () => {
    if (!selectedProduct || !quantity || !unitCost) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    const newEntry: StockEntry = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: parseInt(quantity),
      unitCost: parseFloat(unitCost),
    };

    setStockEntries([...stockEntries, newEntry]);
    
    // Reset form
    setSelectedProduct(null);
    setQuantity("");
    setUnitCost("");
    setSearchQuery("");
    setIsFocused(false);
  };

  const handleRemoveEntry = (index: number) => {
    setStockEntries(stockEntries.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return stockEntries.reduce((sum, entry) => sum + (entry.quantity * entry.unitCost), 0);
  };

  const handleSubmit = () => {
    if (stockEntries.length === 0) {
      Alert.alert("No Items", "Please add at least one item to stock in");
      return;
    }

    Alert.alert(
      "Confirm Stock In",
      `You are about to add ${stockEntries.length} item(s) worth $${calculateTotal().toFixed(2)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            // Handle stock in submission
            Alert.alert("Success", "Stock has been added successfully");
            router.back();
          },
        },
      ]
    );
  };

  const handleOutsideClick = () => {
    // Only close if we're not clicking on a dropdown item
    if (isFocused) {
      setIsFocused(false);
      Keyboard.dismiss();
    }
  };

  const handleBarcodeScan = (data: string, type: string) => {
    // Prevent multiple scans
    if (showScanner === false) return;
    
    // Search for product by barcode/SKU
    const product = mockProducts.find(p => p.sku === data);
    
    if (product) {
      setSelectedProduct(product);
      setSearchQuery(product.name);
      // No alert - just select the product silently
    } else {
      // If not found, put the barcode in search field
      setSearchQuery(data);
      setIsFocused(true); // Open search dropdown
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
            <Text style={styles.headerTitle}>Stock In</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isFocused}
          >
          {/* Product Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            
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
                placeholder="Search or scan product"
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
                              SKU: {product.sku} • Stock: {product.currentStock}
                            </Text>
                          </View>
                          <View style={styles.stockBadge}>
                            <Text style={styles.stockBadgeText}>{product.currentStock}</Text>
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
                  <Text style={styles.infoLabel}>Current Stock:</Text>
                  <Text style={styles.infoValue}>{selectedProduct.currentStock} units</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SKU:</Text>
                  <Text style={styles.infoValue}>{selectedProduct.sku}</Text>
                </View>
              </View>
            )}

            {/* Quantity and Cost */}
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
                <Text style={styles.inputLabel}>Unit Cost ($) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={unitCost}
                  onChangeText={setUnitCost}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addButton, (!selectedProduct || !quantity || !unitCost) && styles.addButtonDisabled]}
              onPress={handleAddToList}
              disabled={!selectedProduct || !quantity || !unitCost}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
              <Text style={styles.addButtonText}>Add to List</Text>
            </TouchableOpacity>
          </View>

          {/* Stock Entry List */}
          {stockEntries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items to Stock In</Text>
              {stockEntries.map((entry, index) => (
                <View key={index} style={styles.entryCard}>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryName}>{entry.productName}</Text>
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryText}>Qty: {entry.quantity}</Text>
                      <Text style={styles.entryText}>@ ${entry.unitCost.toFixed(2)}</Text>
                      <Text style={styles.entryTotal}>
                        ${(entry.quantity * entry.unitCost).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveEntry(index)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Value:</Text>
                <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reference Number</Text>
              <TextInput
                style={styles.input}
                placeholder="PO-001"
                value={reference}
                onChangeText={setReference}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplier</Text>
              <TextInput
                style={styles.input}
                placeholder="Select or enter supplier"
                value={supplier}
                onChangeText={setSupplier}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any notes..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button - Fixed at bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, stockEntries.length === 0 && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={stockEntries.length === 0}
          >
            <Text style={styles.submitButtonText}>
              Confirm Stock In ({stockEntries.length} items)
            </Text>
          </TouchableOpacity>
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
    stockBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.primary + "20",
    },
    stockBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
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
    noResults: {
      padding: 20,
      alignItems: "center",
    },
    noResultsText: {
      fontSize: 14,
      color: colors.textMuted,
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
      marginBottom: 2,
    },
    productSku: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    productStock: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
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
    entryCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    entryContent: {
      flex: 1,
    },
    entryName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    entryDetails: {
      flexDirection: "row",
      gap: 12,
    },
    entryText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    entryTotal: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    removeButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${colors.error}15`,
      justifyContent: "center",
      alignItems: "center",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    totalLabel: {
      fontSize: 15,
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
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
    },
    submitButtonDisabled: {
      backgroundColor: colors.border,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.surface,
    },
  });