import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export type InstallStep = "options" | "android-confirmation";

interface InstallApplicationPanelProps {
  appName: string;
  androidUrl: string;
  androidTestersGroupUrl: string;
  iosUrl: string;
  onSkip: () => void;
  onComplete: () => void;
}

const InstallApplicationPanel = ({
  appName,
  androidUrl,
  androidTestersGroupUrl,
  iosUrl,
  onSkip,
  onComplete,
}: InstallApplicationPanelProps) => {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState<InstallStep>("options");

  // Handle Android installation flow
  const handleAndroidFlow = () => {
    // Open the testers group link
    Linking.openURL(androidTestersGroupUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    setCurrentStep("android-confirmation");
  };

  // Confirm Android installation flow
  const handleAndroidConfirm = () => {
    // After joining group, open the app link
    Linking.openURL(androidUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    onComplete();
  };

  // Handle iOS installation
  const handleIOSDownload = () => {
    Linking.openURL(iosUrl).catch((err) => {
      console.error("Error opening URL:", err);
    });
    onComplete();
  };

  // If we're showing the Android confirmation step
  if (currentStep === "android-confirmation") {
    return (
      <View style={styles(colors).confirmContainer}>
        <Ionicons
          name="checkmark-circle"
          size={50}
          color="#3DDC84"
          style={styles(colors).confirmIcon}
        />

        <Text style={styles(colors).confirmTitle}>Join the Testers Group</Text>

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

          <TouchableOpacity style={styles(colors).skipButton} onPress={onSkip}>
            <Text style={styles(colors).skipButtonText}>
              Skip and use web version
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Otherwise, show the main installation options panel
  return (
    <View style={styles(colors).installContainer}>
      <View style={styles(colors).modalHeader}>
        <Text style={styles(colors).modalTitle}>Get the App</Text>
      </View>

      <View style={styles(colors).installContent}>
        <Text style={styles(colors).installDescription}>
          Experience {appName} on your mobile device for the best experience.
        </Text>

        <View style={styles(colors).buttonsContainer}>
          <TouchableOpacity
            style={[styles(colors).appButton, styles(colors).androidButton]}
            onPress={handleAndroidFlow}
          >
            <Ionicons name="logo-google-playstore" size={24} color="#fff" />
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
            <Text style={styles(colors).noteBold}>Android users:</Text> You'll
            need to join our testers group first, then download the app.
          </Text>
          <Text style={styles(colors).noteText}>
            <Text style={styles(colors).noteBold}>iOS users:</Text> You'll be
            directed to TestFlight to download the app.
          </Text>
        </View>

        <TouchableOpacity style={styles(colors).skipButton} onPress={onSkip}>
          <Text style={styles(colors).skipButtonText}>
            Continue to Web Version
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
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

    // Confirmation styles
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

export default InstallApplicationPanel;
