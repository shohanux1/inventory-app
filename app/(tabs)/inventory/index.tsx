import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useInventory } from "@/contexts/InventoryContext";
import { useProducts } from "@/contexts/ProductContext";

interface StockCardProps {
  title: string;
  subtitle: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: number;
  colors: typeof Colors.light;
}

const StockCard: React.FC<StockCardProps> = ({ 
  title, 
  subtitle, 
  value, 
  icon, 
  trend,
  colors 
}) => {
  const styles = createStyles(colors);
  
  return (
    <View style={styles.stockCard}>
      <View style={styles.stockCardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        {trend !== undefined && (
          <View style={[
            styles.trendBadge,
            { backgroundColor: trend >= 0 ? `${colors.success}15` : `${colors.error}15` }
          ]}>
            <Ionicons 
              name={trend >= 0 ? "trending-up" : "trending-down"} 
              size={14} 
              color={trend >= 0 ? colors.success : colors.error} 
            />
            <Text style={[
              styles.trendText,
              { color: trend >= 0 ? colors.success : colors.error }
            ]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.stockValue}>{value}</Text>
      <Text style={styles.stockTitle}>{title}</Text>
      <Text style={styles.stockSubtitle}>{subtitle}</Text>
    </View>
  );
};

interface TransactionItemProps {
  type: "in" | "out" | "transfer" | "adjust" | "adjustment";
  title: string;
  subtitle: string;
  quantity: number;
  reference?: string;
  time: string;
  colors: typeof Colors.light;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  type,
  title,
  subtitle,
  quantity,
  reference,
  time,
  colors,
}) => {
  const styles = createStyles(colors);

  const getTypeDetails = () => {
    switch (type) {
      case "in":
        return { 
          icon: "arrow-down-circle" as keyof typeof Ionicons.glyphMap, 
          color: colors.success,
          label: "Stock In"
        };
      case "out":
        return { 
          icon: "arrow-up-circle" as keyof typeof Ionicons.glyphMap, 
          color: colors.error,
          label: "Stock Out"
        };
      case "transfer":
        return { 
          icon: "swap-horizontal" as keyof typeof Ionicons.glyphMap, 
          color: colors.info,
          label: "Transfer"
        };
      case "adjust":
      case "adjustment":
        return { 
          icon: "create" as keyof typeof Ionicons.glyphMap, 
          color: colors.warning,
          label: "Adjustment"
        };
      default:
        return { 
          icon: "help-circle" as keyof typeof Ionicons.glyphMap, 
          color: colors.textSecondary,
          label: "Unknown"
        };
    }
  };

  const details = getTypeDetails();

  return (
    <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
      <View style={[styles.transactionIcon, { backgroundColor: `${details.color}15` }]}>
        <Ionicons name={details.icon} size={20} color={details.color} />
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionProduct}>{title}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionLabel}>{details.label}</Text>
          <Text style={styles.transactionDot}>•</Text>
          <Text style={styles.transactionUser}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionQuantity,
          { color: type === "in" ? colors.success : type === "out" ? colors.error : colors.text }
        ]}>
          {type === "in" ? "+" : type === "out" ? "-" : ""}{quantity}
        </Text>
        <Text style={styles.transactionTime}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface QuickActionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  colors: typeof Colors.light;
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  title, 
  icon, 
  color,
  onPress,
  colors 
}) => {
  const styles = createStyles(colors);
  
  return (
    <TouchableOpacity 
      style={[styles.quickAction, { borderColor: color }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.quickActionTextContainer}>
        <Text style={styles.quickActionTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

export default function Inventory() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    stats,
    stockMovements,
    stockBatches,
    isLoading,
    fetchInventoryStats,
    fetchStockMovements,
    fetchStockBatches,
    recordStockMovement,
  } = useInventory();

  const { fetchProducts } = useProducts();

  const periods = ["Today", "Week", "Month", "Year"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchInventoryStats(),
      fetchStockMovements(),
      fetchStockBatches(10),
      fetchProducts()
    ]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleStockIn = () => {
    router.push('/stock-in');
  };

  const handleStockOut = () => {
    router.push('/stock-out');
  };

  const handleTransfer = () => {
    // Navigate to transfer page when created
    console.log("Transfer feature coming soon");
  };

  const handleAdjustment = () => {
    // Navigate to adjustment page when created
    console.log("Adjustment feature coming soon");
  };

  // Calculate period-based stats with trends using batches
  const calculatePeriodStats = () => {
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    
    switch (selectedPeriod) {
      case "Today":
        startDate.setHours(0, 0, 0, 0);
        prevStartDate = new Date(now);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevStartDate.setHours(0, 0, 0, 0);
        prevEndDate = new Date(prevStartDate);
        prevEndDate.setHours(23, 59, 59, 999);
        break;
      case "Week":
        startDate.setDate(now.getDate() - 7);
        prevStartDate.setDate(now.getDate() - 14);
        prevEndDate.setDate(now.getDate() - 7);
        break;
      case "Month":
        startDate.setMonth(now.getMonth() - 1);
        prevStartDate.setMonth(now.getMonth() - 2);
        prevEndDate.setMonth(now.getMonth() - 1);
        break;
      case "Year":
        startDate.setFullYear(now.getFullYear() - 1);
        prevStartDate.setFullYear(now.getFullYear() - 2);
        prevEndDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Current period batches
    const periodBatches = stockBatches.filter(b => 
      new Date(b.created_at) >= startDate
    );

    // Previous period batches for comparison
    const prevBatches = stockBatches.filter(b => {
      const date = new Date(b.created_at);
      return date >= prevStartDate && date < prevEndDate;
    });

    // Calculate current period values using batches
    const totalIn = periodBatches
      .filter(b => b.type === 'in')
      .reduce((sum, b) => sum + b.total_quantity, 0);
    
    const totalOut = periodBatches
      .filter(b => b.type === 'out')
      .reduce((sum, b) => sum + b.total_quantity, 0);
    
    const transfers = periodBatches
      .filter(b => b.type === 'transfer')
      .reduce((sum, b) => sum + b.total_quantity, 0);
    
    const adjustments = periodBatches
      .filter(b => b.type === 'adjustment')
      .reduce((sum, b) => sum + b.total_quantity, 0);

    // Calculate previous period values
    const prevTotalIn = prevBatches
      .filter(b => b.type === 'in')
      .reduce((sum, b) => sum + b.total_quantity, 0);
    
    const prevTotalOut = prevBatches
      .filter(b => b.type === 'out')
      .reduce((sum, b) => sum + b.total_quantity, 0);
    
    const prevTransfers = prevBatches
      .filter(b => b.type === 'transfer')
      .reduce((sum, b) => sum + b.total_quantity, 0);
    
    const prevAdjustments = prevBatches
      .filter(b => b.type === 'adjustment')
      .reduce((sum, b) => sum + b.total_quantity, 0);

    // Calculate percentage changes
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return { 
      totalIn, 
      totalOut, 
      transfers, 
      adjustments,
      totalInTrend: calculateTrend(totalIn, prevTotalIn),
      totalOutTrend: calculateTrend(totalOut, prevTotalOut),
      transfersTrend: calculateTrend(transfers, prevTransfers),
      adjustmentsTrend: calculateTrend(adjustments, prevAdjustments)
    };
  };

  const periodStats = calculatePeriodStats();

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return then.toLocaleDateString();
  };

  if (isLoading && !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Inventory Operations</Text>
            <Text style={styles.subtitle}>Manage your stock movements</Text>
          </View>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => router.push('/inventory/stock-history')}
          >
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.periodContainer}
          contentContainerStyle={styles.periodContent}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodChip,
                selectedPeriod === period && styles.periodChipActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodChipText,
                  selectedPeriod === period && styles.periodChipTextActive,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stock Overview Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.cardsContainer}
          contentContainerStyle={styles.cardsContent}
        >
          <StockCard
            title="Total In"
            subtitle="Items received"
            value={periodStats.totalIn.toLocaleString()}
            icon="arrow-down-circle-outline"
            trend={periodStats.totalInTrend}
            colors={colors}
          />
          <StockCard
            title="Total Out"
            subtitle="Items issued"
            value={periodStats.totalOut.toLocaleString()}
            icon="arrow-up-circle-outline"
            trend={periodStats.totalOutTrend}
            colors={colors}
          />
          <StockCard
            title="Transfers"
            subtitle="Between locations"
            value={periodStats.transfers.toLocaleString()}
            icon="swap-horizontal-outline"
            trend={periodStats.transfersTrend}
            colors={colors}
          />
          <StockCard
            title="Adjustments"
            subtitle="Stock corrections"
            value={periodStats.adjustments.toLocaleString()}
            icon="create-outline"
            trend={periodStats.adjustmentsTrend}
            colors={colors}
          />
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            <QuickAction
              title="Stock In"
              icon="arrow-down-circle-outline"
              color={colors.success}
              onPress={handleStockIn}
              colors={colors}
            />
            <QuickAction
              title="Stock Out"
              icon="arrow-up-circle-outline"
              color={colors.error}
              onPress={handleStockOut}
              colors={colors}
            />
            <QuickAction
              title="Transfer"
              icon="swap-horizontal-outline"
              color={colors.info}
              onPress={handleTransfer}
              colors={colors}
            />
            <QuickAction
              title="Adjustment"
              icon="create-outline"
              color={colors.warning}
              onPress={handleAdjustment}
              colors={colors}
            />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {stockBatches.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>
                  Start by adding stock in or out
                </Text>
              </View>
            ) : (
              stockBatches.slice(0, 4).map((batch) => {
                // Check if this is a sale batch
                const isSale = batch.reference?.startsWith('SALE-');
                
                return (
                  <TransactionItem
                    key={batch.id}
                    type={batch.type}
                    title={batch.supplier || (isSale ? 'Sale' : `${batch.type === 'in' ? 'Stock In' : batch.type === 'out' ? 'Stock Out' : batch.type === 'adjustment' ? 'Adjustment' : 'Transfer'}`)}
                    subtitle={`${batch.total_items} items • ${batch.total_quantity} units`}
                    quantity={batch.total_quantity}
                    reference={batch.reference}
                    time={formatTimeAgo(batch.created_at)}
                    colors={colors}
                  />
                );
              })
            )}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodContainer: {
    maxHeight: 40,
    marginBottom: 20,
  },
  periodContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  periodChipTextActive: {
    color: "#FFFFFF",
  },
  cardsContainer: {
    marginBottom: 24,
  },
  cardsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  stockCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: 140,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stockCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  stockValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  stockTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  stockSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  viewAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  quickActions: {
    gap: 12,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionProduct: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  transactionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionDot: {
    fontSize: 12,
    color: colors.textMuted,
  },
  transactionUser: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionQuantity: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
});