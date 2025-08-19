import React, { useState } from "react";
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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";

const CATEGORIES = ["Smartphones", "Laptops", "Tablets", "Accessories", "Wearables", "Other"];

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

  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minStock, setMinStock] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);

  const handleSave = () => {
    console.log("Save product:", {
      productName,
      sku,
      description,
      category,
      price,
      cost,
      quantity,
      minStock,
    });
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  const handleImagePick = () => {
    console.log("Pick image");
    // Implement image picker
  };

  const isFormValid = productName && sku && category && price && quantity;

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
            style={[styles.headerButton, !isFormValid && styles.disabledButton]}
            disabled={!isFormValid}
          >
            <Ionicons 
              name="checkmark" 
              size={24} 
              color={isFormValid ? colors.primary : colors.textMuted} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Section */}
          <TouchableOpacity style={styles.imageSection} onPress={handleImagePick}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={styles.productImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                <Text style={styles.imageText}>Add Product Image</Text>
              </View>
            )}
          </TouchableOpacity>

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

            <FormInput
              label="SKU"
              value={sku}
              onChangeText={setSku}
              placeholder="Enter SKU or barcode"
              required
              icon="barcode-outline"
              colors={colors}
            />

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
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  categoryContainer: {
    flexDirection: "row",
    maxHeight: 40,
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