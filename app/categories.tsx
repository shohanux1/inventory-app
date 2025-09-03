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
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount?: number;
  description?: string | null;
}

// Sample categories for fallback
const SAMPLE_CATEGORIES: Category[] = [
  { id: "1", name: "Electronics", icon: "laptop-outline", color: "#3B82F6", itemCount: 0 },
  { id: "2", name: "Clothing", icon: "shirt-outline", color: "#10B981", itemCount: 0 },
  { id: "3", name: "Food & Beverages", icon: "fast-food-outline", color: "#F59E0B", itemCount: 0 },
  { id: "4", name: "Home & Garden", icon: "home-outline", color: "#8B5CF6", itemCount: 0 },
  { id: "5", name: "Sports", icon: "basketball-outline", color: "#EF4444", itemCount: 0 },
  { id: "6", name: "Books", icon: "book-outline", color: "#06B6D4", itemCount: 0 },
  { id: "7", name: "Toys & Games", icon: "game-controller-outline", color: "#EC4899", itemCount: 0 },
  { id: "8", name: "Health & Beauty", icon: "fitness-outline", color: "#84CC16", itemCount: 0 },
];

const ICON_OPTIONS = [
  "laptop-outline", "shirt-outline", "fast-food-outline", "home-outline",
  "basketball-outline", "book-outline", "game-controller-outline", "fitness-outline",
  "car-outline", "musical-notes-outline", "camera-outline", "gift-outline",
  "briefcase-outline", "medkit-outline", "paw-outline", "flower-outline"
];

const COLOR_OPTIONS = [
  "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6",
  "#EF4444", "#06B6D4", "#EC4899", "#84CC16",
  "#6366F1", "#14B8A6", "#F97316", "#A855F7"
];

export default function Categories() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { showToast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesError) {
        if (categoriesError.code === 'PGRST205') {
          console.log('Categories table not found. Using sample data.');
          showToast('Database setup needed. Using sample data.', 'info');
          setCategories(SAMPLE_CATEGORIES);
        } else {
          throw categoriesError;
        }
      } else if (categoriesData && categoriesData.length > 0) {
        // Fetch product counts for each category
        const counts: Record<string, number> = {};
        for (const category of categoriesData) {
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('category_id', category.id);
          counts[category.id] = count || 0;
        }
        setProductCounts(counts);
        
        const mappedCategories = categoriesData.map(cat => ({
          ...cat,
          icon: cat.icon || 'folder-outline',
          color: cat.color || '#3B82F6',
          itemCount: counts[cat.id] || 0
        }));
        setCategories(mappedCategories);
      } else {
        // Use sample data if no categories in database
        setCategories(SAMPLE_CATEGORIES);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      showToast('Using offline mode', 'warning');
      setCategories(SAMPLE_CATEGORIES);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = () => {
    setCategoryName("");
    setCategoryDescription("");
    setSelectedIcon(ICON_OPTIONS[0]);
    setSelectedColor(COLOR_OPTIONS[0]);
    setEditingCategory(null);
    setShowAddModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      showToast("Please enter a category name", "warning");
      return;
    }

    setIsLoading(true);
    try {
      if (editingCategory) {
        // Edit existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryName,
            description: categoryDescription || null,
            icon: selectedIcon,
            color: selectedColor,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        
        showToast("Category updated successfully", "success");
      } else {
        // Add new category
        const { error } = await supabase
          .from('categories')
          .insert({
            name: categoryName,
            description: categoryDescription || null,
            icon: selectedIcon,
            color: selectedColor
          });

        if (error) throw error;
        
        showToast("Category added successfully", "success");
      }
      
      // Refresh categories
      await fetchCategories();
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error saving category:', error);
      showToast(error.message || "Failed to save category", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Check if category has products
      const category = categories.find(cat => cat.id === categoryId);
      if (category && category.itemCount && category.itemCount > 0) {
        showToast("Cannot delete category with products", "warning");
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      
      showToast("Category deleted successfully", "success");
      await fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showToast(error.message || "Failed to delete category", "error");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={handleAddCategory} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
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
          <Text style={styles.statValue}>{categories.length}</Text>
          <Text style={styles.statLabel}>Total Categories</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {categories.reduce((sum, cat) => sum + (cat.itemCount || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
      </View>

      {/* Categories Grid */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchCategories(true)}
            colors={[colors.primary]}
          />
        }>
        <View style={styles.categoriesGrid}>
          {filteredCategories.map((category, index) => (
            <View key={category.id} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteCategory(category.id)}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleEditCategory(category)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                
                <Text style={styles.categoryName} numberOfLines={1}>
                  {category.name}
                </Text>
                
                <Text style={styles.categoryCount}>
                  {category.itemCount} items
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        
        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No categories found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? "Try a different search term" : "Add your first category to get started"}
            </Text>
          </View>
        )}
        
        <View style={{ height: 20 }} />
      </ScrollView>
      )}

      {/* Add/Edit Category Modal */}
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
                {editingCategory ? "Edit Category" : "Add Category"}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Category Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Category Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter category name"
                placeholderTextColor={colors.textMuted}
                value={categoryName}
                onChangeText={setCategoryName}
              />
            </View>

            {/* Category Description Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Enter category description"
                placeholderTextColor={colors.textMuted}
                value={categoryDescription}
                onChangeText={setCategoryDescription}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Icon Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Select Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsRow}>
                  {ICON_OPTIONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOption,
                        selectedIcon === icon && styles.selectedOption
                      ]}
                      onPress={() => setSelectedIcon(icon)}
                    >
                      <Ionicons 
                        name={icon as any} 
                        size={24} 
                        color={selectedIcon === icon ? colors.primary : colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Color Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Select Color</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColorOption
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.inputLabel}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}15` }]}>
                  <Ionicons name={selectedIcon as any} size={32} color={selectedColor} />
                </View>
                <Text style={styles.previewName}>
                  {categoryName || "Category Name"}
                </Text>
              </View>
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
                onPress={handleSaveCategory}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingCategory ? "Update" : "Add"} Category
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
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
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
    maxHeight: "90%",
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
  optionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: colors.background,
  },
  previewSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  previewCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  previewName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
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