import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    category: string;
    image?: string;
  };
  onPress: () => void;
  onEdit?: () => void;
  colors: typeof Colors.light;
}

export default function ProductCard({ product, onPress, onEdit, colors }: ProductCardProps) {
  const styles = createStyles(colors);
  
  const getStockStatus = () => {
    if (product.stock === 0) return { color: colors.error, text: 'Out of Stock' };
    if (product.stock < 10) return { color: colors.warning, text: 'Low Stock' };
    return { color: colors.success, text: 'In Stock' };
  };

  const stockStatus = getStockStatus();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.category}>{product.category}</Text>
        
        <View style={styles.bottomRow}>
          <View style={styles.priceSection}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            <Text style={styles.sku}>SKU: {product.sku}</Text>
          </View>
          
          <View style={[styles.stockBadge, { backgroundColor: `${stockStatus.color}15` }]}>
            <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
            <Text style={[styles.stockText, { color: stockStatus.color }]}>
              {product.stock} units
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 80,
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  moreButton: {
    marginLeft: 8,
    padding: 2,
  },
  category: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSection: {
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  sku: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '500',
  },
});