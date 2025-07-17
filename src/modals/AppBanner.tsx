import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Image,
  Modal,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

interface AppBannerProps {
  appName: string;
  appIcon?: any;
  privacyPolicyUrl: string;
  androidUrl: string;
  androidTestersGroupUrl: string;
  iosUrl: string;
}

const AppBanner = ({
  appName = "Double Bill",
  appIcon, // Local image
  privacyPolicyUrl,
  androidUrl,
  androidTestersGroupUrl,
  iosUrl,
}: AppBannerProps) => {
  const { colors } = useTheme();
  const [isSessionDismissed, setIsSessionDismissed] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  const handleDismiss = () => {
    setIsSessionDismissed(true);
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL(privacyPolicyUrl);
  };

  const handleInstallAndroid = () => {
    setShowAndroidModal(true);
  };

  const handleAndroidInstallConfirm = () => {
    setShowAndroidModal(false);
    Linking.openURL(androidUrl);
  };

  const handleJoinBetaGroup = () => {
    setShowAndroidModal(false);
    Linking.openURL(androidTestersGroupUrl);
  };

  const handleInstallIOS = () => {
    Linking.openURL(iosUrl);
  };

  const handleJoinAndroidBeta = () => {
    Linking.openURL(androidTestersGroupUrl);
  };

  // Don't show if session dismissed
  if (isSessionDismissed) {
    return null;
  }

  const renderAppIcon = () => {
    if (appIcon) {
      // Local image
      return (
        <Image
          source={appIcon}
          style={styles(colors).appIcon}
          resizeMode="cover"
        />
      );
    } else {
      // Fallback to Ionicon
      return (
        <View style={styles(colors).iconFallback}>
          <Ionicons name="film" size={24} color={colors.primary} />
        </View>
      );
    }
  };

  return (
    <>
      <View style={styles(colors).container}>
        {/* Header row with icon, content, and close button */}
        <View style={styles(colors).headerRow}>
          {/* App Icon */}
          <View style={styles(colors).iconContainer}>{renderAppIcon()}</View>

          <View style={styles(colors).content}>
            {Platform.OS === "web" ? (
              <>
                <View style={styles(colors).headerSection}>
                  <Text style={styles(colors).title}>{appName}</Text>
                </View>
                <Text style={styles(colors).message}>
                  Download on mobile for best experience.
                </Text>
              </>
            ) : (
              <>
                <View style={styles(colors).headerSection}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={colors.primary}
                    style={styles(colors).headerIcon}
                  />
                  <Text style={styles(colors).title}>
                    Welcome to {appName}!
                  </Text>
                </View>
                <Text style={styles(colors).message}>
                  Your privacy matters to us. Check out our privacy policy
                  below.
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles(colors).closeButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Full-width button row */}
        {Platform.OS === "web" ? (
          <View style={styles(colors).fullWidthButtonContainer}>
            <TouchableOpacity
              style={styles(colors).mobileButton}
              onPress={handleInstallAndroid}
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-android"
                size={16}
                color="#fff"
                style={styles(colors).buttonIcon}
              />
              <Text style={styles(colors).mobileButtonText}>Android</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles(colors).mobileButton}
              onPress={handleInstallIOS}
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-apple"
                size={16}
                color="#fff"
                style={styles(colors).buttonIcon}
              />
              <Text style={styles(colors).mobileButtonText}>iOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles(colors).mobileSecondaryButton}
              onPress={handleJoinAndroidBeta}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people"
                size={14}
                color="#fff"
                style={styles(colors).buttonIcon}
              />
              <Text style={styles(colors).mobileButtonText}>Beta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles(colors).mobileLinkButton}
              onPress={handlePrivacyPolicy}
              activeOpacity={0.8}
            >
              <Ionicons
                name="book"
                size={14}
                color={colors.primary}
                style={styles(colors).buttonIcon}
              />
              <Text style={styles(colors).mobileLinkButtonText}>Policy</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles(colors).fullWidthButtonContainer}>
            <TouchableOpacity
              style={styles(colors).mobileLinkButton}
              onPress={handlePrivacyPolicy}
              activeOpacity={0.8}
            >
              <Ionicons
                name="book"
                size={14}
                color={colors.primary}
                style={styles(colors).buttonIcon}
              />
              <Text style={styles(colors).mobileLinkButtonText}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Android Beta Warning Modal */}
      <Modal
        visible={showAndroidModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAndroidModal(false)}
      >
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).modalContainer}>
            <View style={styles(colors).modalHeader}>
              <Ionicons
                name="warning"
                size={24}
                color="#dc3545"
                style={styles(colors).modalIcon}
              />
              <Text style={styles(colors).modalTitle}>
                Android Beta Required
              </Text>
            </View>

            <Text style={styles(colors).modalMessage}>
              To install the Android app, you must first join our beta testing
              group.
            </Text>

            <Text style={styles(colors).modalQuestion}>
              Have you already joined the beta testing group?
            </Text>

            <View style={styles(colors).modalButtonContainer}>
              <TouchableOpacity
                style={styles(colors).modalPrimaryButton}
                onPress={handleAndroidInstallConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles(colors).modalPrimaryButtonText}>
                  Yes, Install App
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles(colors).modalSecondaryButton}
                onPress={handleJoinBetaGroup}
                activeOpacity={0.8}
              >
                <Text style={styles(colors).modalSecondaryButtonText}>
                  No, Join Group Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles(colors).modalCancelButton}
                onPress={() => setShowAndroidModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles(colors).modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      marginHorizontal: 8,
      marginVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    iconContainer: {
      padding: 12,
      paddingRight: 8,
    },
    appIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    iconFallback: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingLeft: 8,
    },
    headerSection: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    headerIcon: {
      marginRight: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    message: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    buttonContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    fullWidthButtonContainer: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingBottom: 12,
      gap: 4,
    },
    mobileButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    mobileSecondaryButton: {
      flex: 1,
      backgroundColor: "#dc3545",
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    mobileLinkButton: {
      flex: 1,
      backgroundColor: "transparent",
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    mobileButtonText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
    mobileLinkButtonText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "500",
    },
    buttonIcon: {
      marginRight: 6,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      margin: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      width: "100%",
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    modalIcon: {
      marginRight: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    modalMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    modalQuestion: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
      marginBottom: 20,
    },
    modalButtonContainer: {
      gap: 12,
    },
    modalPrimaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: "center",
    },
    modalPrimaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    modalSecondaryButton: {
      backgroundColor: "#dc3545",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: "center",
    },
    modalSecondaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    modalCancelButton: {
      backgroundColor: "transparent",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalCancelButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: "500",
    },
  });

export default AppBanner;
