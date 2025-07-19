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
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AppBannerProps {
  appName: string;
  appIcon?: any;
  privacyPolicyUrl: string;
  androidUrl: string;
  androidTestersGroupUrl: string;
  iosUrl: string;
  // Optional styling props for customization
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

const AppBanner = ({
  appName = "App Name",
  appIcon,
  privacyPolicyUrl,
  androidUrl,
  androidTestersGroupUrl,
  iosUrl,
  accentColor = "#007AFF",
  textColor,
  backgroundColor,
  borderColor,
}: AppBannerProps) => {
  const colorScheme = useColorScheme();
  const [isSessionDismissed, setIsSessionDismissed] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // Neutral color scheme with optional overrides
  const colors = {
    primary: accentColor,
    surface: backgroundColor || "rgba(255, 255, 255, 0.1)",
    background: "rgba(128, 128, 128, 0.1)",
    border: borderColor || "rgba(128, 128, 128, 0.2)",
    text: textColor || (colorScheme === "dark" ? "#FFFFFF" : "#000000"),
    textSecondary:
      textColor || (colorScheme === "dark" ? "#CCCCCC" : "#666666"),
  };

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
      return (
        <Image source={appIcon} style={styles.appIcon} resizeMode="cover" />
      );
    } else {
      return (
        <View
          style={[
            styles.iconFallback,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="apps-outline" size={24} color={colors.primary} />
        </View>
      );
    }
  };

  return (
    <>
      <View style={styles.overlayContainer}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header row with icon, content, and close button */}
          <View style={styles.headerRow}>
            {/* App Icon */}
            <View style={styles.iconContainer}>{renderAppIcon()}</View>

            <View style={styles.content}>
              {Platform.OS === "web" ? (
                <>
                  <View style={styles.headerSection}>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {appName}
                    </Text>
                  </View>
                  <Text
                    style={[styles.message, { color: colors.textSecondary }]}
                  >
                    Available on mobile platforms
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.headerSection}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={colors.primary}
                      style={styles.headerIcon}
                    />
                    <Text style={[styles.title, { color: colors.text }]}>
                      {appName}
                    </Text>
                  </View>
                  <Text
                    style={[styles.message, { color: colors.textSecondary }]}
                  >
                    Thank you for using this app! Privacy Policy and User Guide
                    available online.
                  </Text>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Full-width button row */}
          {Platform.OS === "web" ? (
            <View style={styles.fullWidthButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.mobileButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleInstallAndroid}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="logo-android"
                  size={14}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.mobileButtonText}>Android</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mobileButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleInstallIOS}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="logo-apple"
                  size={14}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.mobileButtonText}>iOS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mobileLinkButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={handleJoinAndroidBeta}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="people-outline"
                  size={12}
                  color={colors.text}
                  style={styles.buttonIcon}
                />
                <Text
                  style={[styles.mobileLinkButtonText, { color: colors.text }]}
                >
                  Beta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mobileLinkButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={handlePrivacyPolicy}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="document-text-outline"
                  size={12}
                  color={colors.text}
                  style={styles.buttonIcon}
                />
                <Text
                  style={[styles.mobileLinkButtonText, { color: colors.text }]}
                >
                  Policy
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fullWidthButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.mobileLinkButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={handlePrivacyPolicy}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="document-text-outline"
                  size={12}
                  color={colors.text}
                  style={styles.buttonIcon}
                />
                <Text
                  style={[styles.mobileLinkButtonText, { color: colors.text }]}
                >
                  Privacy Policy / User Guide
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Android Beta Warning Modal */}
      <Modal
        visible={showAndroidModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAndroidModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF",
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons
                name="warning-outline"
                size={24}
                color={colors.primary}
                style={styles.modalIcon}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Beta Access Required
              </Text>
            </View>

            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              To install the Android app, you must first join the beta testing
              group.
            </Text>

            <Text style={[styles.modalQuestion, { color: colors.text }]}>
              Have you already joined the beta testing group?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleAndroidInstallConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  Yes, Install App
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSecondaryButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleJoinBetaGroup}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalSecondaryButtonText,
                    { color: colors.text },
                  ]}
                >
                  No, Join Group
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => setShowAndroidModal(false)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalCancelButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === "ios" ? 44 : 24,
  },
  container: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    // Minimal shadow for subtlety
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconContainer: {
    padding: 10,
    paddingRight: 6,
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  iconFallback: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  content: {
    flex: 1,
    padding: 10,
    paddingLeft: 6,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "500",
  },
  message: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 6,
  },
  fullWidthButtonContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  mobileButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileLinkButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  mobileLinkButtonText: {
    fontSize: 10,
    fontWeight: "400",
  },
  buttonIcon: {
    marginRight: 3,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
    borderWidth: 1,
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
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
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
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalQuestion: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
  },
  modalButtonContainer: {
    gap: 12,
  },
  modalPrimaryButton: {
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalCancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "400",
  },
});

export default AppBanner;
