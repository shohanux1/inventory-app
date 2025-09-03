import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { useCurrency } from "../contexts/CurrencyContext";
import { ReceiptData } from "../services/printer-expo";

interface ReceiptPreviewProps {
  receiptData: ReceiptData;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ receiptData }) => {
  const colorScheme = useColorScheme();
  const styles = createStyles();
  const { formatAmount } = useCurrency();

  // Debug log
  console.log('Receipt Data:', receiptData);

  if (!receiptData) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', padding: 20 }}>No receipt data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.receipt}>
        {/* Business Header */}
        <View style={styles.header}>
          <Text style={styles.businessName}>{receiptData.businessName}</Text>
          <Text style={styles.businessInfo}>{receiptData.businessAddress}</Text>
          <Text style={styles.businessInfo}>{receiptData.businessPhone}</Text>
          {receiptData.businessEmail && (
            <Text style={styles.businessInfo}>{receiptData.businessEmail}</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Receipt Info */}
        <View style={styles.receiptInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Receipt #:</Text>
            <Text style={styles.infoValue}>{receiptData.receiptNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{receiptData.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time:</Text>
            <Text style={styles.infoValue}>{receiptData.time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cashier:</Text>
            <Text style={styles.infoValue}>{receiptData.cashier}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Customer Info */}
        {receiptData.customerName && receiptData.customerName !== 'Walk-in Customer' && (
          <>
            <View style={styles.customerInfo}>
              <Text style={styles.sectionTitle}>CUSTOMER</Text>
              <Text style={styles.customerName}>{receiptData.customerName}</Text>
              {receiptData.customerPhone && (
                <Text style={styles.customerDetail}>{receiptData.customerPhone}</Text>
              )}
              {receiptData.customerEmail && (
                <Text style={styles.customerDetail}>{receiptData.customerEmail}</Text>
              )}
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>ITEMS</Text>
          
          {/* Item Header */}
          <View style={styles.itemHeader}>
            <Text style={[styles.itemHeaderText, styles.itemNameHeader]}>Item</Text>
            <Text style={[styles.itemHeaderText, styles.itemQtyHeader]}>Qty</Text>
            <Text style={[styles.itemHeaderText, styles.itemPriceHeader]}>Price</Text>
            <Text style={[styles.itemHeaderText, styles.itemTotalHeader]}>Total</Text>
          </View>

          {/* Items List */}
          {receiptData.items && receiptData.items.length > 0 ? (
            receiptData.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemNameContainer}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  {item.sku && <Text style={styles.itemSku}>SKU: {item.sku}</Text>}
                </View>
                <Text style={styles.itemQty}>{item.quantity}</Text>
                <Text style={styles.itemPrice}>{formatAmount(item.price)}</Text>
                <Text style={styles.itemTotal}>{formatAmount(item.total)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItems}>No items in receipt</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatAmount(receiptData.subtotal)}</Text>
          </View>
          {receiptData.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalValue}>{formatAmount(receiptData.tax)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{formatAmount(receiptData.total)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Payment Info */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method:</Text>
            <Text style={styles.paymentValue}>{receiptData.paymentMethod}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Received:</Text>
            <Text style={styles.paymentValue}>{formatAmount(receiptData.receivedAmount)}</Text>
          </View>
          {receiptData.changeAmount > 0 && (
            <View style={[styles.paymentRow, styles.changeRow]}>
              <Text style={styles.changeLabel}>CHANGE:</Text>
              <Text style={styles.changeValue}>{formatAmount(receiptData.changeAmount)}</Text>
            </View>
          )}
        </View>

        {/* Loyalty Points */}
        {receiptData.loyaltyPoints && receiptData.loyaltyPoints > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.loyaltySection}>
              <Text style={styles.loyaltyText}>
                Loyalty Points Earned: +{receiptData.loyaltyPoints}
              </Text>
            </View>
          </>
        )}

        {/* Footer */}
        {receiptData.footerMessage && (
          <>
            <View style={styles.divider} />
            <View style={styles.footer}>
              <Text style={styles.footerText}>{receiptData.footerMessage}</Text>
            </View>
          </>
        )}

        {/* Barcode */}
        {receiptData.barcode && (
          <View style={styles.barcodeSection}>
            <Text style={styles.barcode}>{receiptData.barcode}</Text>
          </View>
        )}

        <View style={styles.thankYou}>
          <Text style={styles.thankYouText}>Thank You!</Text>
          <Text style={styles.visitAgain}>Please visit again</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
  },
  receipt: {
    backgroundColor: "#FFFFFF",
    margin: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  businessInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  receiptInfo: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: "#666",
  },
  infoValue: {
    fontSize: 11,
    color: "#333",
    fontWeight: "500",
  },
  customerInfo: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  customerName: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    marginBottom: 2,
  },
  customerDetail: {
    fontSize: 11,
    color: "#666",
    marginBottom: 1,
  },
  itemsSection: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 8,
  },
  itemHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
  },
  itemNameHeader: {
    flex: 2,
  },
  itemQtyHeader: {
    width: 40,
    textAlign: "center",
  },
  itemPriceHeader: {
    width: 70,
    textAlign: "right",
  },
  itemTotalHeader: {
    width: 70,
    textAlign: "right",
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  itemNameContainer: {
    flex: 2,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 11,
    color: "#333",
    marginBottom: 2,
  },
  itemSku: {
    fontSize: 9,
    color: "#999",
  },
  itemQty: {
    width: 40,
    fontSize: 11,
    color: "#333",
    textAlign: "center",
  },
  itemPrice: {
    width: 70,
    fontSize: 11,
    color: "#333",
    textAlign: "right",
  },
  itemTotal: {
    width: 70,
    fontSize: 11,
    color: "#333",
    fontWeight: "500",
    textAlign: "right",
  },
  totalsSection: {
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: "#666",
  },
  totalValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  paymentSection: {
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 11,
    color: "#666",
  },
  paymentValue: {
    fontSize: 11,
    color: "#333",
    fontWeight: "500",
  },
  changeRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
  changeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4CAF50",
  },
  loyaltySection: {
    alignItems: "center",
    marginBottom: 8,
  },
  loyaltyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9800",
  },
  footer: {
    alignItems: "center",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  barcodeSection: {
    alignItems: "center",
    marginVertical: 12,
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
  },
  barcode: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#000",
    letterSpacing: 2,
  },
  thankYou: {
    alignItems: "center",
    marginTop: 16,
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  visitAgain: {
    fontSize: 12,
    color: "#666",
  },
  noItems: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    paddingVertical: 10,
    fontStyle: "italic",
  },
});