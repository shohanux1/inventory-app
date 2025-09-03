import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { useToast } from "../contexts/ToastContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { ReceiptData } from "../app/sell";
import { ReceiptPreview } from "./ReceiptPreview";

interface ReceiptSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  showNewSaleButton?: boolean;
  onNewSale?: () => void;
  title?: string;
  subtitle?: string;
}

export const ReceiptSuccessModal: React.FC<ReceiptSuccessModalProps> = ({
  visible,
  onClose,
  receiptData,
  showNewSaleButton = true,
  onNewSale,
  title = "Sale Completed!",
  subtitle,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const { formatAmount } = useCurrency();
  const [showPreview, setShowPreview] = useState(false);
  const { height: screenHeight } = Dimensions.get('window');

  const handlePrintReceipt = async () => {
    // Print functionality disabled for now - keeping the UI design
    showToast("Print feature coming soon", "info");
  };

  const handleNewSale = () => {
    if (onNewSale) {
      onNewSale();
    }
    onClose();
  };

  if (!receiptData) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
          
          {/* Success Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {subtitle || (receiptData ? `Transaction #${receiptData.receiptNumber}` : 'Transaction completed')}
          </Text>
          
          {/* Toggle between Summary and Preview */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !showPreview && styles.toggleButtonActive]}
              onPress={() => setShowPreview(false)}
            >
              <Text style={[styles.toggleText, !showPreview && styles.toggleTextActive]}>
                Summary
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, showPreview && styles.toggleButtonActive]}
              onPress={() => setShowPreview(true)}
            >
              <Text style={[styles.toggleText, showPreview && styles.toggleTextActive]}>
                Receipt Preview
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary or Receipt Preview */}
          {!showPreview ? (
            receiptData ? (
              <View style={styles.summary}>
                <View style={styles.row}>
                  <Text style={styles.label}>Total Amount:</Text>
                  <Text style={styles.value}>
                    {formatAmount(receiptData.total)}
                  </Text>
                </View>
                
                <View style={styles.row}>
                  <Text style={styles.label}>Payment:</Text>
                  <Text style={styles.value}>{receiptData.paymentMethod}</Text>
                </View>
                
                {receiptData.changeAmount && receiptData.changeAmount > 0 && (
                  <View style={[styles.row, styles.changeRow]}>
                    <Text style={styles.changeLabel}>Change Due:</Text>
                    <Text style={styles.changeValue}>
                      {formatAmount(receiptData.changeAmount)}
                    </Text>
                  </View>
                )}
                
                {receiptData.loyaltyPoints && receiptData.loyaltyPoints > 0 && (
                  <View style={styles.loyaltyRow}>
                    <Ionicons name="star" size={16} color={colors.warning} />
                    <Text style={styles.loyaltyText}>
                      +{receiptData.loyaltyPoints} loyalty points earned!
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.summary}>
                <Text style={styles.label}>Processing transaction...</Text>
              </View>
            )
          ) : (
            receiptData ? (
              <View style={styles.previewContainer}>
                <ScrollView style={{ maxHeight: screenHeight * 0.4 }}>
                  <ReceiptPreview receiptData={receiptData} />
              </ScrollView>
            </View>
            ) : (
              <View style={styles.summary}>
                <Text style={styles.label}>No receipt data available</Text>
              </View>
            )
          )}
          
          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.printButton}
              onPress={handlePrintReceipt}
            >
              <Ionicons name="print-outline" size={20} color="white" />
              <Text style={styles.printButtonText}>Print Receipt</Text>
            </TouchableOpacity>
            
            {showNewSaleButton && (
              <TouchableOpacity
                style={styles.newSaleButton}
                onPress={handleNewSale}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.newSaleButtonText}>New Sale</Text>
              </TouchableOpacity>
            )}
            
            {!showNewSaleButton && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={onClose}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  summary: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  changeRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: 0,
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  changeValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.success,
  },
  loyaltyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 6,
  },
  loyaltyText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warning,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  printButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  newSaleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  newSaleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  doneButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  toggleContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 16,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  previewContainer: {
    width: "100%",
    marginBottom: 24,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
});