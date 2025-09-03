import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  imageUrl?: string | null;
  onImageSelected: (uri: string) => void;
  onImageUploaded?: (url: string) => void;
  productSku?: string;
  showUploadButton?: boolean;
  colors: typeof Colors.light;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  imageUrl,
  onImageSelected,
  onImageUploaded,
  productSku,
  showUploadButton = false,
  colors,
  disabled = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const styles = createStyles(colors);

  const pickImage = async () => {
    if (disabled) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      onImageSelected(uri);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage || !productSku) return null;

    try {
      setIsUploading(true);
      
      // Check if we're on iOS simulator (common issue with uploads)
      const isSimulator = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV;
      
      // Read the image as base64
      const base64 = await FileSystem.readAsStringAsync(selectedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert base64 to Uint8Array
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const fileName = `${productSku.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.jpg`;
      
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, byteArray, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (isSimulator) {
        console.log('Note: Image uploads may not work properly on iOS simulator');
      }

      if (onImageUploaded) {
        onImageUploaded(urlData.publicUrl);
      }

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const displayImage = selectedImage || imageUrl;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.imagePickerButton} 
        onPress={pickImage}
        disabled={disabled || isUploading}
      >
        {displayImage ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: displayImage }} 
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.imageOverlayText}>Change Image</Text>
            </View>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
            <Text style={styles.imagePlaceholderText}>Add Product Image</Text>
            <Text style={styles.imagePlaceholderSubtext}>Tap to select</Text>
          </View>
        )}
      </TouchableOpacity>

      {isUploading && (
        <View style={styles.uploadingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.uploadingText}>Uploading image...</Text>
        </View>
      )}

      {showUploadButton && selectedImage && !isUploading && (
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={uploadImage}
          disabled={disabled}
        >
          <Text style={styles.uploadButtonText}>Upload Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Export the upload function separately for use in parent components
export const uploadProductImage = async (
  imageUri: string, 
  productSku: string,
  onError?: (error: string) => void
): Promise<string | null> => {
  try {
    // Check if we're on iOS simulator (common issue with uploads)
    const isSimulator = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV;
    
    // Read the image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to Uint8Array
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    const fileName = `${productSku.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.jpg`;
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, byteArray, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      if (error.message?.includes('Network')) {
        onError?.('Network error. Please check your connection');
      } else if (error.message?.includes('not found')) {
        onError?.('Storage bucket not configured. Please run setup SQL');
      } else {
        onError?.(error.message);
      }
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    if (isSimulator) {
      console.log('Note: Image uploads may not work properly on iOS simulator');
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    onError?.(error.message || 'Failed to upload image');
    return null;
  }
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    width: '100%',
  },
  imagePickerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  imagePlaceholder: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 8,
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  uploadButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});