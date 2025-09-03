import BarcodeScanner from "@/components/BarcodeScanner";
import { ImageUpload, uploadProductImage } from "@/components/ImageUpload";
import ProductCard from "@/components/ProductCard";
import { SearchBarWithScanner } from "@/components/SearchBarWithScanner";
import { Colors } from "@/constants/Colors";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Product, useProducts } from "@/contexts/ProductContext";
import { useToast } from "@/contexts/ToastContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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

// Grid Item Component
interface GridItemProps {
  product: Product;
  onPress: () => void;
  colors: typeof Colors.light;
}

const GridItem: React.FC<GridItemProps> = ({ product, onPress, colors }) => {
  const styles = createStyles(colors);
  const { formatAmount } = useCurrency();
  
  const getStockStatus = () => {
    const stock = product.stock_quantity || 0;
    if (stock === 0) return colors.error;
    if (stock < 10) return colors.warning;
    return colors.success;
  };

  const stockColor = getStockStatus();

  return (
    <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.gridImageContainer}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
          </View>
        )}
      </View>
      
      <View style={styles.gridContent}>
        <Text style={styles.gridName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.gridSku}>SKU: {product.sku}</Text>
        
        <View style={styles.gridFooter}>
          <Text style={styles.gridPrice}>{formatAmount(product.price)}</Text>
          <View style={styles.gridStockContainer}>
            <View style={[styles.gridStockDot, { backgroundColor: stockColor }]} />
            <Text style={styles.gridStock}>{product.stock_quantity || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Filter Modal Component
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  colors: typeof Colors.light;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, colors }) => {
  const styles = createStyles(colors);
  const { 
    categories, 
    selectedCategory, 
    setSelectedCategory, 
    sortBy, 
    setSortBy 
  } = useProducts();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20 }}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              bounces={false}
            >
              <View style={styles.filterOptions}>
                {categories.map((category) => {
                  const isActive = selectedCategory === category.name;
                  const isAll = category.name === "All";
                  
                  return (
                    <TouchableOpacity
                      key={category.name}
                      style={[
                        styles.filterChip,
                        isActive && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedCategory(category.name)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.filterChipContent}>
                        {!isAll && category.icon && (
                          <View style={[
                            styles.filterIconWrapper,
                            isActive && styles.filterIconWrapperActive
                          ]}>
                            <Ionicons 
                              name={category.icon as any}
                              size={14}
                              color={isActive ? colors.primary : colors.textMuted}
                            />
                          </View>
                        )}
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive && styles.filterChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {category.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              {["Name", "Price: Low to High", "Price: High to Low", "Stock"].map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={styles.sortOption}
                  onPress={() => setSortBy(sort)}
                >
                  <Text style={styles.sortOptionText}>{sort}</Text>
                  {sortBy === sort && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Edit Product Modal Component
interface EditModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  colors: typeof Colors.light;
}

const EditProductModal: React.FC<EditModalProps> = ({ visible, product, onClose, colors }) => {
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const { updateProduct, categories } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    price: "",
    costPrice: "",
    stock: "",
    minStock: "",
    category: "",
    categoryId: "",
    imageUrl: "",
  });

  React.useEffect(() => {
    if (product) {
      setEditForm({
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        costPrice: product.cost_price?.toString() || "",
        stock: product.stock_quantity?.toString() || "",
        minStock: product.min_stock_level?.toString() || "",
        category: product.categories?.name || product.category || "",
        categoryId: product.category_id || "",
        imageUrl: product.image_url || "",
      });
      setSelectedImage(null);
    }
  }, [product]);

  const handleSave = async () => {
    if (!product || !editForm.name || !editForm.sku || !editForm.price) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    setIsLoading(true);
    
    // Upload image if selected
    let imageUrl = editForm.imageUrl;
    if (selectedImage) {
      const uploadedUrl = await uploadProductImage(selectedImage, editForm.sku, (error) => {
        showToast(error, 'error');
      });
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const success = await updateProduct(product.id, {
      ...editForm,
      imageUrl
    }, selectedImage || undefined);

    setIsLoading(false);
    if (success) {
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.editForm}>
              {/* Basic Information */}
              <View style={[styles.sectionHeader, { marginTop: 4 }]}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.formLabel}>Product Name *</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({...editForm, name: text})}
                  placeholder="Enter product name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="code-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>SKU *</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.sku}
                    onChangeText={(text) => setEditForm({...editForm, sku: text})}
                    placeholder="Enter SKU"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="barcode-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>Barcode</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.barcode}
                    onChangeText={(text) => setEditForm({...editForm, barcode: text})}
                    placeholder="Enter barcode"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Pricing & Stock */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pricing & Stock</Text>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>Selling Price *</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.price}
                    onChangeText={(text) => setEditForm({...editForm, price: text})}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="pricetags-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>Cost Price</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.costPrice}
                    onChangeText={(text) => setEditForm({...editForm, costPrice: text})}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>Stock Quantity</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.stock}
                    onChangeText={(text) => setEditForm({...editForm, stock: text})}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>Min Stock Alert</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.minStock}
                    onChangeText={(text) => setEditForm({...editForm, minStock: text})}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="grid-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.formLabel}>Category</Text>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categorySelector}
                >
                  {categories.filter(cat => cat.name !== "All").map((cat) => (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.categoryOption,
                        editForm.category === cat.name && styles.categoryOptionActive,
                      ]}
                      onPress={() => {
                        setEditForm({
                          ...editForm, 
                          category: cat.name,
                          categoryId: cat.id || ""
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          editForm.category === cat.name && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Product Image */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.formLabel}>Product Image</Text>
                </View>
                
                <ImageUpload
                  imageUrl={editForm.imageUrl}
                  onImageSelected={setSelectedImage}
                  productSku={editForm.sku}
                  colors={colors}
                  disabled={isLoading}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main Products Component
export default function Products() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  
  const {
    categories,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredProducts,
    viewMode,
    setViewMode,
    fetchProducts,
    fetchCategories,
  } = useProducts();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleProductPress = (product: Product) => {
    router.push(`/(tabs)/products/product-details/${product.id}`);
  };

  const handleProductEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditModalVisible(true);
  };

  const handleBarcodeScan = (data: string) => {
    setShowScanner(false);
    setSearchQuery(data);
  };

  const handleAddProduct = () => {
    router.push("/add-product");
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>{filteredProducts.length} items</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          >
            <Ionicons
              name={viewMode === "list" ? "grid" : "list"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleAddProduct}
          >
            <Ionicons name="add" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fixed Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBarWithScanner
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onScanPress={() => setShowScanner(true)}
          onFilterPress={() => setFilterModalVisible(true)}
          placeholder="Search products..."
          showFilter={true}
        />
      </View>

      {/* Fixed Categories - Modern Design */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          bounces={false}
        >
          {categories.map((category) => {
            const isActive = selectedCategory === category.name;
            const isAll = category.name === "All";
            
            return (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.name)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryChipContent}>
                  {!isAll && category.icon && (
                    <View style={[
                      styles.categoryIconWrapper,
                      isActive && styles.categoryIconWrapperActive
                    ]}>
                      <Ionicons
                        name={category.icon as any}
                        size={14}
                        color={isActive ? colors.primary : colors.textMuted}
                      />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {category.name}
                  </Text>
                  {isActive && (
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>
                        {filteredProducts.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                fetchProducts(true);
                fetchCategories();
              }}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => 
            viewMode === "list" ? (
              <ProductCard
                product={item}
                onPress={() => handleProductPress(item)}
                onEdit={() => handleProductEdit(item)}
                colors={colors}
              />
            ) : (
              <GridItem
                product={item}
                onPress={() => handleProductPress(item)}
                colors={colors}
              />
            )
          }
          contentContainerStyle={viewMode === "list" ? styles.listContent : styles.gridContainer}
          showsVerticalScrollIndicator={false}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        colors={colors}
      />

      <EditProductModal
        visible={editModalVisible}
        product={selectedProduct}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedProduct(null);
        }}
        colors={colors}
      />

      <BarcodeScanner
        visible={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
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
    paddingBottom: 20,
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Categories Section Styles - Modern Minimalist Design
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  categoriesSection: {
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 10,
    height: 36,
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  categoryIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconWrapperActive: {
    backgroundColor: colors.primary + '20',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  categoryTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  categoryCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  categoryCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  gridContainer: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  gridRow: {
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  gridItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 14,
    width: "48%",
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  gridImageContainer: {
    height: 110,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  gridContent: {
    padding: 14,
  },
  gridName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  gridSku: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 10,
    letterSpacing: 0.2,
    fontWeight: "500",
  },
  gridFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.2,
  },
  gridStockContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridStockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridStock: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterOptions: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 10,
    height: 38,
    justifyContent: 'center',
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  filterIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconWrapperActive: {
    backgroundColor: colors.primary + '20',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  sortOptions: {
    gap: 4,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sortOptionText: {
    fontSize: 15,
    color: colors.text,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  editModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "80%",
  },
  editForm: {
    paddingVertical: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  formInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categorySelector: {
    maxHeight: 40,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  categoryOptionTextActive: {
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
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
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
});