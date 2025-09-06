import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { useInventory } from "../../../contexts/InventoryContext";
import { useProducts } from "../../../contexts/ProductContext";
import { useCurrency } from "../../../contexts/CurrencyContext";

export default function StockHistory() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { formatAmount } = useCurrency();
  
  const { stockBatches, fetchStockBatches, isLoading } = useInventory();
  const { products, fetchProducts } = useProducts();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const movementTypes = [
    { key: "all", label: "All", icon: "apps" },
    { key: "in", label: "In", icon: "arrow-down" },
    { key: "out", label: "Out", icon: "arrow-up" },
    { key: "adjustment", label: "Adjust", icon: "create" },
    { key: "transfer", label: "Transfer", icon: "swap-horizontal" },
  ];
  
  const periods = [
    { key: "all", label: "All Time" },
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Debug log to check data
  useEffect(() => {
    console.log('Stock batches count:', stockBatches.length);
    console.log('Products count:', products.length);
    if (stockBatches.length > 0) {
      console.log('Sample batch:', stockBatches[0]);
    }
  }, [stockBatches, products]);


  const loadData = async () => {
    await Promise.all([
      fetchStockBatches(50), // Fetch more for history page
      fetchProducts()
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter batches based on search and filters
  const filteredBatches = stockBatches.filter((batch) => {
    // Type filter
    if (selectedType !== "all" && batch.type !== selectedType) {
      return false;
    }

    // Period filter
    if (selectedPeriod !== "all") {
      const batchDate = new Date(batch.created_at);
      
      switch (selectedPeriod) {
        case "today":
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (batchDate < today) return false;
          break;
        case "week":
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (batchDate < weekAgo) return false;
          break;
        case "month":
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (batchDate < monthAgo) return false;
          break;
      }
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const isSale = batch.reference?.startsWith('SALE-');
      
      return (
        batch.supplier?.toLowerCase().includes(searchLower) ||
        batch.reference?.toLowerCase().includes(searchLower) ||
        batch.notes?.toLowerCase().includes(searchLower) ||
        (isSale && 'sale'.includes(searchLower))
      );
    }

    return true;
  });

  const getBatchIcon = (batch: any) => {
    const isSale = batch.reference?.startsWith('SALE-');
    if (isSale) return "cash-outline";
    const type = batch.type;
    switch (type) {
      case "in":
        return "arrow-down-circle";
      case "out":
        return "arrow-up-circle";
      case "adjustment":
        return "create";
      case "transfer":
        return "swap-horizontal";
      default:
        return "cube-outline";
    }
  };

  const getBatchColor = (batch: any) => {
    const isSale = batch.reference?.startsWith('SALE-');
    if (isSale) return colors.success;
    const type = batch.type;
    switch (type) {
      case "in":
        return colors.success;
      case "out":
        return colors.error;
      case "adjustment":
        return colors.warning;
      case "transfer":
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };


  const renderBatchItem = ({ item }: { item: any }) => {
    const batchColor = getBatchColor(item);
    const icon = getBatchIcon(item);
    const isSale = item.reference?.startsWith('SALE-');

    return (
      <TouchableOpacity 
        style={styles.batchCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/inventory/stock-history-details?id=${item.id}`)}
      >
        <View style={[styles.batchIcon, { backgroundColor: `${batchColor}15` }]}>
          <Ionicons name={icon as any} size={20} color={batchColor} />
        </View>

        <View style={styles.batchContent}>
          <View style={styles.batchHeader}>
            <Text style={styles.batchTitle} numberOfLines={1}>
              {item.supplier || (isSale ? 'Sale Transaction' : `${item.type === 'in' ? 'Stock In' : item.type === 'out' ? 'Stock Out' : item.type === 'adjustment' ? 'Adjustment' : 'Transfer'}`)}
            </Text>
            {item.reference && (
              <Text style={styles.batchReference}>{item.reference}</Text>
            )}
          </View>
          <View style={styles.batchDetails}>
            <View style={styles.batchMetaItem}>
              <Ionicons name="cube-outline" size={12} color={colors.textMuted} />
              <Text style={styles.batchMeta}>{item.total_items} items</Text>
            </View>
            <Text style={styles.batchDot}>•</Text>
            <Text style={styles.batchMeta}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.batchRight}>
          <Text style={[
            styles.batchQuantity, 
            { color: batchColor }
          ]}>
            {item.type === "in" ? "+" : item.type === "out" ? "-" : ""}{item.total_quantity}
          </Text>
          <Text style={styles.batchValue}>{formatAmount(item.total_value || 0)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      {/* Search Bar and Filter Button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color={colors.primary} />
          {(selectedType !== 'all' || selectedPeriod !== 'all') && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(selectedType !== 'all' || selectedPeriod !== 'all') && (
        <View style={styles.activeFilters}>
          {selectedType !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {movementTypes.find(t => t.key === selectedType)?.label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedType('all')}>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {selectedPeriod !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {periods.find(p => p.key === selectedPeriod)?.label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPeriod('all')}>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Results Summary */}
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryText}>
            {filteredBatches.length} {filteredBatches.length === 1 ? "transaction" : "transactions"}
          </Text>
          {filteredBatches.length > 0 && (
            <Text style={styles.summaryStats}>
              In: {filteredBatches.filter(b => b.type === 'in').reduce((sum, b) => sum + b.total_quantity, 0).toLocaleString()} • 
              Out: {filteredBatches.filter(b => b.type === 'out').reduce((sum, b) => sum + b.total_quantity, 0).toLocaleString()}
            </Text>
          )}
        </View>
        {filteredBatches.length > 0 && (
          <Text style={styles.summaryValue}>
            {formatAmount(
              filteredBatches.reduce((sum, b) => sum + (b.total_value || 0), 0)
            )}
          </Text>
        )}
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="file-tray-outline" size={48} color={colors.textMuted} />
      <Text style={styles.emptyText}>No transactions found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery || selectedType !== "all" || selectedPeriod !== "all" 
          ? "Try adjusting your filters" 
          : "Stock transactions will appear here"}
      </Text>
    </View>
  );

  // Filter Modal
  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilterModal}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Transaction Type</Text>
            <View style={styles.filterOptions}>
              {movementTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.filterOption,
                    selectedType === type.key && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedType(type.key)}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={18} 
                    color={selectedType === type.key ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    selectedType === type.key && styles.filterOptionTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Time Period</Text>
            <View style={styles.filterOptions}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.filterOption,
                    selectedPeriod === period.key && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedPeriod === period.key && styles.filterOptionTextActive
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSelectedType('all');
                setSelectedPeriod('all');
              }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock History</Text>
        <View style={{ width: 40 }} />
      </View>

      <FilterModal />

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBatches}
          renderItem={renderBatchItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          contentContainerStyle={filteredBatches.length === 0 ? styles.emptyList : undefined}
        />
      )}
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  activeFilters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
  summary: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  summaryStats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  batchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  batchIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  batchContent: {
    flex: 1,
  },
  batchHeader: {
    marginBottom: 4,
  },
  batchTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  batchReference: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  batchDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  batchMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  batchMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  batchDot: {
    fontSize: 10,
    color: colors.textMuted,
    marginHorizontal: 6,
  },
  batchRight: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  batchQuantity: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  batchValue: {
    fontSize: 12,
    color: colors.textSecondary,
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
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  filterOptionActive: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  filterOptionTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
  },
});