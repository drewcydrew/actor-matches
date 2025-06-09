import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface PrivacyPolicyModalProps {
  isVisible: boolean;
  onClose: () => void;
  appName?: string;
  androidUrl?: string;
  androidTestersGroupUrl?: string;
  iosUrl?: string;
  showInstallButtons?: boolean;
}

const PrivacyPolicyModal = ({
  isVisible,
  onClose,
  appName = "Actor Matches",
  androidUrl = "https://play.google.com/apps/testing/com.drew92.actormatches",
  androidTestersGroupUrl = "https://groups.google.com/g/i-am-db-testers",
  iosUrl = "https://testflight.apple.com/join/9rHGtzmn",
  showInstallButtons = true,
}: PrivacyPolicyModalProps) => {
  const { colors } = useTheme();
  const [androidModalStep, setAndroidModalStep] = useState<
    "policy" | "instructions" | "confirm"
  >("policy");

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
    resetAndClose();
  };

  const handleIOSDownload = () => {
    Linking.openURL(iosUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    onClose();
    // Reset to first step for next time
    setTimeout(() => setAndroidModalStep("policy"), 300);
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles(colors).modalOverlay}>
        <View style={styles(colors).modalContainer}>
          <View style={styles(colors).modalHeader}>
            <Text style={styles(colors).modalTitle}>Privacy Policy</Text>
            <TouchableOpacity
              onPress={resetAndClose}
              style={styles(colors).modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {androidModalStep === "policy" ? (
            <ScrollView
              style={styles(colors).scrollContent}
              contentContainerStyle={styles(colors).contentContainer}
            >
              <Text style={styles(colors).lastUpdated}>
                Last Updated: June 9, 2025
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
                  onPress={resetAndClose}
                >
                  <Text style={styles(colors).acceptButtonText}>
                    I Understand
                  </Text>
                </TouchableOpacity>

                {showInstallButtons && Platform.OS === "web" && (
                  <View style={styles(colors).installContainer}>
                    <Text style={styles(colors).installHeader}>
                      Ready to install {appName}?
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
                        style={[
                          styles(colors).appButton,
                          styles(colors).iosButton,
                        ]}
                        onPress={handleIOSDownload}
                      >
                        <Ionicons name="logo-apple" size={24} color="#fff" />
                        <Text style={styles(colors).buttonText}>iOS</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles(colors).noteContainer}>
                      <Text style={styles(colors).noteText}>
                        <Text style={styles(colors).noteBold}>
                          Android users:
                        </Text>{" "}
                        You'll need to join our testers group first, then
                        download the app.
                      </Text>
                      <Text style={styles(colors).noteText}>
                        <Text style={styles(colors).noteBold}>iOS users:</Text>{" "}
                        You'll be directed to TestFlight to download the app.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : androidModalStep === "confirm" ? (
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
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    // ...existing code...
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
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
    scrollContent: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
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
      marginBottom: 8,
      lineHeight: 20,
    },
    bold: {
      fontWeight: "bold",
    },
    contactInfo: {
      fontSize: 14,
      color: colors.primary,
      marginBottom: 16,
      textAlign: "center",
    },
    acceptButtonContainer: {
      marginTop: 20,
      marginBottom: 10,
      alignItems: "center",
    },
    acceptButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    acceptButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    // New styles for install buttons
    actionButtonsContainer: {
      marginTop: 20,
      marginBottom: 10,
      alignItems: "center",
    },
    installContainer: {
      marginTop: 30,
      width: "100%",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 20,
    },
    installHeader: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 16,
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 16,
      flexWrap: "wrap",
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
    // Confirm step styles
    confirmContainer: {
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
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
  });

export default PrivacyPolicyModal;
