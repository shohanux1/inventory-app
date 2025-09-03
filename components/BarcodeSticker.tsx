import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../constants/Colors';
import { useCurrency } from '../contexts/CurrencyContext';

interface BarcodeStickerProps {
  product: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
  };
  size?: number;
  showPrice?: boolean;
  colors: typeof Colors.light;
}

export const BarcodeSticker: React.FC<BarcodeStickerProps> = ({
  product,
  size = 150,
  showPrice = true,
  colors,
}) => {
  const styles = createStyles(colors);
  const { formatAmount } = useCurrency();
  
  // Use barcode number or product ID as QR code data
  const qrData = product.barcode || product.sku || product.id;

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={size}
          backgroundColor="white"
          color="black"
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        
        {product.sku && (
          <Text style={styles.sku}>SKU: {product.sku}</Text>
        )}
        
        {product.barcode && (
          <Text style={styles.barcode}>{product.barcode}</Text>
        )}
        
        {showPrice && (
          <Text style={styles.price}>{formatAmount(product.price)}</Text>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  qrContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  infoContainer: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  sku: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  barcode: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
});