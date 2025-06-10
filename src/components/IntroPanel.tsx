import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

interface IntroPanelProps {
  appName: string;
  onContinue: () => void;
  hasAcceptedPrivacy?: boolean; // New prop to track privacy policy status
}

const IntroPanel = ({
  appName,
  onContinue,
  hasAcceptedPrivacy = false, // Default to false if not provided
}: IntroPanelProps) => {
  const { colors } = useTheme();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Animation state
  const [animationComplete, setAnimationComplete] = useState(false);

  // Run animation on mount
  useEffect(() => {
    // Add small delay to prevent race conditions
    const animationTimeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimationComplete(true);
      });
    }, 100);

    return () => clearTimeout(animationTimeout);
  }, [fadeAnim, scaleAnim]);

  // Determine the button text based on privacy status
  const buttonText = hasAcceptedPrivacy ? "Continue" : "Privacy Policy";
  const buttonIcon = hasAcceptedPrivacy ? "arrow-forward" : "document-text";

  return (
    <Animated.View
      style={[
        styles(colors).content,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Logo */}
      <View style={styles(colors).logoContainer}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles(colors).logo}
          resizeMode="contain"
        />
      </View>

      {/* App Name */}
      <Text style={styles(colors).appName}>{appName}</Text>

      {/* Tagline */}
      <Text style={styles(colors).tagline}>
        Enter two films to see actors that appear in both, or enter two actors
        to see a list of films they share
      </Text>

      {/* Show button after animation completes */}
      {animationComplete && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={styles(colors).getStartedButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles(colors).getStartedText}>{buttonText}</Text>
            <Ionicons
              name={buttonIcon}
              size={18}
              color="#FFFFFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Loading dots only show before animation completes */}
      {!animationComplete && (
        <View style={styles(colors).loadingDotsContainer}>
          <Animated.View
            style={[styles(colors).loadingDot, { opacity: fadeAnim }]}
          />
          <Animated.View
            style={[
              styles(colors).loadingDot,
              { opacity: fadeAnim, marginHorizontal: 8 },
            ]}
          />
          <Animated.View
            style={[styles(colors).loadingDot, { opacity: fadeAnim }]}
          />
        </View>
      )}
    </Animated.View>
  );
};

// Styles remain unchanged
const styles = (colors: any) =>
  StyleSheet.create({
    content: {
      width: "80%",
      alignItems: "center",
    },
    logoContainer: {
      width: 150,
      height: 150,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
      borderRadius: 10,
      backgroundColor: "transparent",
    },
    logo: {
      width: 140,
      height: 140,
    },
    appName: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    tagline: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
      textAlign: "center",
    },
    loadingDotsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 24,
    },
    loadingDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    getStartedButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 32,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
    getStartedText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default IntroPanel;
