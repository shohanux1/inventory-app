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

export default function Terms() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By downloading, installing, or using MyPOS, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application."
    },
    {
      title: "2. Use License",
      content: "We grant you a limited, non-exclusive, non-transferable license to use MyPOS for your business inventory and sales management needs, subject to these Terms of Service."
    },
    {
      title: "3. User Accounts",
      content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account."
    },
    {
      title: "4. Acceptable Use",
      content: "You agree to use MyPOS only for lawful purposes and in accordance with these Terms. You may not use the app in any way that violates applicable laws or regulations."
    },
    {
      title: "5. Data and Privacy",
      content: "Your use of MyPOS is also governed by our Privacy Policy. You retain ownership of your business data, and we will not access it except as necessary to provide the service or as required by law."
    },
    {
      title: "6. Service Availability",
      content: "While we strive to provide uninterrupted service, we do not guarantee that MyPOS will be available at all times. We may perform maintenance or updates that could temporarily affect availability."
    },
    {
      title: "7. Intellectual Property",
      content: "MyPOS and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws."
    },
    {
      title: "8. Limitation of Liability",
      content: "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of MyPOS."
    },
    {
      title: "9. Modifications to Terms",
      content: "We reserve the right to modify these Terms at any time. We will notify users of any material changes through the app or via email."
    },
    {
      title: "10. Termination",
      content: "We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or us."
    },
    {
      title: "11. Governing Law",
      content: "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company is registered, without regard to conflict of law provisions."
    },
    {
      title: "12. Contact Information",
      content: "For questions about these Terms of Service, please contact us at legal@myposapp.com or through the support section in the app."
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>Effective Date: January 1, 2025</Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.introText}>
            These Terms of Service ("Terms") govern your use of the MyPOS application ("Service") operated by MyPOS Inc. ("we", "us", or "our").
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
            By using MyPOS, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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