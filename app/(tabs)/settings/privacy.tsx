import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";

export default function Privacy() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const sections = [
    {
      title: "Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, add products, record sales, or contact us for support. This includes your name, email address, business information, and inventory data."
    },
    {
      title: "How We Use Your Information",
      content: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions."
    },
    {
      title: "Data Storage",
      content: "Your data is securely stored in encrypted cloud databases. We use industry-standard security measures to protect your information from unauthorized access, disclosure, alteration, or destruction."
    },
    {
      title: "Data Sharing",
      content: "We do not sell, trade, or otherwise transfer your personal information to third parties. We may share your information only to comply with legal obligations or protect our rights."
    },
    {
      title: "Your Rights",
      content: "You have the right to access, update, or delete your personal information at any time. You can export your data or request account deletion through the app settings."
    },
    {
      title: "Analytics",
      content: "We may collect anonymous usage data to improve our app's performance and user experience. This data does not personally identify you and is used solely for analytical purposes."
    },
    {
      title: "Updates to This Policy",
      content: "We may update our Privacy Policy from time to time. We will notify you of any changes by updating the 'Last Updated' date and sending you a notification through the app."
    },
    {
      title: "Contact Us",
      content: "If you have any questions about this Privacy Policy, please contact us at privacy@myposapp.com or through the support section in the app."
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>Last Updated: January 1, 2025</Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.introText}>
            Your privacy is important to us. This Privacy Policy explains how MyPOS collects, uses, and protects your information when you use our application.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using MyPOS, you agree to the collection and use of information in accordance with this policy.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 20,
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
  content: {
    flex: 1,
  },
  lastUpdated: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  intro: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    fontStyle: "italic",
  },
});