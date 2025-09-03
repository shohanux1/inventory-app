import { Colors } from "@/constants/Colors";
import { useProducts, Product, StockHistory } from "@/contexts/ProductContext";
import { useToast } from "@/contexts/ToastContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const { formatAmount } = useCurrency();
  
  const { 
    fetchProductById, 
    fetchStockHistory, 
    deleteProduct, 
    adjustStock 
  } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustType, setStockAdjustType] = useState<"in" | "out" | "adjust">("in");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProductData();
  }, [id]);

  const loadProductData = async () => {
    if (!id || typeof id !== 'string') {
      showToast("Invalid product ID", "error");
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch product details
      const productData = await fetchProductById(id);
      if (productData) {
        setProduct(productData);
        
        // Fetch stock history
        const history = await fetchStockHistory(id);
        setStockHistory(history);
      } else {
        showToast("Product not found", "error");
        router.back();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      showToast("Failed to load product details", "error");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = () => {
    if (!product) return { color: colors.textMuted, text: "Unknown" };
    
    const stock = product.stock_quantity || 0;
    const minStock = product.min_stock_level || 10;
    
    if (stock === 0) return { color: colors.error, text: "Out of Stock" };
    if (stock < minStock) return { color: colors.warning, text: "Low Stock" };
    return { color: colors.success, text: "In Stock" };
  };

  const handleDelete = async () => {
    if (!product) return;
    
    const success = await deleteProduct(product.id);
    if (success) {
      router.back();
    }
  };

  const handleStockAdjust = async () => {
    if (!product || !stockQuantity || parseInt(stockQuantity) <= 0) {
      showToast("Please enter a valid quantity", "warning");
      return;
    }

    setIsSaving(true);
    
    try {
      const success = await adjustStock(
        product.id,
        stockAdjustType,
        parseInt(stockQuantity),
        stockNote || undefined
      );

      if (success) {
        setShowStockModal(false);
        setStockQuantity("");
        setStockNote("");
        setStockAdjustType("in"); // Reset to default
        
        // Reload product data to show updated stock
        await loadProductData();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const closeStockModal = () => {
    if (!isSaving) {
      setShowStockModal(false);
      setStockQuantity("");
      setStockNote("");
      setStockAdjustType("in");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stockStatus = getStockStatus();
  const cost = product.cost_price || 0;
  const profit = product.price - cost;
  const profitMargin = product.price > 0 ? ((profit / product.price) * 100).toFixed(1) : "0";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="create-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Image */}
        <View style={styles.imageSection}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
              <Text style={styles.imageText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productCategory}>
            {product.categories?.name || product.category || 'Uncategorized'}
            {product.brand ? ` • ${product.brand}` : ''}
          </Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: `${stockStatus.color}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: stockStatus.color }]} />
              <Text style={[styles.statusText, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            </View>
            <Text style={styles.stockCount}>{product.stock_quantity || 0} units available</Text>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Ionicons name="pricetag" size={20} color={colors.primary} />
            <Text style={styles.metricValue}>{formatAmount(product.price)}</Text>
            <Text style={styles.metricLabel}>Selling Price</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="trending-up" size={20} color={colors.success} />
            <Text style={styles.metricValue}>{profitMargin}%</Text>
            <Text style={styles.metricLabel}>Profit Margin</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="cube" size={20} color={colors.warning} />
            <Text style={styles.metricValue}>{product.stock_quantity || 0}</Text>
            <Text style={styles.metricLabel}>Current Stock</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowStockModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Adjust Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="barcode-outline" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Print Barcode</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push("/sell")}
          >
            <Ionicons name="cart-outline" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Quick Sell</Text>
          </TouchableOpacity>
        </View>

        {/* Product Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SKU</Text>
            <Text style={styles.infoValue}>{product.sku}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Barcode</Text>
            <Text style={styles.infoValue}>{product.barcode || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Supplier</Text>
            <Text style={styles.infoValue}>{product.supplier || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>
              {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Pricing Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Details</Text>
          
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Cost Price</Text>
              <Text style={styles.pricingValue}>{formatAmount(product.cost_price || 0)}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Selling Price</Text>
              <Text style={styles.pricingValue}>{formatAmount(product.price)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Profit per Unit</Text>
              <Text style={[styles.pricingValue, { color: colors.success }]}>
                {formatAmount(profit)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stock Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stock Information</Text>
            <TouchableOpacity onPress={() => setShowStockModal(true)}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.stockInfoCard}>
            <View style={styles.stockInfoRow}>
              <View style={styles.stockInfoItem}>
                <Text style={styles.stockInfoLabel}>Current Stock</Text>
                <Text style={styles.stockInfoValue}>{product.stock_quantity || 0} units</Text>
              </View>
              <View style={styles.stockInfoItem}>
                <Text style={styles.stockInfoLabel}>Min Stock Level</Text>
                <Text style={styles.stockInfoValue}>{product.min_stock_level || 0} units</Text>
              </View>
            </View>
            
            <View style={styles.stockWarning}>
              <Ionicons 
                name="information-circle" 
                size={16} 
                color={(product.stock_quantity || 0) < (product.min_stock_level || 10) ? colors.warning : colors.textSecondary} 
              />
              <Text style={[
                styles.stockWarningText,
                { color: (product.stock_quantity || 0) < (product.min_stock_level || 10) ? colors.warning : colors.textSecondary }
              ]}>
                {(product.stock_quantity || 0) < (product.min_stock_level || 10) 
                  ? "Stock is below minimum level" 
                  : "Stock level is healthy"}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {/* Stock History */}
        {stockHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Stock Activity</Text>
            
            {stockHistory.map((activity, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={[
                  styles.historyIcon,
                  { backgroundColor: 
                    activity.type === "in" ? `${colors.success}15` :
                    activity.type === "out" ? `${colors.error}15` :
                    `${colors.warning}15`
                  }
                ]}>
                  <Ionicons 
                    name={
                      activity.type === "in" ? "arrow-down" :
                      activity.type === "out" ? "arrow-up" :
                      "sync"
                    }
                    size={16}
                    color={
                      activity.type === "in" ? colors.success :
                      activity.type === "out" ? colors.error :
                      colors.warning
                    }
                  />
                </View>
                
                <View style={styles.historyContent}>
                  <Text style={styles.historyNote}>{activity.note || 'Stock adjustment'}</Text>
                  <Text style={styles.historyDate}>
                    {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : ''}
                  </Text>
                </View>
                
                <Text style={[
                  styles.historyQuantity,
                  { color: 
                    activity.type === "in" ? colors.success :
                    activity.type === "out" ? colors.error :
                    colors.warning
                  }
                ]}>
                  {activity.type === "in" ? "+" : activity.type === "out" ? "-" : ""}
                  {activity.quantity}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Stock Adjustment Modal */}
      <Modal
        visible={showStockModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeStockModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isSaving && { opacity: 0.9 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock</Text>
              <TouchableOpacity 
                onPress={closeStockModal}
                disabled={isSaving}
              >
                <Ionicons name="close" size={24} color={isSaving ? colors.textMuted : colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.stockTypeSelector}>
              {[
                { type: "in", label: "Stock In", icon: "arrow-down" },
                { type: "out", label: "Stock Out", icon: "arrow-up" },
                { type: "adjust", label: "Adjust", icon: "sync" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.stockTypeButton,
                    stockAdjustType === item.type && styles.stockTypeButtonActive,
                    isSaving && { opacity: 0.5 }
                  ]}
                  onPress={() => !isSaving && setStockAdjustType(item.type as any)}
                  disabled={isSaving}
                >
                  <Ionicons 
                    name={item.icon as any} 
                    size={18} 
                    color={stockAdjustType === item.type ? "#FFFFFF" : colors.text}
                  />
                  <Text style={[
                    styles.stockTypeText,
                    stockAdjustType === item.type && styles.stockTypeTextActive,
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>
                {stockAdjustType === "adjust" ? "New Quantity" : "Quantity"}
              </Text>
              <TextInput
                style={[styles.modalInput, isSaving && { opacity: 0.5 }]}
                placeholder={stockAdjustType === "adjust" ? "Enter new total quantity" : "Enter quantity"}
                placeholderTextColor={colors.textMuted}
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="numeric"
                editable={!isSaving}
              />

              <Text style={styles.modalLabel}>Note (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea, isSaving && { opacity: 0.5 }]}
                placeholder="Add a note about this adjustment"
                placeholderTextColor={colors.textMuted}
                value={stockNote}
                onChangeText={setStockNote}
                multiline
                numberOfLines={3}
                editable={!isSaving}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalCancelButton, isSaving && { opacity: 0.5 }]}
                onPress={closeStockModal}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalSaveButton,
                  isSaving && styles.modalSaveButtonDisabled,
                  (!stockQuantity || parseInt(stockQuantity) <= 0) && { opacity: 0.6 }
                ]}
                onPress={handleStockAdjust}
                disabled={isSaving || !stockQuantity || parseInt(stockQuantity) <= 0}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Adjustment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  imageSection: {
    backgroundColor: colors.surface,
    paddingVertical: 20,
    alignItems: "center",
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: "dashed",
  },
  imageText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textMuted,
  },
  section: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  stockCount: {
    fontSize: 14,
    color: colors.text,
  },
  metricsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  pricingCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pricingValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  stockInfoCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stockInfoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  stockInfoItem: {
    flex: 1,
  },
  stockInfoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  stockInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  stockWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  stockWarningText: {
    fontSize: 13,
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyNote: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyQuantity: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  stockTypeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  stockTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stockTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stockTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  stockTypeTextActive: {
    color: "#FFFFFF",
  },
  modalForm: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  modalSaveButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalSaveButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
});