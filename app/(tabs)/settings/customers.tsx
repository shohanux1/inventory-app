import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  Modal,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { useCustomers, Customer } from "../../../contexts/CustomerContext";
import { useToast } from "../../../contexts/ToastContext";

export default function Customers() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const { showToast } = useToast();
  
  // Customer context
  const {
    customers,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filteredCustomers,
    totalCustomers,
    totalLoyaltyPoints,
    activeCustomers,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers();
  
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCustomers();
    setIsRefreshing(false);
  };

  const handleCustomerPress = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };

  const handleAddCustomer = async () => {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      showToast("Name and phone are required", "warning");
      return;
    }

    setIsSubmitting(true);
    const newCustomer = await createCustomer({
      ...customerForm,
      loyalty_enabled: loyaltyEnabled,
      email_updates: emailUpdates,
      sms_notifications: smsNotifications,
    });

    if (newCustomer) {
      setShowAddModal(false);
      setCustomerForm({ name: "", email: "", phone: "", address: "", notes: "" });
      setLoyaltyEnabled(true);
      setEmailUpdates(true);
      setSmsNotifications(false);
    }
    setIsSubmitting(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading && customers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customers</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === "all" && styles.filterTabActive]}
            onPress={() => setFilterStatus("all")}
          >
            <Text style={[styles.filterText, filterStatus === "all" && styles.filterTextActive]}>
              All ({totalCustomers})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === "active" && styles.filterTabActive]}
            onPress={() => setFilterStatus("active")}
          >
            <Text style={[styles.filterText, filterStatus === "active" && styles.filterTextActive]}>
              Active ({activeCustomers})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === "inactive" && styles.filterTabActive]}
            onPress={() => setFilterStatus("inactive")}
          >
            <Text style={[styles.filterText, filterStatus === "inactive" && styles.filterTextActive]}>
              Inactive ({totalCustomers - activeCustomers})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={styles.statValue}>{totalCustomers}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={20} color={colors.warning} />
          <Text style={styles.statValue}>{totalLoyaltyPoints}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={20} color={colors.success} />
          <Text style={styles.statValue}>{activeCustomers}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Customer List */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filteredCustomers.map((customer) => (
          <TouchableOpacity
            key={customer.id}
            style={styles.customerCard}
            onPress={() => handleCustomerPress(customer)}
            activeOpacity={0.7}
          >
            <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>{getInitials(customer.name)}</Text>
            </View>
            
            <View style={styles.customerInfo}>
              <View style={styles.customerHeader}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <View style={[
                  styles.statusBadge,
                  customer.status === "active" ? styles.statusActive : styles.statusInactive
                ]}>
                  <Text style={[
                    styles.statusText,
                    customer.status === "active" ? styles.statusTextActive : styles.statusTextInactive
                  ]}>
                    {customer.status}
                  </Text>
                </View>
              </View>
              {customer.email && <Text style={styles.customerContact}>{customer.email}</Text>}
              <Text style={styles.customerContact}>{customer.phone}</Text>
              
              <View style={styles.customerStats}>
                <View style={styles.statItem}>
                  <Ionicons name="cart-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.statItemText}>{customer.total_purchases} orders</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="star-outline" size={14} color={colors.warning} />
                  <Text style={styles.statItemText}>{customer.loyalty_points} pts</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.statItemText}>{formatDate(customer.created_at)}</Text>
                </View>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}

        {filteredCustomers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? "Try a different search term" : "Add your first customer to get started"}
            </Text>
          </View>
        )}
        
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal
        visible={showCustomerDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomerDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              <TouchableOpacity onPress={() => setShowCustomerDetail(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedCustomer && (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarText}>
                      {getInitials(selectedCustomer.name)}
                    </Text>
                  </View>
                  <Text style={styles.detailName}>{selectedCustomer.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    selectedCustomer.status === "active" ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      selectedCustomer.status === "active" ? styles.statusTextActive : styles.statusTextInactive
                    ]}>
                      {selectedCustomer.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Contact Information</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{selectedCustomer.email || 'Not provided'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{selectedCustomer.phone}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Statistics</Text>
                  <View style={styles.detailStatsGrid}>
                    <View style={styles.detailStatCard}>
                      <Text style={styles.detailStatValue}>{selectedCustomer.total_purchases}</Text>
                      <Text style={styles.detailStatLabel}>Total Orders</Text>
                    </View>
                    <View style={styles.detailStatCard}>
                      <Text style={styles.detailStatValue}>{selectedCustomer.loyalty_points}</Text>
                      <Text style={styles.detailStatLabel}>Loyalty Points</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Member Since</Text>
                  <Text style={styles.detailText}>{formatDate(selectedCustomer.created_at)}</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="mail-outline" size={20} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="call-outline" size={20} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                {/* Basic Information */}
                <View style={styles.formGroup}>
                  <Text style={styles.formSectionTitle}>Basic Information</Text>
                  
                  <View style={styles.inputWrapper}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.inputLabel}>
                        Full Name<Text style={styles.required}> *</Text>
                      </Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter customer name"
                      placeholderTextColor={colors.textMuted}
                      value={customerForm.name}
                      onChangeText={(text) => setCustomerForm({...customerForm, name: text})}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.inputLabel}>Email Address</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter email address"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={customerForm.email}
                      onChangeText={(text) => setCustomerForm({...customerForm, email: text})}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.inputLabel}>
                        Phone Number<Text style={styles.required}> *</Text>
                      </Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter phone number"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      value={customerForm.phone}
                      onChangeText={(text) => setCustomerForm({...customerForm, phone: text})}
                    />
                  </View>
                </View>

                {/* Additional Information */}
                <View style={styles.formGroup}>
                  <Text style={styles.formSectionTitle}>Additional Information</Text>
                  
                  <View style={styles.inputWrapper}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.inputLabel}>Address</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter address"
                      placeholderTextColor={colors.textMuted}
                      value={customerForm.address}
                      onChangeText={(text) => setCustomerForm({...customerForm, address: text})}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.inputLabel}>Notes</Text>
                    </View>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Add notes about this customer"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      value={customerForm.notes}
                      onChangeText={(text) => setCustomerForm({...customerForm, notes: text})}
                    />
                  </View>
                </View>

                {/* Marketing Preferences */}
                <View style={styles.formGroup}>
                  <Text style={styles.formSectionTitle}>Marketing Preferences</Text>
                  
                  <View style={styles.preferenceCard}>
                    <View style={styles.preferenceIcon}>
                      <Ionicons name="star" size={18} color={colors.warning} />
                    </View>
                    <View style={styles.preferenceContent}>
                      <Text style={styles.preferenceTitle}>Loyalty Program</Text>
                      <Text style={styles.preferenceSubtitle}>Earn 1 point per $10 spent</Text>
                    </View>
                    <Switch
                      value={loyaltyEnabled}
                      onValueChange={setLoyaltyEnabled}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                  
                  <View style={styles.preferenceCard}>
                    <View style={styles.preferenceIcon}>
                      <Ionicons name="mail" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.preferenceContent}>
                      <Text style={styles.preferenceTitle}>Email Updates</Text>
                      <Text style={styles.preferenceSubtitle}>Receive offers and news</Text>
                    </View>
                    <Switch
                      value={emailUpdates}
                      onValueChange={setEmailUpdates}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                  
                  <View style={styles.preferenceCard}>
                    <View style={styles.preferenceIcon}>
                      <Ionicons name="chatbubble" size={18} color={colors.success} />
                    </View>
                    <View style={styles.preferenceContent}>
                      <Text style={styles.preferenceTitle}>SMS Notifications</Text>
                      <Text style={styles.preferenceSubtitle}>Order updates via SMS</Text>
                    </View>
                    <Switch
                      value={smsNotifications}
                      onValueChange={setSmsNotifications}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.formActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setCustomerForm({ name: "", email: "", phone: "", address: "", notes: "" });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleAddCustomer}
                disabled={isSubmitting}
              >
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? "Adding..." : "Add Customer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  filterContainer: {
    marginBottom: 4,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "white",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: `${colors.success}15`,
  },
  statusInactive: {
    backgroundColor: `${colors.textMuted}15`,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  statusTextActive: {
    color: colors.success,
  },
  statusTextInactive: {
    color: colors.textMuted,
  },
  customerContact: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  customerStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statItemText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
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
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  detailHeader: {
    alignItems: "center",
    padding: 20,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  detailAvatarText: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.primary,
  },
  detailName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  detailSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
  },
  detailStatsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  detailStatCard: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  detailStatValue: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  detailStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  // Add Customer Modal Styles
  addModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "90%",
  },
  formSection: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
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
  preferenceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  preferenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    padding: 14,
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
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
});