import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Product } from '../contexts/ProductContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onEdit?: () => void;
  colors: typeof Colors.light;
}

export default function ProductCard({ product, onPress, onEdit, colors }: ProductCardProps) {
  const styles = createStyles(colors);
  const { formatAmount } = useCurrency();
  
  const getStockStatus = () => {
    const stock = product.stock_quantity || 0;
    if (stock === 0) return { color: colors.error, text: 'Out of Stock' };
    if (stock < 10) return { color: colors.warning, text: 'Low Stock' };
    return { color: colors.success, text: 'In Stock' };
  };

  const stockStatus = getStockStatus();
  const categoryName = product.categories?.name || product.category || 'Uncategorized';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.sku}>SKU: {product.sku}</Text>
          </View>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.editButton}>
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatAmount(product.price)}</Text>
            <Text style={styles.category}>{categoryName}</Text>
          </View>
          
          <View style={styles.stockInfo}>
            <View style={[styles.stockIndicator, { backgroundColor: stockStatus.color }]} />
            <Text style={styles.stockText}>{product.stock_quantity || 0} in stock</Text>
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
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  imageContainer: {
    width: 72,
    height: 72,
    backgroundColor: colors.background,
    margin: 12,
    borderRadius: 10,
    overflow: 'hidden',
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
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 3,
  },
  sku: {
    fontSize: 12,
    color: colors.textMuted,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  category: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
});