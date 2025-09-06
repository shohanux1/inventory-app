import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { useSales } from "../../../hooks/useSales";
import { ReceiptData } from "../../../services/printer-expo";
import { ReceiptSuccessModal } from "../../../components/ReceiptSuccessModal";
import { useCurrency } from "../../../contexts/CurrencyContext";

export default function SalesHistory() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  
  const {
    sales,
    isLoading,
    selectedSale,
    saleItems,
    fetchSales,
    fetchSaleDetails,
    setSelectedSale,
    getReceiptNumber,
  } = useSales();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"all" | "cash" | "card" | "mobile">("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [receiptDataForPrint, setReceiptDataForPrint] = useState<ReceiptData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const { formatAmount } = useCurrency();

  useEffect(() => {
    loadSales();
  }, [selectedFilter, selectedPaymentMethod]);

  const loadSales = () => {
    const filters: any = {
      paymentMethod: selectedPaymentMethod,
    };

    // Add date filters
    const now = new Date();
    if (selectedFilter === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filters.dateFrom = today.toISOString();
    } else if (selectedFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filters.dateFrom = weekAgo.toISOString();
    } else if (selectedFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filters.dateFrom = monthAgo.toISOString();
    }

    fetchSales(filters);
  };

  const handleSearch = () => {
    fetchSales({ searchQuery });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSales();
    setIsRefreshing(false);
  };

  const handleSalePress = async (sale: any) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
    await fetchSaleDetails(sale.id);
  };

  const handlePrintSale = () => {
    if (!selectedSale || !saleItems) return;
    
    // Prepare receipt data from the selected sale
    const receiptData: ReceiptData = {
      businessName: "My POS Store",
      businessAddress: "123 Main Street, City",
      businessPhone: "+1 234 567 8900",
      businessEmail: "store@mypos.com",
      receiptNumber: getReceiptNumber(selectedSale.id),
      date: new Date(selectedSale.created_at).toLocaleDateString(),
      time: new Date(selectedSale.created_at).toLocaleTimeString(),
      cashier: selectedSale.cashier || 'Staff',
      customerName: selectedSale.customer_name || 'Walk-in Customer',
      customerPhone: selectedSale.customer_phone || '',
      customerEmail: selectedSale.customer_email || undefined,
      items: saleItems.map((item: any) => ({
        name: item.products?.name || 'Unknown Item',
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        sku: item.products?.sku || ''
      })),
      subtotal: selectedSale.subtotal,
      tax: selectedSale.tax || 0,
      total: selectedSale.total,
      paymentMethod: selectedSale.payment_method.charAt(0).toUpperCase() + selectedSale.payment_method.slice(1),
      receivedAmount: selectedSale.received_amount,
      changeAmount: selectedSale.change_amount || 0,
      footerMessage: "30-day return policy with receipt",
      barcode: selectedSale.id.substring(0, 12).toUpperCase()
    };
    
    setReceiptDataForPrint(receiptData);
    setShowDetailsModal(false);
    setShowPrintModal(true);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'cash-outline';
      case 'card':
        return 'card-outline';
      case 'mobile':
        return 'phone-portrait-outline';
      default:
        return 'wallet-outline';
    }
  };

  const calculateTotalStats = () => {
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    const count = sales.length;
    const average = count > 0 ? total / count : 0;
    return { total, count, average };
  };

  const stats = calculateTotalStats();

  const renderSaleItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.saleCard}
      onPress={() => handleSalePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.saleHeader}>
        <View>
          <Text style={styles.receiptNumber}>{getReceiptNumber(item.id)}</Text>
          <Text style={styles.customerName}>
            {item.customer_name || 'Walk-in Customer'}
          </Text>
        </View>
        <View style={styles.saleRight}>
          <Text style={styles.saleAmount}>${item.total.toFixed(2)}</Text>
          <Text style={styles.saleTime}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
      
      <View style={styles.saleFooter}>
        <View style={styles.saleInfo}>
          <View style={styles.infoItem}>
            <Ionicons 
              name={getPaymentIcon(item.payment_method)} 
              size={14} 
              color={colors.textSecondary} 
            />
            <Text style={styles.infoText}>{item.payment_method}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {item.items_count || 0} {item.items_count === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales History</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by receipt, customer, phone..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery("");
              loadSales();
            }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
          {/* Date Filters */}
          {(["all", "today", "week", "month"] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive
              ]}>
                {filter === "all" ? "All Time" : 
                 filter === "today" ? "Today" :
                 filter === "week" ? "This Week" : "This Month"}
              </Text>
            </TouchableOpacity>
          ))}
          
          <View style={styles.filterDivider} />
          
          {/* Payment Method Filters */}
          {(["all", "cash", "card", "mobile"] as const).map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.filterChip,
                selectedPaymentMethod === method && styles.filterChipActive
              ]}
              onPress={() => setSelectedPaymentMethod(method)}
            >
              <Ionicons 
                name={method === "all" ? "wallet-outline" : getPaymentIcon(method) as any} 
                size={14} 
                color={selectedPaymentMethod === method ? colors.primary : colors.textSecondary} 
              />
              <Text style={[
                styles.filterText,
                selectedPaymentMethod === method && styles.filterTextActive
              ]}>
                {method === "all" ? "All" : method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Sales</Text>
          <Text style={styles.statValue}>{stats.count}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.statValue}>${stats.total.toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg. Sale</Text>
          <Text style={styles.statValue}>${stats.average.toFixed(2)}</Text>
        </View>
      </View>

      {/* Sales List */}
      <FlatList
        data={sales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No sales found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? "Try adjusting your search" : "Your sales will appear here"}
            </Text>
          </View>
        }
      />

      {/* Sale Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Sale Details</Text>
                <Text style={styles.modalReceiptNumber}>
                  {selectedSale && getReceiptNumber(selectedSale.id)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Customer Info */}
              {selectedSale && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>
                      {selectedSale.customer_name || 'Walk-in Customer'}
                    </Text>
                  </View>
                  {selectedSale.customer_phone && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={styles.detailValue}>{selectedSale.customer_phone}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedSale.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Items */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Items ({saleItems.length})</Text>
                {saleItems.map((item, index) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>
                        {item.products?.name || 'Unknown Product'}
                      </Text>
                      <Text style={styles.itemSku}>
                        SKU: {item.products?.sku || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.itemPricing}>
                      <Text style={styles.itemQuantity}>
                        {item.quantity} × ${item.price.toFixed(2)}
                      </Text>
                      <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Payment Summary */}
              {selectedSale && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Payment Summary</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Subtotal</Text>
                    <Text style={styles.detailValue}>${selectedSale.subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tax</Text>
                    <Text style={styles.detailValue}>${selectedSale.tax.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${selectedSale.total.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method</Text>
                    <View style={styles.paymentMethod}>
                      <Ionicons 
                        name={getPaymentIcon(selectedSale.payment_method) as any} 
                        size={16} 
                        color={colors.primary} 
                      />
                      <Text style={styles.paymentMethodText}>
                        {selectedSale.payment_method}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Received</Text>
                    <Text style={styles.detailValue}>
                      ${selectedSale.received_amount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Change</Text>
                    <Text style={[styles.detailValue, { color: colors.success }]}>
                      ${selectedSale.change_amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handlePrintSale}>
                <Ionicons name="print-outline" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Print Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Print Receipt Modal */}
      <ReceiptSuccessModal
        visible={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        receiptData={receiptDataForPrint}
        showNewSaleButton={false}
        title="Print Receipt"
        subtitle={`Sale from ${receiptDataForPrint && selectedSale?.created_at ? new Date(selectedSale.created_at).toLocaleDateString() : ''}`}
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
    justifyContent: "space-between",
    alignItems: "center",
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
  filterButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  filtersSection: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  saleCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  receiptNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  saleRight: {
    alignItems: 'flex-end',
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  saleTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  saleInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalReceiptNumber: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
  },
  modalSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  itemSku: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPricing: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  totalRow: {
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    textTransform: 'capitalize',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
});