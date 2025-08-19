import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
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
  type: "add" | "edit" | "remove";
  colors: typeof Colors.light;
}

const RecentItem: React.FC<RecentItemProps> = ({ title, subtitle, time, type, colors }) => {
  const styles = createStyles(colors);
  
  const getTypeIcon = () => {
    switch (type) {
      case "add": return "add-circle";
      case "edit": return "create";
      case "remove": return "remove-circle";
      default: return "ellipse";
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case "add": return colors.success;
      case "edit": return colors.info;
      case "remove": return colors.warning;
      default: return colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity style={styles.recentItem} activeOpacity={0.7}>
      <View style={[styles.recentIcon, { backgroundColor: `${getTypeColor()}15` }]}>
        <Ionicons name={getTypeIcon()} size={18} color={getTypeColor()} />
      </View>
      <View style={styles.recentContent}>
        <Text style={styles.recentTitle}>{title}</Text>
        <Text style={styles.recentSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.recentTime}>{time}</Text>
    </TouchableOpacity>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
            value="1,248"
            change="+12%"
            trending="up"
            icon="cube-outline"
            colors={colors}
          />
          <MetricCard
            label="Low Stock"
            value="23"
            change="-8%"
            trending="down"
            icon="alert-circle-outline"
            colors={colors}
          />
          <MetricCard
            label="Categories"
            value="45"
            change="+5%"
            trending="up"
            icon="grid-outline"
            colors={colors}
          />
          <MetricCard
            label="Total Value"
            value="$125.8K"
            change="+18%"
            trending="up"
            icon="wallet-outline"
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
              onPress={() => router.push("/(tabs)/products")}
              colors={colors}
            />
            <ActionButton
              label="Stock In"
              icon="arrow-down-circle-outline"
              onPress={() => router.push("/(tabs)/inventory")}
              colors={colors}
            />
            <ActionButton
              label="Stock Out"
              icon="arrow-up-circle-outline"
              onPress={() => router.push("/(tabs)/inventory")}
              colors={colors}
            />
            <ActionButton
              label="Scan"
              icon="scan-outline"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        {/* Low Stock Alert */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Low Stock Alert</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/inventory")}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.alertCard}>
            <View style={styles.alertItems}>
              <View style={styles.alertItem}>
                <View style={styles.alertDot} />
                <Text style={styles.alertText}>iPhone 14 Pro - 5 units left</Text>
              </View>
              <View style={styles.alertItem}>
                <View style={[styles.alertDot, styles.alertDotWarning]} />
                <Text style={styles.alertText}>MacBook Air M2 - 3 units left</Text>
              </View>
              <View style={styles.alertItem}>
                <View style={styles.alertDot} />
                <Text style={styles.alertText}>AirPods Pro - 8 units left</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentList}>
            <RecentItem
              title="Stock Added"
              subtitle="50 units of iPhone 15 Pro"
              time="2h ago"
              type="add"
              colors={colors}
            />
            <RecentItem
              title="Price Updated"
              subtitle="Samsung Galaxy S24 Ultra"
              time="4h ago"
              type="edit"
              colors={colors}
            />
            <RecentItem
              title="Stock Issued"
              subtitle="10 units of iPad Pro"
              time="5h ago"
              type="remove"
              colors={colors}
            />
            <RecentItem
              title="New Product"
              subtitle="Apple Watch Series 9"
              time="1d ago"
              type="add"
              colors={colors}
            />
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
    width: 36,
    height: 36,
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
});