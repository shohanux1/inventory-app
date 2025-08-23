import ProductCard from "@/components/ProductCard";
import { SearchBarWithScanner } from "@/components/SearchBarWithScanner";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


// Sample data - replace with actual data from your backend
const SAMPLE_PRODUCTS = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    sku: "IPH-15PM-256",
    price: 1199.99,
    stock: 45,
    category: "Smartphones",
    image: undefined,
  },
  {
    id: "2",
    name: "MacBook Air M2",
    sku: "MB-AIR-M2-512",
    price: 1499.99,
    stock: 8,
    category: "Laptops",
    image: undefined,
  },
  {
    id: "3",
    name: "iPad Pro 12.9",
    sku: "735745809198",
    price: 1099.99,
    stock: 0,
    category: "Tablets",
    image: undefined,
  },
  {
    id: "4",
    name: "AirPods Pro 2",
    sku: "APP-PRO-2",
    price: 249.99,
    stock: 120,
    category: "Accessories",
    image: undefined,
  },
  {
    id: "5",
    name: "Apple Watch Series 9",
    sku: "AW-S9-45MM",
    price: 429.99,
    stock: 35,
    category: "Wearables",
    image: undefined,
  },
];

const CATEGORIES = ["All", "Smartphones", "Laptops", "Tablets", "Accessories", "Wearables"];

interface GridItemProps {
  product: typeof SAMPLE_PRODUCTS[0];
  onPress: () => void;
  colors: typeof Colors.light;
}

const GridItem: React.FC<GridItemProps> = ({ product, onPress, colors }) => {
  const styles = createStyles(colors);
  
  const getStockStatus = () => {
    if (product.stock === 0) return colors.error;
    if (product.stock < 10) return colors.warning;
    return colors.success;
  };

  const stockColor = getStockStatus();

  return (
    <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.gridImageContainer}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.gridImage} />
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
          <Text style={styles.gridPrice}>${product.price.toFixed(0)}</Text>
          <View style={styles.gridStockContainer}>
            <View style={[styles.gridStockDot, { backgroundColor: stockColor }]} />
            <Text style={styles.gridStock}>{product.stock}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  sortBy: string;
  onSelectSort: (sort: string) => void;
  colors: typeof Colors.light;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSelectSort,
  colors,
}) => {
  const styles = createStyles(colors);

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
            <View style={styles.filterOptions}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    selectedCategory === category && styles.filterChipActive,
                  ]}
                  onPress={() => onSelectCategory(category)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === category && styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              {["Name", "Price: Low to High", "Price: High to Low", "Stock"].map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={styles.sortOption}
                  onPress={() => onSelectSort(sort)}
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

export default function Products() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Name");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [products] = useState(SAMPLE_PRODUCTS);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof SAMPLE_PRODUCTS[0] | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "",
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "Name":
        return a.name.localeCompare(b.name);
      case "Price: Low to High":
        return a.price - b.price;
      case "Price: High to Low":
        return b.price - a.price;
      case "Stock":
        return b.stock - a.stock;
      default:
        return 0;
    }
  });

  const handleProductPress = (product: typeof SAMPLE_PRODUCTS[0]) => {
    router.push(`/product-details/${product.id}`);
  };

  const handleProductEdit = (product: typeof SAMPLE_PRODUCTS[0]) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    console.log("Save product edits:", editForm);
    // Here you would update the product in your backend/state
    setEditModalVisible(false);
    setSelectedProduct(null);
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setSelectedProduct(null);
    setEditForm({
      name: "",
      sku: "",
      price: "",
      stock: "",
      category: "",
    });
  };

  const handleAddProduct = () => {
    router.push("/add-product");
  };

  const handleBarcodeScan = (data: string) => {
    setShowScanner(false);
    setSearchQuery(data);
    // You can add logic here to search for product by barcode
    console.log("Scanned barcode:", data);
  };

  const ListHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Product Catalog</Text>
          <Text style={styles.subtitle}>{products.length} total products</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          >
            <Ionicons 
              name={viewMode === "grid" ? "grid" : "grid-outline"} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddProduct}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <SearchBarWithScanner
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onScanPress={() => setShowScanner(true)}
          onFilterPress={() => setFilterModalVisible(true)}
          placeholder="Search products or SKU..."
          showFilter={true}
        />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {sortedProducts.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="pricetag-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? "Try adjusting your search" : "Tap + to add your first product"}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        key={viewMode} // This forces re-render when view mode changes
        data={sortedProducts}
        keyExtractor={(item) => item.id}
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
        ListHeaderComponent={ListHeader}
        contentContainerStyle={viewMode === "list" ? styles.listContent : styles.gridContainer}
        showsVerticalScrollIndicator={false}
        numColumns={viewMode === "grid" ? 2 : 1}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        sortBy={sortBy}
        onSelectSort={setSortBy}
        colors={colors}
      />

      {/* Edit Product Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Product</Text>
              <TouchableOpacity onPress={handleCancelEdit}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.editForm}>
                <View style={styles.formGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>Product Name</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm({...editForm, name: text})}
                    placeholder="Enter product name"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="barcode-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>SKU</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.sku}
                    onChangeText={(text) => setEditForm({...editForm, sku: text})}
                    placeholder="Enter SKU"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.formLabel}>Price</Text>
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
                      <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.formLabel}>Stock</Text>
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
                </View>

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
                    {CATEGORIES.filter(cat => cat !== "All").map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryOption,
                          editForm.category === cat && styles.categoryOptionActive,
                        ]}
                        onPress={() => setEditForm({...editForm, category: cat})}
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            editForm.category === cat && styles.categoryOptionTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
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
  categoriesContainer: {
    maxHeight: 40,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingBottom: 20,
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
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
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
  // Grid View Styles
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  gridItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    width: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  gridImageContainer: {
    height: 100,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    padding: 12,
  },
  gridName: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  gridSku: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 8,
  },
  gridFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
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
  // Edit Modal Styles
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
    paddingVertical: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  categorySelector: {
    maxHeight: 40,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
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
});