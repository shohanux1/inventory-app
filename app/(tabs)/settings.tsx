import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  SafeAreaView, 
  Platform 
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  colors: typeof Colors.light;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  toggle = false,
  toggleValue = false,
  onToggle,
  colors,
}) => {
  const styles = createStyles(colors);
  
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={toggle ? 1 : 0.7}
      disabled={toggle}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.border}
        />
      ) : showArrow ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
};

export default function Settings() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleLogout = () => {
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>JD</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>John Doe</Text>
              <Text style={styles.profileEmail}>john.doe@example.com</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Store Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Management</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="grid-outline"
              title="Categories"
              subtitle="Manage product categories"
              onPress={() => router.push("/categories")}
              colors={colors}
            />
            <SettingItem
              icon="people-outline"
              title="Customers"
              subtitle="Manage customer database"
              onPress={() => router.push("/customers")}
              colors={colors}
            />
            <SettingItem
              icon="pricetag-outline"
              title="Discounts & Offers"
              subtitle="Manage promotions"
              colors={colors}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              title="Personal Information"
              subtitle="Update your details"
              colors={colors}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Security"
              subtitle="Password and authentication"
              colors={colors}
            />
            <SettingItem
              icon="card-outline"
              title="Subscription"
              subtitle="Manage your plan"
              colors={colors}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Push and email alerts"
              toggle
              toggleValue={notifications}
              onToggle={setNotifications}
              colors={colors}
            />
            <SettingItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Toggle dark theme"
              toggle
              toggleValue={darkMode}
              onToggle={setDarkMode}
              colors={colors}
            />
            <SettingItem
              icon="language-outline"
              title="Language"
              subtitle="English (US)"
              colors={colors}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle-outline"
              title="Help Center"
              subtitle="Get help and support"
              colors={colors}
            />
            <SettingItem
              icon="chatbubble-outline"
              title="Contact Us"
              subtitle="Reach out to our team"
              colors={colors}
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms & Privacy"
              subtitle="Legal information"
              colors={colors}
            />
          </View>
        </View>

        {/* System Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="cloud-download-outline"
              title="Backup"
              subtitle="Backup your data"
              colors={colors}
            />
            <SettingItem
              icon="sync-outline"
              title="Sync"
              subtitle="Last synced 2 hours ago"
              colors={colors}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="Version 1.0.0"
              showArrow={false}
              colors={colors}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error + "30",
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.error,
  },
});