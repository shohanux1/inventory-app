import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { useToast } from "../../../contexts/ToastContext";
import { supabase } from "../../../lib/supabase";

interface Brand {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  website?: string | null;
  productCount?: number;
}

export default function Brands() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { showToast } = useToast();
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      // Fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (brandsError) {
        throw brandsError;
      }
      
      if (brandsData) {
        // Fetch product counts for each brand
        const brandsWithCounts = await Promise.all(
          brandsData.map(async (brand) => {
            const { count } = await supabase
              .from('products')
              .select('id', { count: 'exact' })
              .eq('brand_id', brand.id);
            
            return {
              ...brand,
              productCount: count || 0
            };
          })
        );
        
        setBrands(brandsWithCounts);
      }
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      showToast('Failed to load brands', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBrand = () => {
    setBrandName("");
    setBrandDescription("");
    setBrandWebsite("");
    setEditingBrand(null);
    setShowAddModal(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setBrandName(brand.name);
    setBrandDescription(brand.description || "");
    setBrandWebsite(brand.website || "");
    setEditingBrand(brand);
    setShowAddModal(true);
  };

  const handleSaveBrand = async () => {
    if (!brandName.trim()) {
      showToast("Please enter a brand name", "warning");
      return;
    }

    setIsLoading(true);
    try {
      if (editingBrand) {
        // Edit existing brand
        const { error } = await supabase
          .from('brands')
          .update({
            name: brandName,
            description: brandDescription || null,
            website: brandWebsite || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBrand.id);

        if (error) throw error;
        
        showToast("Brand updated successfully", "success");
      } else {
        // Add new brand
        const { error } = await supabase
          .from('brands')
          .insert({
            name: brandName,
            description: brandDescription || null,
            website: brandWebsite || null
          });

        if (error) throw error;
        
        showToast("Brand added successfully", "success");
      }
      
      // Refresh brands
      await fetchBrands();
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error saving brand:', error);
      if (error.code === '23505') {
        showToast("Brand name already exists", "error");
      } else {
        showToast(error.message || "Failed to save brand", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    try {
      // Check if brand has products
      const brand = brands.find(b => b.id === brandId);
      if (brand && brand.productCount && brand.productCount > 0) {
        showToast("Cannot delete brand with products", "warning");
        return;
      }

      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId);

      if (error) throw error;
      
      showToast("Brand deleted successfully", "success");
      await fetchBrands();
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      showToast(error.message || "Failed to delete brand", "error");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Brands</Text>
        <TouchableOpacity onPress={handleAddBrand} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search brands..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{brands.length}</Text>
          <Text style={styles.statLabel}>Total Brands</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {brands.reduce((sum, brand) => sum + (brand.productCount || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
      </View>

      {/* Brands List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading brands...</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchBrands(true)}
              colors={[colors.primary]}
            />
          }>
          <View style={styles.brandsList}>
            {filteredBrands.map((brand) => (
              <TouchableOpacity
                key={brand.id}
                style={styles.brandCard}
                onPress={() => handleEditBrand(brand)}
                activeOpacity={0.7}
              >
                <View style={styles.brandContent}>
                  <View style={styles.brandIcon}>
                    <Text style={styles.brandInitial}>
                      {brand.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.brandInfo}>
                    <Text style={styles.brandName} numberOfLines={1}>
                      {brand.name}
                    </Text>
                    {brand.description && (
                      <Text style={styles.brandDescription} numberOfLines={2}>
                        {brand.description}
                      </Text>
                    )}
                    <Text style={styles.brandCount}>
                      {brand.productCount} products
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteBrand(brand.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {filteredBrands.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No brands found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? "Try a different search term" : "Add your first brand to get started"}
              </Text>
            </View>
          )}
          
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Add/Edit Brand Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBrand ? "Edit Brand" : "Add Brand"}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Brand Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Brand Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter brand name"
                placeholderTextColor={colors.textMuted}
                value={brandName}
                onChangeText={setBrandName}
              />
            </View>

            {/* Brand Description Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Enter brand description"
                placeholderTextColor={colors.textMuted}
                value={brandDescription}
                onChangeText={setBrandDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Brand Website Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Website (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://example.com"
                placeholderTextColor={colors.textMuted}
                value={brandWebsite}
                onChangeText={setBrandWebsite}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isLoading && { opacity: 0.6 }]}
                onPress={handleSaveBrand}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingBrand ? "Update" : "Add"} Brand
                  </Text>
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
    paddingBottom: 15,
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: {
    padding: 16,
    backgroundColor: colors.surface,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  brandsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  brandCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  brandContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  brandInitial: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.primary,
  },
  brandInfo: {
    flex: 1,
    marginRight: 12,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  brandDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  brandCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
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
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
});