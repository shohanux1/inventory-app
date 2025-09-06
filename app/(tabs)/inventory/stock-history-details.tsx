import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../contexts/ToastContext";
import { BarcodeSticker } from "../../../components/BarcodeSticker";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

interface StockBatchDetails {
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
  updated_at?: string;
  user_id: string;
  movements?: StockMovementItem[];
}

interface StockMovementItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  notes?: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    image_url?: string;
    price: number;
    cost_price?: number;
    stock_quantity: number;
  };
}

export default function StockHistoryDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { formatAmount } = useCurrency();
  const { showToast } = useToast();

  const [batchDetails, setBatchDetails] = useState<StockBatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stickerQuantity, setStickerQuantity] = useState(1);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    if (id) {
      fetchBatchDetails();
    }
  }, [id]);

  const fetchBatchDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch batch details
      const { data: batchData, error: batchError } = await supabase
        .from('stock_batches')
        .select('*')
        .eq('id', id)
        .single();

      if (batchError) throw batchError;

      // Fetch related stock movements with product details
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products (
            id,
            name,
            sku,
            barcode,
            image_url,
            price,
            cost_price,
            stock_quantity
          )
        `)
        .eq('batch_id', id)
        .order('created_at', { ascending: false });

      if (movementsError) throw movementsError;

      setBatchDetails({
        ...batchData,
        movements: movementsData || []
      });
    } catch (error) {
      console.error('Error fetching batch details:', error);
      showToast('Failed to load batch details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBatchDetails();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getTypeInfo = (type: string) => {
    const isSale = batchDetails?.reference?.startsWith('SALE-');
    if (isSale) {
      return {
        label: 'Sale Transaction',
        icon: 'cash-outline',
        color: colors.success
      };
    }
    
    switch (type) {
      case 'in':
        return {
          label: 'Stock In',
          icon: 'arrow-down-circle',
          color: colors.success
        };
      case 'out':
        return {
          label: 'Stock Out',
          icon: 'arrow-up-circle',
          color: colors.error
        };
      case 'adjustment':
        return {
          label: 'Stock Adjustment',
          icon: 'create',
          color: colors.warning
        };
      case 'transfer':
        return {
          label: 'Stock Transfer',
          icon: 'swap-horizontal',
          color: colors.info
        };
      default:
        return {
          label: 'Unknown',
          icon: 'help-circle',
          color: colors.textSecondary
        };
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!batchDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleGenerateStickers = (product: any, quantity: number) => {
    setSelectedProduct(product);
    setStickerQuantity(quantity);
    setShowBarcodeModal(true);
  };

  const handleGenerateAllStickers = () => {
    setSelectedProduct(null);
    setShowBarcodeModal(true);
  };

  const handleExportStickers = async () => {
    try {
      if (!viewShotRef.current) return;
      
      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Barcode Stickers',
        });
      } else {
        Alert.alert('Success', 'Stickers saved to gallery');
      }
    } catch (error) {
      console.error('Error exporting stickers:', error);
      showToast('Failed to export stickers', 'error');
    }
  };

  const typeInfo = getTypeInfo(batchDetails.type);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        {batchDetails?.type === 'in' ? (
          <TouchableOpacity 
            style={styles.barcodeButton}
            onPress={handleGenerateAllStickers}
          >
            <Ionicons name="qr-code" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Transaction Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.typeSection}>
            <View style={[styles.typeIcon, { backgroundColor: `${typeInfo.color}15` }]}>
              <Ionicons name={typeInfo.icon as any} size={32} color={typeInfo.color} />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeLabel}>{typeInfo.label}</Text>
              {batchDetails.reference && (
                <Text style={styles.reference}>{batchDetails.reference}</Text>
              )}
            </View>
          </View>

          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(batchDetails.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(batchDetails.status) }]}>
              {batchDetails.status.charAt(0).toUpperCase() + batchDetails.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="cube-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {batchDetails.total_items}
              </Text>
              <Text style={styles.statLabel}>Items</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.info}15` }]}>
              <Ionicons name="layers-outline" size={16} color={colors.info} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {batchDetails.type === 'out' ? '-' : '+'}{batchDetails.total_quantity}
              </Text>
              <Text style={styles.statLabel}>Qty</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="cash-outline" size={16} color={colors.success} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(batchDetails.total_value)}
              </Text>
              <Text style={styles.statLabel}>Value</Text>
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{formatDateTime(batchDetails.created_at)}</Text>
          </View>

          {batchDetails.supplier && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Supplier</Text>
              <Text style={styles.detailValue}>{batchDetails.supplier}</Text>
            </View>
          )}

          {batchDetails.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={[styles.detailValue, styles.notesText]}>{batchDetails.notes}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={[styles.detailValue, styles.idText]}>{batchDetails.id.slice(0, 8)}</Text>
          </View>
        </View>

        {/* Items Section */}
        {batchDetails.movements && batchDetails.movements.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items ({batchDetails.movements.length})</Text>
            
            {batchDetails.movements.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product?.name || 'Unknown Product'}
                    </Text>
                    {item.product?.sku && (
                      <Text style={styles.itemSku}>SKU: {item.product.sku}</Text>
                    )}
                  </View>
                  <View style={styles.itemQuantity}>
                    <Text style={[
                      styles.quantityValue,
                      { color: batchDetails.type === 'out' ? colors.error : colors.success }
                    ]}>
                      {batchDetails.type === 'out' ? '-' : '+'}{item.quantity}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Unit Cost</Text>
                    <Text style={styles.itemDetailValue}>
                      {formatAmount(item.unit_cost || item.product?.cost_price || 0)}
                    </Text>
                  </View>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Total</Text>
                    <Text style={styles.itemDetailValue}>
                      {formatAmount(item.total_cost || (item.quantity * (item.unit_cost || item.product?.cost_price || 0)))}
                    </Text>
                  </View>
                </View>

                {item.notes && (
                  <Text style={styles.itemNotes}>{item.notes}</Text>
                )}
                
                {batchDetails.type === 'in' && (
                  <TouchableOpacity
                    style={styles.generateStickerButton}
                    onPress={() => handleGenerateStickers(item.product, item.quantity)}
                  >
                    <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
                    <Text style={styles.generateStickerText}>
                      Generate {item.quantity} Stickers
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Barcode Generation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBarcodeModal}
        onRequestClose={() => setShowBarcodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Barcode Stickers</Text>
              <TouchableOpacity onPress={() => setShowBarcodeModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <>
                <Text style={styles.modalSubtitle}>
                  {selectedProduct === 'all' 
                    ? `Generating ${stickerQuantity} stickers for all products`
                    : `Generating ${stickerQuantity} stickers for ${selectedProduct.name}`}
                </Text>

                <ScrollView 
                  style={styles.stickerPreview}
                  contentContainerStyle={styles.stickerPreviewContent}
                >
                  <ViewShot ref={viewShotRef} style={styles.viewShot}>
                    <View style={styles.stickerGrid}>
                      {selectedProduct === 'all' ? (
                        // Generate stickers for all products
                        batchDetails?.movements?.map((item) => 
                          Array.from({ length: item.quantity }).map((_, index) => (
                            <View key={`${item.id}-${index}`} style={styles.stickerWrapper}>
                              <BarcodeSticker
                                product={item.product}
                                size={120}
                                showPrice={true}
                                colors={colors}
                              />
                            </View>
                          ))
                        ).flat()
                      ) : (
                        // Generate stickers for single product
                        Array.from({ length: stickerQuantity }).map((_, index) => (
                          <View key={index} style={styles.stickerWrapper}>
                            <BarcodeSticker
                              product={selectedProduct}
                              size={120}
                              showPrice={true}
                              colors={colors}
                            />
                          </View>
                        ))
                      )}
                    </View>
                  </ViewShot>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowBarcodeModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.exportButton]}
                    onPress={handleExportStickers}
                  >
                    <Ionicons name="share-outline" size={20} color="white" />
                    <Text style={styles.exportButtonText}>Export Stickers</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!selectedProduct && batchDetails?.movements && (
              <View style={styles.productList}>
                <Text style={styles.selectProductText}>Generate stickers for:</Text>
                
                {/* Generate All Option */}
                <TouchableOpacity
                  style={[styles.productOption, styles.generateAllOption]}
                  onPress={() => {
                    // Create a combined view of all products
                    const allProducts = batchDetails.movements.map(item => ({
                      product: item.product,
                      quantity: item.quantity
                    }));
                    setSelectedProduct('all');
                    setStickerQuantity(allProducts.reduce((sum, item) => sum + item.quantity, 0));
                  }}
                >
                  <View style={styles.productOptionInfo}>
                    <View style={styles.generateAllHeader}>
                      <Ionicons name="layers-outline" size={20} color={colors.primary} />
                      <Text style={[styles.productOptionName, { color: colors.primary }]}>
                        Generate All Products
                      </Text>
                    </View>
                    <Text style={styles.productOptionQuantity}>
                      Total: {batchDetails.movements.reduce((sum, item) => sum + item.quantity, 0)} stickers 
                      ({batchDetails.movements.length} products)
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>

                <View style={styles.divider} />
                
                <Text style={styles.orText}>Or select individual product:</Text>
                
                {batchDetails.movements.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.productOption}
                    onPress={() => handleGenerateStickers(item.product, item.quantity)}
                  >
                    <View style={styles.productOptionInfo}>
                      <Text style={styles.productOptionName}>{item.product?.name}</Text>
                      <Text style={styles.productOptionQuantity}>
                        Quantity: {item.quantity}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerCard: {
    backgroundColor: colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  typeSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  reference: {
    fontSize: 13,
    color: colors.textMuted,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statInfo: {
    alignItems: "center",
    width: "100%",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
    minWidth: "100%",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  detailsSection: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    flex: 2,
    textAlign: "right",
  },
  notesText: {
    textAlign: "left",
    lineHeight: 20,
  },
  idText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
  },
  itemsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  itemCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemQuantity: {
    alignItems: "flex-end",
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  itemDetailRow: {
    flex: 1,
  },
  itemDetailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  itemDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  itemNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  barcodeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  generateStickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}10`,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  generateStickerText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stickerPreview: {
    maxHeight: 400,
    marginHorizontal: 20,
  },
  stickerPreviewContent: {
    paddingBottom: 20,
  },
  viewShot: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
  },
  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  stickerWrapper: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  exportButton: {
    backgroundColor: colors.primary,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  productList: {
    paddingHorizontal: 20,
  },
  selectProductText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  productOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  productOptionInfo: {
    flex: 1,
  },
  productOptionName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  productOptionQuantity: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  generateAllOption: {
    backgroundColor: `${colors.primary}05`,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  generateAllHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 16,
  },
  orText: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 12,
    fontWeight: "600",
  },
});