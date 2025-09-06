import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

export default function Splash() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Animation values
  const logoY = useRef(new Animated.Value(-50)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // State to track if minimum splash time has passed
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Main animation sequence
    Animated.parallel([
      // Logo slide and fade
      Animated.timing(logoY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Icon rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconRotate, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(iconRotate, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Text fade in after logo
    setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 400);

    // Line animation
    setTimeout(() => {
      Animated.timing(lineWidth, {
        toValue: 60,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }, 800);

    // Loading dots animation
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot1, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    setTimeout(animateDots, 1000);

    // Set minimum time elapsed after 3 seconds
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Navigate when both auth is loaded and minimum time has elapsed
  useEffect(() => {
    if (!isLoading && minTimeElapsed) {
      if (user) {
        // User is logged in, go to dashboard
        router.replace("/(tabs)/dashboard");
      } else {
        // User is not logged in, go to welcome
        router.replace("/welcome");
      }
    }
  }, [user, isLoading, minTimeElapsed]);

  const spin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* Minimalist geometric shapes */}
      <View style={styles.shapeContainer}>
        <View style={styles.shape1} />
        <View style={styles.shape2} />
        <View style={styles.shape3} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ translateY: logoY }],
              opacity: logoOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Animated.View
              style={{
                transform: [{ rotate: spin }],
              }}
            >
              <Ionicons name="cube" size={32} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* App Name */}
        <Animated.View
          style={[
            styles.textContainer,
            { opacity: textOpacity },
          ]}
        >
          <Text style={styles.appName}>SwiftPOS</Text>
          <Animated.View
            style={[
              styles.underline,
              { width: lineWidth },
            ]}
          />
          <Text style={styles.tagline}>Inventory Excellence</Text>
        </Animated.View>
      </View>

      {/* Loading dots */}
      <View style={styles.loadingContainer}>
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot1,
              transform: [
                {
                  scale: dot1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot2,
              transform: [
                {
                  scale: dot2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot3,
              transform: [
                {
                  scale: dot3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      {/* Bottom decoration */}
      <View style={styles.bottomDecoration}>
        <View style={styles.decorLine1} />
        <View style={styles.decorLine2} />
        <View style={styles.decorLine3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  shapeContainer: {
    position: "absolute",
    width: width,
    height: height,
  },
  shape1: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3B82F6",
    opacity: Platform.OS === "android" ? 0.03 : 0.05,
    top: 60,
    left: -30,
  },
  shape2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 30,
    backgroundColor: "#8B5CF6",
    opacity: Platform.OS === "android" ? 0.02 : 0.03,
    top: height * 0.4,
    right: -50,
    transform: [{ rotate: "45deg" }],
  },
  shape3: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#EC4899",
    opacity: Platform.OS === "android" ? 0.025 : 0.04,
    bottom: 100,
    left: 30,
    transform: [{ rotate: "15deg" }],
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  appName: {
    fontSize: Platform.OS === "android" ? 36 : 38,
    fontWeight: Platform.OS === "android" ? "400" : "300",
    color: "#111827",
    letterSpacing: Platform.OS === "android" ? 1.5 : 2,
    marginBottom: 8,
  },
  underline: {
    height: 2,
    backgroundColor: "#3B82F6",
    marginBottom: 12,
    borderRadius: 1,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  loadingContainer: {
    position: "absolute",
    bottom: height * 0.15,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: Platform.OS === "android" ? 6 : 8,
    height: Platform.OS === "android" ? 6 : 8,
    borderRadius: Platform.OS === "android" ? 3 : 4,
    backgroundColor: "#3B82F6",
  },
  bottomDecoration: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 4,
    paddingBottom: 20,
  },
  decorLine1: {
    width: 3,
    height: 20,
    backgroundColor: "#3B82F6",
    opacity: 0.2,
    borderRadius: 2,
  },
  decorLine2: {
    width: 3,
    height: 30,
    backgroundColor: "#8B5CF6",
    opacity: 0.15,
    borderRadius: 2,
  },
  decorLine3: {
    width: 3,
    height: 25,
    backgroundColor: "#EC4899",
    opacity: 0.1,
    borderRadius: 2,
  },
});