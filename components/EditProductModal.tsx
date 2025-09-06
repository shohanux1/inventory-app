import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useCurrency } from '../contexts/CurrencyContext';
import { Product, useProducts } from '../contexts/ProductContext';
import { useToast } from '../contexts/ToastContext';
import { uploadProductImage } from './ImageUpload';

interface EditProductModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
  colors: typeof Colors.light;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ 
  visible, 
  product, 
  onClose, 
  onSuccess,
  colors 
}) => {
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const { updateProduct, categories } = useProducts();
  const { currency } = useCurrency();
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

  useEffect(() => {
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showToast('Permission to access media library is required', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

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
      onSuccess?.();
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
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color={isLoading ? colors.textMuted : colors.text} />
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
                  editable={!isLoading}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="barcode-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>SKU *</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.sku}
                    onChangeText={(text) => setEditForm({...editForm, sku: text})}
                    placeholder="SKU"
                    placeholderTextColor={colors.textMuted}
                    editable={!isLoading}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="qr-code-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>Barcode</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.barcode}
                    onChangeText={(text) => setEditForm({...editForm, barcode: text})}
                    placeholder="Barcode"
                    placeholderTextColor={colors.textMuted}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.formLabel}>Description</Text>
                </View>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={editForm.description}
                  onChangeText={(text) => setEditForm({...editForm, description: text})}
                  placeholder="Product description"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  editable={!isLoading}
                />
              </View>

              {/* Pricing & Stock */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pricing & Stock</Text>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>Price *</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.price}
                    onChangeText={(text) => setEditForm({...editForm, price: text})}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    editable={!isLoading}
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
                    editable={!isLoading}
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
                    keyboardType="number-pad"
                    editable={!isLoading}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.formLabel}>Min Stock Level</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.minStock}
                    onChangeText={(text) => setEditForm({...editForm, minStock: text})}
                    placeholder="10"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Category Selection */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="grid-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.formLabel}>Category</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categorySelector}>
                    {categories.filter(cat => cat.name !== "All").map((category) => (
                      <TouchableOpacity
                        key={category.id || category.name}
                        style={[
                          styles.categoryOption,
                          editForm.categoryId === category.id && styles.categoryOptionActive
                        ]}
                        onPress={() => setEditForm({
                          ...editForm, 
                          categoryId: category.id || '', 
                          category: category.name
                        })}
                        disabled={isLoading}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          editForm.categoryId === category.id && styles.categoryOptionTextActive
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Product Image */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Product Image</Text>
              </View>

              <TouchableOpacity 
                style={styles.imageUploadArea} 
                onPress={pickImage}
                disabled={isLoading}
              >
                {selectedImage || editForm.imageUrl ? (
                  <Image 
                    source={{ uri: selectedImage || editForm.imageUrl }} 
                    style={styles.uploadedImage}
                  />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={32} color={colors.textMuted} />
                    <Text style={styles.uploadText}>Tap to upload image</Text>
                    <Text style={styles.uploadHint}>JPG, PNG up to 5MB</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
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

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  editForm: {
    padding: 20,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  imageUploadArea: {
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});