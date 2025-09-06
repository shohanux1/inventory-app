import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";

interface SupportItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  colors: typeof Colors.light;
}

const SupportItem: React.FC<SupportItemProps> = ({ icon, title, description, onPress, colors }) => {
  const styles = createStyles(colors);
  return (
    <TouchableOpacity style={styles.supportItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

interface FAQItemProps {
  question: string;
  answer: string;
  colors: typeof Colors.light;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, colors }) => {
  const styles = createStyles(colors);
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity 
      style={styles.faqItem} 
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={18} 
          color={colors.textSecondary} 
        />
      </View>
      {expanded && (
        <Text style={styles.faqAnswer}>{answer}</Text>
      )}
    </TouchableOpacity>
  );
};

export default function Support() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const handleEmailSupport = () => {
    Linking.openURL("mailto:support@myposapp.com?subject=Support Request");
  };

  const handleCallSupport = () => {
    Linking.openURL("tel:+1234567890");
  };

  const faqs = [
    {
      question: "How do I add a new product?",
      answer: "Navigate to the Products tab and tap the '+' button, or use the 'Add Product' quick action from the Dashboard. Fill in the product details and tap Save."
    },
    {
      question: "How do I track inventory?",
      answer: "The Inventory tab shows all stock movements. You can use Stock In/Out from the Dashboard for quick adjustments, or adjust stock directly from product details."
    },
    {
      question: "Can I export sales reports?",
      answer: "Yes, go to Sales History and tap the export button to download your sales data in CSV format."
    },
    {
      question: "How do I change the currency?",
      answer: "Go to Settings > General > Currency and select your preferred currency from the list."
    },
    {
      question: "Is my data backed up?",
      answer: "Your data is automatically synced to the cloud when you're connected to the internet. You can see the last sync time in the app."
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Support Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.supportGrid}>
            <SupportItem
              icon="mail-outline"
              title="Email Support"
              description="Get help via email"
              onPress={handleEmailSupport}
              colors={colors}
            />
            <SupportItem
              icon="call-outline"
              title="Call Support"
              description="Talk to our team"
              onPress={handleCallSupport}
              colors={colors}
            />
            <SupportItem
              icon="chatbubbles-outline"
              title="Live Chat"
              description="Chat with support"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                colors={colors}
              />
            ))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.contactText}>support@myposapp.com</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.contactText}>+1 (234) 567-890</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.contactText}>Mon-Fri, 9AM-6PM EST</Text>
            </View>
          </View>
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
  section: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  supportGrid: {
    gap: 12,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  faqContainer: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: colors.text,
  },
});