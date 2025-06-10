import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

interface UnifiedSplashScreenProps {
  isVisible: boolean;
  onFinish: () => void;
  appName?: string;
  androidUrl?: string;
  androidTestersGroupUrl?: string;
  iosUrl?: string;
}

type SplashStep =
  | "splash"
  | "privacy"
  | "install-options"
  | "android-flow-step2";

const UnifiedSplashScreen = ({
  isVisible,
  onFinish,
  appName = "Actor Matches",
  androidUrl = "https://play.google.com/apps/testing/com.drew92.actormatches",
  androidTestersGroupUrl = "https://groups.google.com/g/i-am-db-testers",
  iosUrl = "https://testflight.apple.com/join/9rHGtzmn",
}: UnifiedSplashScreenProps) => {
  const { colors } = useTheme();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // State
  const [currentStep, setCurrentStep] = useState<SplashStep>("splash");
  const [animationComplete, setAnimationComplete] = useState(false);

  // Run splash animation when component is visible
  useEffect(() => {
    if (isVisible && currentStep === "splash") {
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
    }
  }, [isVisible, currentStep, fadeAnim, scaleAnim]);

  // Navigate from splash to privacy policy
  const handleGetStarted = () => {
    setCurrentStep("privacy");
  };

  // Handle privacy policy acceptance
  const handlePrivacyAccept = () => {
    // If on mobile, go directly to app
    if (Platform.OS !== "web") {
      onFinish();
    } else {
      // On web, offer app installation
      setCurrentStep("install-options");
    }
  };

  // Handle Android installation flow
  const handleAndroidFlow = () => {
    // Open the testers group link
    Linking.openURL(androidTestersGroupUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    setCurrentStep("android-flow-step2");
  };

  // Confirm Android installation flow
  const handleAndroidConfirm = () => {
    // After joining group, open the app link
    Linking.openURL(androidUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    onFinish();
  };

  // Handle iOS installation
  const handleIOSDownload = () => {
    Linking.openURL(iosUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    onFinish();
  };

  // Skip installation and use web version
  const handleSkipInstall = () => {
    onFinish();
  };

  // If not visible, don't render anything
  if (!isVisible) {
    return null;
  }

  // Render splash screen
  if (currentStep === "splash") {
    return (
      <Modal visible={true} transparent={false} animationType="fade">
        <View style={styles(colors).container}>
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
              Enter two films to see actors that appear in both, or enter two
              actors to see a list of films they share
            </Text>

            {/* Show button after animation completes */}
            {animationComplete && (
              <Animated.View style={{ opacity: fadeAnim }}>
                <TouchableOpacity
                  style={styles(colors).getStartedButton}
                  onPress={handleGetStarted}
                  activeOpacity={0.8}
                >
                  <Text style={styles(colors).getStartedText}>Continue</Text>
                  <Ionicons
                    name="arrow-forward"
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
        </View>
      </Modal>
    );
  }

  // Render privacy policy screen
  if (currentStep === "privacy") {
    return (
      <Modal visible={true} transparent={false} animationType="fade">
        <View style={styles(colors).container}>
          <View style={styles(colors).privacyContainer}>
            <View style={styles(colors).modalHeader}>
              <Text style={styles(colors).modalTitle}>Privacy Policy</Text>
            </View>

            <ScrollView
              style={styles(colors).scrollContent}
              contentContainerStyle={styles(colors).contentContainer}
            >
              <Text style={styles(colors).lastUpdated}>
                Last Updated: June 10, 2025
              </Text>

              <Text style={styles(colors).sectionTitle}>Introduction</Text>
              <Text style={styles(colors).paragraph}>
                Thank you for using {appName}. This Privacy Policy explains how
                we handle your information when you use our application.
              </Text>

              <Text style={styles(colors).sectionTitle}>
                No Data Collection
              </Text>
              <Text style={styles(colors).paragraph}>
                {appName} does not collect any personal information or usage
                data from you. All your interactions with the app remain
                private.
              </Text>

              <Text style={styles(colors).sectionTitle}>
                Third-Party Services
              </Text>
              <Text style={styles(colors).paragraph}>
                Our application uses The Movie Database (TMDb) API to provide
                film and actor information. When you search for content within
                our app, these queries are sent to TMDb's servers according to
                their API terms. Please refer to TMDb's privacy policy for
                information on how they handle this data.
              </Text>

              <Text style={styles(colors).sectionTitle}>Local Storage</Text>
              <Text style={styles(colors).paragraph}>
                Any search history or preferences are stored locally on your
                device to improve your experience. This data stays on your
                device and is not transmitted to our servers or any third
                parties (except for the actual search queries to TMDb as
                mentioned above).
              </Text>

              <Text style={styles(colors).sectionTitle}>
                Children's Privacy
              </Text>
              <Text style={styles(colors).paragraph}>
                Our service is not intended for anyone under the age of 13.
              </Text>

              <Text style={styles(colors).sectionTitle}>
                Changes to This Privacy Policy
              </Text>
              <Text style={styles(colors).paragraph}>
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last Updated" date.
              </Text>

              <Text style={styles(colors).sectionTitle}>Contact Us</Text>
              <Text style={styles(colors).paragraph}>
                If you have any questions about this Privacy Policy, please
                contact us at:
              </Text>
              <Text style={styles(colors).contactInfo}>
                andrewjovaras@gmail.com
              </Text>

              <View style={styles(colors).actionButtonsContainer}>
                <TouchableOpacity
                  style={styles(colors).acceptButton}
                  onPress={handlePrivacyAccept}
                >
                  <Text style={styles(colors).acceptButtonText}>I Accept</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  // Render installation options for web users
  if (currentStep === "install-options") {
    return (
      <Modal visible={true} transparent={false} animationType="fade">
        <View style={styles(colors).container}>
          <View style={styles(colors).installContainer}>
            <View style={styles(colors).modalHeader}>
              <Text style={styles(colors).modalTitle}>Get the App</Text>
            </View>

            <View style={styles(colors).installContent}>
              <Text style={styles(colors).installDescription}>
                Experience {appName} on your mobile device for the best
                experience.
              </Text>

              <View style={styles(colors).buttonsContainer}>
                <TouchableOpacity
                  style={[
                    styles(colors).appButton,
                    styles(colors).androidButton,
                  ]}
                  onPress={handleAndroidFlow}
                >
                  <Ionicons
                    name="logo-google-playstore"
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles(colors).buttonText}>Android</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles(colors).appButton, styles(colors).iosButton]}
                  onPress={handleIOSDownload}
                >
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                  <Text style={styles(colors).buttonText}>iOS</Text>
                </TouchableOpacity>
              </View>

              <View style={styles(colors).noteContainer}>
                <Text style={styles(colors).noteText}>
                  <Text style={styles(colors).noteBold}>Android users:</Text>{" "}
                  You'll need to join our testers group first, then download the
                  app.
                </Text>
                <Text style={styles(colors).noteText}>
                  <Text style={styles(colors).noteBold}>iOS users:</Text> You'll
                  be directed to TestFlight to download the app.
                </Text>
              </View>

              <TouchableOpacity
                style={styles(colors).skipButton}
                onPress={handleSkipInstall}
              >
                <Text style={styles(colors).skipButtonText}>
                  Continue to Web Version
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Render Android installation confirmation
  if (currentStep === "android-flow-step2") {
    return (
      <Modal visible={true} transparent={false} animationType="fade">
        <View style={styles(colors).container}>
          <View style={styles(colors).confirmContainer}>
            <Ionicons
              name="checkmark-circle"
              size={50}
              color="#3DDC84"
              style={styles(colors).confirmIcon}
            />

            <Text style={styles(colors).confirmTitle}>
              Join the Testers Group
            </Text>

            <Text style={styles(colors).confirmDescription}>
              After joining the Google Group, you can download the app. Have you
              completed this step?
            </Text>

            <View style={styles(colors).confirmButtonsContainer}>
              <TouchableOpacity
                style={styles(colors).confirmButton}
                onPress={handleAndroidConfirm}
              >
                <Text style={styles(colors).confirmButtonText}>
                  Yes, download the app
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles(colors).secondaryButton}
                onPress={handleAndroidFlow}
              >
                <Text style={styles(colors).secondaryButtonText}>
                  Go back to the testers group
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles(colors).skipButton}
                onPress={handleSkipInstall}
              >
                <Text style={styles(colors).skipButtonText}>
                  Skip and use web version
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Fallback (shouldn't happen)
  return null;
};

const styles = (colors: any) =>
  StyleSheet.create({
    // Main container
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },

    // Splash screen styles
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

    // Privacy policy styles
    privacyContainer: {
      width: "90%",
      height: "80%",
      maxWidth: 600,
      backgroundColor: colors.background,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    scrollContent: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 40,
    },
    lastUpdated: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 16,
      fontStyle: "italic",
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
      lineHeight: 20,
    },
    contactInfo: {
      fontSize: 14,
      color: colors.primary,
      marginBottom: 16,
      textAlign: "center",
    },
    actionButtonsContainer: {
      marginTop: 20,
      marginBottom: 10,
      alignItems: "center",
    },
    acceptButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      width: 200,
      alignItems: "center",
    },
    acceptButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },

    // Installation options styles
    installContainer: {
      width: "90%",
      maxWidth: 500,
      backgroundColor: colors.background,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    installContent: {
      padding: 20,
    },
    installDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: "center",
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      marginBottom: 20,
    },
    appButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: 140,
      margin: 8,
    },
    androidButton: {
      backgroundColor: "#3DDC84", // Android green
    },
    iosButton: {
      backgroundColor: "#000000", // iOS black
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    noteContainer: {
      padding: 16,
      marginBottom: 12,
    },
    noteText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      textAlign: "center",
    },
    noteBold: {
      fontWeight: "700",
      color: colors.text,
    },
    skipButton: {
      paddingVertical: 12,
      alignItems: "center",
    },
    skipButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
    },

    // Confirmation screen styles
    confirmContainer: {
      width: "90%",
      maxWidth: 500,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    confirmIcon: {
      marginBottom: 16,
    },
    confirmTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
      textAlign: "center",
    },
    confirmDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    confirmButtonsContainer: {
      width: "100%",
      alignItems: "center",
    },
    confirmButton: {
      backgroundColor: "#3DDC84",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 12,
      width: "80%",
    },
    confirmButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryButton: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
      width: "80%",
    },
    secondaryButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

export default UnifiedSplashScreen;
