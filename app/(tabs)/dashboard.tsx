import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useInventory } from "../../contexts/InventoryContext";
import { useProducts } from "../../contexts/ProductContext";
import { useColorScheme } from "../../hooks/useColorScheme";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  trending?: "up" | "down";
  icon: keyof typeof Ionicons.glyphMap;
  colors: typeof Colors.light;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, trending, icon, colors }) => {
  const styles = createStyles(colors);
  return (
    <TouchableOpacity style={styles.metricCard} activeOpacity={0.95}>
      <View style={styles.metricHeader}>
        <View style={styles.metricIconContainer}>
          <Ionicons name={icon} size={18} color={colors.textSecondary} />
        </View>
        {change && (
          <Text style={[styles.metricChange, trending === "up" ? styles.changeUp : styles.changeDown]}>
            {change}
          </Text>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

interface ActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: typeof Colors.light;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, onPress, colors }) => {
  const styles = createStyles(colors);
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

interface RecentItemProps {
  title: string;
  subtitle: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  colors: typeof Colors.light;
}

const RecentItem: React.FC<RecentItemProps> = ({ title, subtitle, time, icon, iconColor, colors }) => {
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={styles.recentItem} activeOpacity={0.7}>
      <View style={[styles.recentIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.recentContent}>
        <Text style={styles.recentTitle}>{title}</Text>
        <Text style={styles.recentSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.recentTime}>{time}</Text>
    </TouchableOpacity>
  );
};

// Skeleton Loading Component
const SkeletonDashboard: React.FC<{ colors: typeof Colors.light }> = ({ colors }) => {
  const styles = createStyles(colors);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const SkeletonBox: React.FC<{ 
    width?: number | string; 
    height?: number; 
    style?: any;
  }> = ({ width = '100%', height = 20, style = {} }) => {
    const opacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View 
        style={[
          {
            width,
            height,
            backgroundColor: colors.borderLight,
            borderRadius: 8,
            opacity,
          },
          style
        ]}
      />
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <SkeletonBox width={150} height={28} style={{ marginBottom: 8 }} />
          <SkeletonBox width={200} height={16} />
        </View>
        <SkeletonBox width={42} height={42} style={{ borderRadius: 12 }} />
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <SkeletonBox width={32} height={32} />
              <SkeletonBox width={40} height={16} />
            </View>
            <SkeletonBox width={60} height={24} style={{ marginBottom: 8 }} />
            <SkeletonBox width={80} height={14} />
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonBox width={100} height={20} />
        </View>
        <View style={styles.actionsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.actionButton}>
              <SkeletonBox width={20} height={20} style={{ marginBottom: 6 }} />
              <SkeletonBox width={60} height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Low Stock Alert */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonBox width={120} height={20} />
          <SkeletonBox width={50} height={16} />
        </View>
        <View style={styles.alertCard}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.alertItem}>
              <SkeletonBox width={8} height={8} style={{ borderRadius: 4 }} />
              <SkeletonBox width={200} height={14} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonBox width={120} height={20} />
          <SkeletonBox width={50} height={16} />
        </View>
        <View style={styles.recentList}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.recentItem}>
              <SkeletonBox width={40} height={40} style={{ borderRadius: 10, marginRight: 12 }} />
              <View style={styles.recentContent}>
                <SkeletonBox width={140} height={14} style={{ marginBottom: 4 }} />
                <SkeletonBox width={100} height={12} />
              </View>
              <SkeletonBox width={50} height={12} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { formatAmount } = useCurrency();

  // Context hooks
  const { products, categories, totalProductCount, fetchProducts, fetchCategories } = useProducts();
  const { stats, stockBatches, fetchInventoryStats, fetchStockBatches } = useInventory();

  useEffect(() => {
    // Only load if we haven't loaded before or if data is empty
    if (!hasLoadedOnce || products.length === 0) {
      loadDashboardData();
    } else {
      // Data already exists, just refresh in background
      setIsInitialLoad(false);
      refreshDataInBackground();
    }
  }, []);

  const loadDashboardData = async () => {
    // Only show loading on first load when there's no data
    if (!hasLoadedOnce) {
      setIsInitialLoad(true);
    }
    
    try {
      // Ensure skeleton shows for at least 500ms to be visible
      const startTime = Date.now();
      
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchInventoryStats(),
        fetchStockBatches(4)
      ]);
      
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 500 && !hasLoadedOnce) {
        // Wait for remaining time to complete 500ms minimum
        await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
      }
      
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsInitialLoad(false);
    }
  };

  const refreshDataInBackground = async () => {
    // Silently refresh data without showing loading state
    try {
      await Promise.all([
        fetchInventoryStats(),
        fetchStockBatches(4)
      ]);
      // Only refresh products if needed
      if (totalProductCount === 0) {
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Calculate dynamic values
  const totalProducts = totalProductCount || products.length; // Use actual count from DB
  const lowStockCount = stats?.lowStockItems || 0;
  const todaySales = stats?.todaySales || 0;
  const todayProfit = stats?.todayProfit || 0;

  // Calculate percentage changes (mock data for now, can be calculated from historical data)
  const calculateChange = () => {
    // In a real app, you'd compare with previous period data
    // For now, using mock percentages that change based on current values
    return {
      products: totalProducts > 10 ? "+12%" : "+5%",
      productsTrend: "up" as const,
      lowStock: lowStockCount < 5 ? "-8%" : "+3%",
      lowStockTrend: lowStockCount < 5 ? "down" as const : "up" as const,
      sales: todaySales > 1000 ? "+25%" : "+10%",
      salesTrend: "up" as const,
      profit: todayProfit > 500 ? "+30%" : "+15%",
      profitTrend: "up" as const,
    };
  };

  const changes = calculateChange();

  // Get low stock products
  const lowStockProducts = products
    .filter(p => {
      const stock = p.stock_quantity || 0;
      const minStock = p.min_stock_level || 10;
      return stock > 0 && stock < minStock;
    })
    .slice(0, 3);

  // Get recent stock batches for activity (includes sales as they create stock batches)
  const recentActivities = stockBatches
    .slice(0, 4)
    .map(batch => {
      // Check if this is a sale batch
      const isSale = batch.reference?.startsWith('SALE-');
      
      // Determine icon and color based on type
      let icon: keyof typeof Ionicons.glyphMap;
      let iconColor: string;
      
      if (isSale) {
        icon = 'cash-outline';
        iconColor = colors.success;
      } else if (batch.type === 'in') {
        icon = 'arrow-down-circle-outline';
        iconColor = colors.success;
      } else if (batch.type === 'out') {
        icon = 'arrow-up-circle-outline';
        iconColor = colors.error;
      } else if (batch.type === 'adjustment') {
        icon = 'create-outline';
        iconColor = colors.warning;
      } else if (batch.type === 'transfer') {
        icon = 'swap-horizontal-outline';
        iconColor = colors.info;
      } else {
        icon = 'cube-outline';
        iconColor = colors.textSecondary;
      }
      
      return {
        id: batch.id,
        title: isSale 
          ? `${batch.supplier || 'Walk-in Customer'}` 
          : `${batch.supplier || `${batch.type === 'in' ? 'Stock In' : batch.type === 'out' ? 'Stock Out' : batch.type === 'adjustment' ? 'Adjustment' : 'Transfer'}`}`,
        subtitle: isSale
          ? `Sale - ${batch.total_items} items`
          : `${batch.type === 'in' ? '+' : batch.type === 'out' ? '-' : ''}${batch.total_quantity} units`,
        time: batch.created_at,
        icon,
        iconColor
      };
    });

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  // Show loading only on very first load
  if (isInitialLoad && !hasLoadedOnce) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonDashboard colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subtitle}>Here's your inventory overview</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Total Products"
            value={totalProducts.toString()}
            change={changes.products}
            trending={changes.productsTrend}
            icon="cube-outline"
            colors={colors}
          />
          <MetricCard
            label="Low Stock"
            value={lowStockCount.toString()}
            change={changes.lowStock}
            trending={changes.lowStockTrend}
            icon="alert-circle-outline"
            colors={colors}
          />
          <MetricCard
            label="Today's Profit"
            value={formatAmount(todayProfit)}
            change={changes.profit}
            trending={changes.profitTrend}
            icon="trending-up-outline"
            colors={colors}
          />
          <MetricCard
            label="Today's Sales"
            value={formatAmount(todaySales)}
            change={changes.sales}
            trending={changes.salesTrend}
            icon="cash-outline"
            colors={colors}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            <ActionButton
              label="Add Product"
              icon="add-circle-outline"
              onPress={() => router.push('/products/add-product')}
              colors={colors}
            />
            <ActionButton
              label="Stock In"
              icon="arrow-down-circle-outline"
              onPress={() => router.push('/stock-in')}
              colors={colors}
            />
            <ActionButton
              label="Stock Out"
              icon="arrow-up-circle-outline"
              onPress={() => router.push('/stock-out')}
              colors={colors}
            />
            <ActionButton
              label="Sell"
              icon="cart-outline"
              onPress={() => router.push("/sell")}
              colors={colors}
            />
          </View>
        </View>

        {/* Low Stock Alert */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Low Stock Alert</Text>
            <TouchableOpacity onPress={() => router.push('/inventory')}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.alertCard}>
            <View style={styles.alertItems}>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <View key={product.id} style={styles.alertItem}>
                    <View style={[
                      styles.alertDot,
                      (product.stock_quantity || 0) <= 5 && styles.alertDotWarning
                    ]} />
                    <Text style={styles.alertText} numberOfLines={1} ellipsizeMode="tail">
                      {product.name} - {product.stock_quantity || 0} units left
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noAlertsText}>No low stock items</Text>
              )}
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/settings/sales-history')}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentList}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <RecentItem
                  key={activity.id}
                  title={activity.title}
                  subtitle={activity.subtitle}
                  time={formatTimeAgo(activity.time)}
                  icon={activity.icon}
                  iconColor={activity.iconColor}
                  colors={colors}
                />
              ))
            ) : (
              <View style={styles.noActivityContainer}>
                <Text style={styles.noActivityText}>No recent activity</Text>
              </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: "47.5%",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  metricChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  changeUp: {
    color: colors.success,
  },
  changeDown: {
    color: colors.info,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
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
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  alertItems: {
    gap: 12,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  alertDotWarning: {
    backgroundColor: colors.error,
  },
  alertText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    paddingRight: 8,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  recentSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recentTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  noAlertsText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  noActivityContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noActivityText: {
    fontSize: 14,
    color: colors.textMuted,
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
});