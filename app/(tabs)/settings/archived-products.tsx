import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../contexts/ToastContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { Product } from "../../../contexts/ProductContext";

export default function ArchivedProducts() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const { formatAmount } = useCurrency();

  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchArchivedProducts();
  }, []);

  const fetchArchivedProducts = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      setArchivedProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching archived products:', error);
      showToast('Failed to load archived products', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRestore = async (product: Product) => {
    Alert.alert(
      "Restore Product",
      `Are you sure you want to restore "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "default",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .update({ 
                  deleted_at: null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', product.id);

              if (error) throw error;

              showToast(`${product.name} restored successfully`, 'success');
              fetchArchivedProducts(true);
            } catch (error: any) {
              console.error('Error restoring product:', error);
              showToast('Failed to restore product', 'error');
            }
          }
        }
      ]
    );
  };

  const handlePermanentDelete = async (product: Product) => {
    Alert.alert(
      "Permanent Delete",
      `Are you sure you want to permanently delete "${product.name}"? This action cannot be undone and will remove all history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

              if (error) throw error;

              showToast(`${product.name} permanently deleted`, 'success');
              fetchArchivedProducts(true);
            } catch (error: any) {
              console.error('Error permanently deleting product:', error);
              showToast('Failed to delete product', 'error');
            }
          }
        }
      ]
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku}</Text>
        <Text style={styles.productPrice}>{formatAmount(item.price)}</Text>
        <Text style={styles.deletedDate}>
          Archived: {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : 'Unknown'}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.restoreButton]}
          onPress={() => handleRestore(item)}
        >
          <Ionicons name="arrow-undo" size={20} color={colors.primary} />
          <Text style={styles.restoreText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handlePermanentDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Archived Products</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archived Products</Text>
        <Text style={styles.count}>{archivedProducts.length}</Text>
      </View>

      {archivedProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="archive-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Archived Products</Text>
          <Text style={styles.emptyText}>
            Deleted products will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={archivedProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isRefreshing}
          onRefresh={() => fetchArchivedProducts(true)}
        />
      )}
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
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    count: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: colors.primary + "20",
      borderRadius: 12,
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      padding: 16,
    },
    productCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    productSku: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    productPrice: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.primary,
      marginBottom: 4,
    },
    deletedDate: {
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: "italic",
    },
    actions: {
      flexDirection: "row",
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    restoreButton: {
      backgroundColor: colors.primary + "15",
    },
    deleteButton: {
      backgroundColor: colors.error + "15",
    },
    restoreText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.primary,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });