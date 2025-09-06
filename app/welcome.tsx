import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function Welcome() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const features = [
    {
      icon: "flash",
      title: "Lightning Fast",
      description: "Process sales instantly",
      gradient: ["#667EEA", "#764BA2"] as const,
    },
    {
      icon: "trending-up",
      title: "Smart Analytics",
      description: "Track your growth",
      gradient: ["#F093FB", "#F5576C"] as const,
    },
    {
      icon: "shield-checkmark",
      title: "Secure & Reliable",
      description: "Bank-level security",
      gradient: ["#4FACFE", "#00F2FE"] as const,
    },
  ];


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Background Elements */}
        <View style={styles.backgroundDecoration}>
          <LinearGradient
            colors={["#3B82F6", "#8B5CF6"]}
            style={styles.gradientCircle1}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={["#EC4899", "#F43F5E"]}
            style={styles.gradientCircle2}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={["#10B981", "#34D399"]}
            style={styles.gradientCircle3}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="cube" size={32} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.logoBadge}>
              <Text style={styles.badgeText}>PRO</Text>
            </View>
          </View>

          <Text style={styles.welcomeText}>WELCOME TO</Text>
          <Text style={styles.appName}>SwiftPOS</Text>
          <Text style={styles.tagline}>
            Transform your business with{"\n"}powerful inventory management
          </Text>
        </Animated.View>

        {/* Features Section */}
        <Animated.View 
          style={[
            styles.featuresSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    transform: [
                      {
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [index % 2 === 0 ? -30 : 30, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={feature.gradient}
                  style={styles.featureIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={feature.icon as any} size={18} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>


        {/* CTA Section */}
        <View style={styles.ctaSection}>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/(auth)/signup")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Start Free Trial</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.9}
            >
              <Ionicons name="log-in-outline" size={20} color="#111827" />
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => router.push("/(tabs)/dashboard")}
              activeOpacity={0.9}
            >
              <Ionicons name="play-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.demoButtonText}>Demo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  backgroundDecoration: {
    position: "absolute",
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  gradientCircle1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.06,
    top: -30,
    right: -30,
  },
  gradientCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.05,
    top: 150,
    left: -40,
  },
  gradientCircle3: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.04,
    bottom: 200,
    right: 20,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 12,
    position: "relative",
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logoBadge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  welcomeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "400",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  featuresSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  featuresGrid: {
    gap: 8,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Platform.OS === "android" ? "#E5E7EB" : "#F3F4F6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 3,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: "#6B7280",
  },
  spacer: {
    flex: 1,
  },
  ctaSection: {
    marginTop: 20,
  },
  offerBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  offerText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  primaryButton: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  demoButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  footerText: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    fontWeight: "400",
  },
});