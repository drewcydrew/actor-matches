import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import PrivacyPolicyModal from "./PrivacyPolicyModal";

interface GetAppBannerProps {
  androidUrl?: string;
  androidTestersGroupUrl?: string;
  iosUrl?: string;
}

const GetAppBanner = ({
  androidUrl = "https://play.google.com/apps/testing/com.drew92.actormatches",
  androidTestersGroupUrl = "https://groups.google.com/g/i-am-db-testers",
  iosUrl = "https://testflight.apple.com/join/9rHGtzmn",
}: GetAppBannerProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bannerHeight] = useState(new Animated.Value(0));
  const [androidModalStep, setAndroidModalStep] = useState<
    "instructions" | "confirm"
  >("instructions");

  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  useEffect(() => {
    // Only show banner on web platforms
    if (Platform.OS === "web") {
      showBannerWithAnimation();
    }
  }, []);

  const showBannerWithAnimation = () => {
    setShowBanner(true);
    Animated.timing(bannerHeight, {
      toValue: 50,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const dismissBanner = () => {
    Animated.timing(bannerHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setShowBanner(false);
    });
  };

  const handleBannerPress = () => {
    setAndroidModalStep("instructions");
    setShowModal(true);
  };

  const handleAndroidFlow = () => {
    // Open the testers group link first
    Linking.openURL(androidTestersGroupUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    // Move to confirmation step
    setAndroidModalStep("confirm");
  };

  const handleAndroidConfirm = () => {
    // After joining group, open the app link
    Linking.openURL(androidUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    closeModal();
  };

  const handleIOSDownload = () => {
    Linking.openURL(iosUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    // Reset to first step for next time
    setTimeout(() => setAndroidModalStep("instructions"), 300);
  };

  const handlePrivacyPolicyPress = () => {
    setShowPrivacyPolicy(true);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles(colors, insets).bannerContainer,
          { height: bannerHeight, top: 0, left: 0, right: 0 },
        ]}
      >
        <TouchableOpacity
          style={styles(colors).bannerContent}
          onPress={handleBannerPress}
          activeOpacity={0.8}
        >
          <Ionicons name="phone-portrait" size={20} color="#fff" />
          <Text style={styles(colors).bannerText}>
            Get I Am DB on your mobile device
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles(colors).closeButton}
          onPress={dismissBanner}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).modalContainer}>
            <View style={styles(colors).modalHeader}>
              <Text style={styles(colors).modalTitle}>Get the App</Text>
              <TouchableOpacity
                onPress={closeModal}
                style={styles(colors).modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {androidModalStep === "instructions" ? (
              <>
                <Text style={styles(colors).modalDescription}>
                  Experience I Am DB on your mobile device for the best
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
                  <TouchableOpacity
                    onPress={handlePrivacyPolicyPress}
                    style={styles(colors).policyLink}
                  >
                    <Text style={styles(colors).policyLinkText}>
                      View Privacy Policy
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles(colors).noteText}>
                    <Text style={styles(colors).noteBold}>Android users:</Text>{" "}
                    You'll need to join our testers group first, then download
                    the app.
                  </Text>
                  <Text style={styles(colors).noteText}>
                    <Text style={styles(colors).noteBold}>iOS users:</Text>{" "}
                    You'll be directed to TestFlight to download the app.
                  </Text>
                </View>
              </>
            ) : (
              // Android confirmation step
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
                  After joining the Google Group, you can download the app. Have
                  you completed this step?
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
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <PrivacyPolicyModal
        isVisible={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        appName="I Am DB"
      />
    </>
  );
};

const styles = (colors: any, insets?: any) =>
  StyleSheet.create({
    bannerContainer: {
      backgroundColor: colors.primary,
      width: "100%",
      position: "absolute",
      zIndex: 1000,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden",
    },
    bannerContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    bannerText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      marginHorizontal: 10,
      flex: 1,
    },
    closeButton: {
      width: 40,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "80%",
      maxWidth: 400,
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
      justifyContent: "space-between",
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
    modalCloseButton: {
      padding: 4,
    },
    modalDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      textAlign: "center",
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 16,
    },
    appButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: 140,
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
    // New styles for notes
    noteContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    noteText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    noteBold: {
      fontWeight: "700",
      color: colors.text,
    },
    // New styles for confirmation screen
    confirmContainer: {
      padding: 20,
      alignItems: "center",
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
    },
    confirmButton: {
      backgroundColor: "#3DDC84",
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 12,
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
    },
    secondaryButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    policyLink: {
      marginTop: 10,
      padding: 8,
      alignItems: "center",
    },
    policyLinkText: {
      fontSize: 12,
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });

export default GetAppBanner;
