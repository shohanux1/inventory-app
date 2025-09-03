import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { supabase, Product, Category } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";
import { ImageUpload, uploadProductImage } from "../components/ImageUpload";
import BarcodeScanner from "../components/BarcodeScanner";


interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address";
  multiline?: boolean;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  colors: typeof Colors.light;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  required = false,
  icon,
  colors,
}) => {
  const styles = createStyles(colors);

  return (
    <View style={styles.formGroup}>
      <View style={styles.labelContainer}>
        {icon && <Ionicons name={icon} size={16} color={colors.textSecondary} />}
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
};

export default function AddProduct() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { showToast } = useToast();

  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minStock, setMinStock] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        // Check if it's a table not found error
        if (error.code === 'PGRST205') {
          console.log('Categories table not found. Please run the database schema.');
          showToast('Database setup needed. Please run the SQL schema.', 'warning');
          // Set some default categories for UI
          setCategories([
            { id: '1', name: 'Electronics' },
            { id: '2', name: 'Clothing' },
            { id: '3', name: 'Food & Beverages' },
            { id: '4', name: 'Other' },
          ] as any);
          setIsLoading(false);
          return;
        }
        throw error;
      }
      
      // If no categories exist, create default ones
      if (!data || data.length === 0) {
        const defaultCategories = [
          { name: 'Electronics', description: 'Electronic devices and gadgets' },
          { name: 'Clothing', description: 'Apparel and fashion items' },
          { name: 'Food & Beverages', description: 'Food and drink items' },
          { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
          { name: 'Sports & Outdoors', description: 'Sporting goods and outdoor equipment' },
          { name: 'Other', description: 'Miscellaneous items' },
        ];
        
        const { data: newCategories, error: insertError } = await supabase
          .from('categories')
          .insert(defaultCategories)
          .select();
        
        if (insertError) throw insertError;
        setCategories(newCategories || []);
      } else {
        setCategories(data);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      showToast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isFormValid) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      // Upload image if exists
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadProductImage(selectedImage, sku, (error) => {
          showToast(error, 'error');
        });
      }

      // Create product object
      const newProduct: Partial<Product> = {
        name: productName.trim(),
        sku: sku.trim(),
        barcode: sku.trim(),
        description: description.trim() || undefined,
        category_id: selectedCategoryId || undefined,
        price: parseFloat(price),
        cost_price: cost ? parseFloat(cost) : undefined,
        stock_quantity: parseInt(quantity),
        min_stock_level: minStock ? parseInt(minStock) : 10,
        image_url: imageUrl || undefined,
      };

      // Insert product into Supabase
      const { error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (error) throw error;

      showToast('Product added successfully!', 'success');
      router.back();
    } catch (error: any) {
      console.error('Error saving product:', error);
      showToast(error.message || 'Failed to add product', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleScanBarcode = () => {
    setShowScanner(true);
  };

  const handleBarcodeScan = (data: string) => {
    // Set SKU to the scanned barcode value
    setSku(data);
    setShowScanner(false);
    showToast(`Barcode scanned: ${data}`, 'success');
  };

  const isFormValid = productName && sku && selectedCategoryId && price && quantity;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Product</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerButton, (!isFormValid || isSaving) && styles.disabledButton]}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons 
                name="checkmark" 
                size={24} 
                color={isFormValid ? colors.primary : colors.textMuted} 
              />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Section */}
          <View style={styles.imageSection}>
            <ImageUpload
              imageUrl={null}
              onImageSelected={setSelectedImage}
              productSku={sku}
              colors={colors}
              disabled={isSaving}
            />
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <FormInput
              label="Product Name"
              value={productName}
              onChangeText={setProductName}
              placeholder="Enter product name"
              required
              icon="pricetag-outline"
              colors={colors}
            />

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.label}>
                  SKU (Barcode)<Text style={styles.required}> *</Text>
                </Text>
              </View>
              <View style={styles.barcodeContainer}>
                <TextInput
                  style={[styles.input, styles.barcodeInput]}
                  value={sku}
                  onChangeText={setSku}
                  placeholder="Enter or scan barcode"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity 
                  style={styles.scanButton}
                  onPress={handleScanBarcode}
                >
                  <Ionicons name="scan" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <FormInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Product description (optional)"
              multiline
              icon="document-text-outline"
              colors={colors}
            />

            {/* Category Selector */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="grid-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.label}>
                  Category<Text style={styles.required}> *</Text>
                </Text>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ padding: 10 }} />
              ) : (
                <View style={styles.categoriesWrapper}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContainer}
                    bounces={false}
                  >
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          selectedCategoryId === cat.id && styles.categoryChipActive,
                        ]}
                        onPress={() => setSelectedCategoryId(cat.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            selectedCategoryId === cat.id && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FormInput
                  label="Selling Price"
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  required
                  icon="cash-outline"
                  colors={colors}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <FormInput
                  label="Cost Price"
                  value={cost}
                  onChangeText={setCost}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  icon="wallet-outline"
                  colors={colors}
                />
              </View>
            </View>
          </View>

          {/* Inventory */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FormInput
                  label="Initial Stock"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0"
                  keyboardType="numeric"
                  required
                  icon="cube-outline"
                  colors={colors}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <FormInput
                  label="Min Stock Level"
                  value={minStock}
                  onChangeText={setMinStock}
                  placeholder="0"
                  keyboardType="numeric"
                  icon="alert-circle-outline"
                  colors={colors}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleSave}
              disabled={!isFormValid}
            >
              <Text style={styles.primaryButtonText}>Save Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={handleCancel}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      
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
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    margin: 16,
    marginBottom: 0,
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    height: 160,
    borderRadius: 12,
    resizeMode: "cover",
  },
  imageText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textMuted,
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
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
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  barcodeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  categoriesWrapper: {
    marginTop: 8,
    marginHorizontal: -16, // Compensate for section padding
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight || colors.border,
    marginRight: 10,
    height: 36,
    justifyContent: "center",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted || colors.textSecondary,
    letterSpacing: 0.2,
  },
  categoryChipTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});