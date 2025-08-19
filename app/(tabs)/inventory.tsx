import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";

interface StockCardProps {
  title: string;
  subtitle: string;
  value: string;
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
  type: "in" | "out" | "transfer" | "adjust";
  product: string;
  quantity: number;
  user: string;
  time: string;
  colors: typeof Colors.light;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  type,
  product,
  quantity,
  user,
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
        return { 
          icon: "create" as keyof typeof Ionicons.glyphMap, 
          color: colors.warning,
          label: "Adjustment"
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
        <Text style={styles.transactionProduct}>{product}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionLabel}>{details.label}</Text>
          <Text style={styles.transactionDot}>•</Text>
          <Text style={styles.transactionUser}>{user}</Text>
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

  const periods = ["Today", "Week", "Month", "Year"];

  const transactions = [
    {
      id: "1",
      type: "in" as const,
      product: "iPhone 15 Pro Max",
      quantity: 25,
      user: "John Doe",
      time: "2 hours ago",
    },
    {
      id: "2",
      type: "out" as const,
      product: "MacBook Air M2",
      quantity: 5,
      user: "Jane Smith",
      time: "3 hours ago",
    },
    {
      id: "3",
      type: "transfer" as const,
      product: "iPad Pro 12.9",
      quantity: 10,
      user: "Store B",
      time: "5 hours ago",
    },
    {
      id: "4",
      type: "adjust" as const,
      product: "AirPods Pro 2",
      quantity: 3,
      user: "System",
      time: "Yesterday",
    },
    {
      id: "5",
      type: "in" as const,
      product: "Apple Watch Series 9",
      quantity: 15,
      user: "Supplier A",
      time: "Yesterday",
    },
  ];

  const handleStockIn = () => {
    router.push("/stock-in");
  };

  const handleStockOut = () => {
    router.push("/stock-out");
  };

  const handleTransfer = () => {
    router.push("/stock-transfer");
  };

  const handleAdjustment = () => {
    router.push("/stock-adjustment");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Inventory Operations</Text>
            <Text style={styles.subtitle}>Manage your stock movements</Text>
          </View>
          <TouchableOpacity style={styles.historyButton}>
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
            value="1,245"
            icon="arrow-down-circle-outline"
            trend={12}
            colors={colors}
          />
          <StockCard
            title="Total Out"
            subtitle="Items issued"
            value="892"
            icon="arrow-up-circle-outline"
            trend={-8}
            colors={colors}
          />
          <StockCard
            title="Transfers"
            subtitle="Between locations"
            value="156"
            icon="swap-horizontal-outline"
            trend={5}
            colors={colors}
          />
          <StockCard
            title="Adjustments"
            subtitle="Stock corrections"
            value="23"
            icon="create-outline"
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
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                type={transaction.type}
                product={transaction.product}
                quantity={transaction.quantity}
                user={transaction.user}
                time={transaction.time}
                colors={colors}
              />
            ))}
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
});