import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface PrivacyPolicyPanelProps {
  appName: string;
  onAccept: () => void;
}

const PrivacyPolicyPanel = ({ appName, onAccept }: PrivacyPolicyPanelProps) => {
  const { colors } = useTheme();

  return (
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
          Thank you for using {appName}. This Privacy Policy explains how we
          handle your information when you use our application.
        </Text>

        <Text style={styles(colors).sectionTitle}>No Data Collection</Text>
        <Text style={styles(colors).paragraph}>
          {appName} does not collect any personal information or usage data from
          you. All your interactions with the app remain private.
        </Text>

        <Text style={styles(colors).sectionTitle}>Third-Party Services</Text>
        <Text style={styles(colors).paragraph}>
          Our application uses The Movie Database (TMDb) API to provide film and
          actor information. When you search for content within our app, these
          queries are sent to TMDb's servers according to their API terms.
          Please refer to TMDb's privacy policy for information on how they
          handle this data.
        </Text>

        <Text style={styles(colors).sectionTitle}>Local Storage</Text>
        <Text style={styles(colors).paragraph}>
          Any search history or preferences are stored locally on your device to
          improve your experience. This data stays on your device and is not
          transmitted to our servers or any third parties (except for the actual
          search queries to TMDb as mentioned above).
        </Text>

        <Text style={styles(colors).sectionTitle}>Children's Privacy</Text>
        <Text style={styles(colors).paragraph}>
          Our service is not intended for anyone under the age of 13.
        </Text>

        <Text style={styles(colors).sectionTitle}>
          Changes to This Privacy Policy
        </Text>
        <Text style={styles(colors).paragraph}>
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page and
          updating the "Last Updated" date.
        </Text>

        <Text style={styles(colors).sectionTitle}>Contact Us</Text>
        <Text style={styles(colors).paragraph}>
          If you have any questions about this Privacy Policy, please contact us
          at:
        </Text>
        <Text style={styles(colors).contactInfo}>andrewjovaras@gmail.com</Text>

        <View style={styles(colors).actionButtonsContainer}>
          <TouchableOpacity
            style={styles(colors).acceptButton}
            onPress={onAccept}
          >
            <Text style={styles(colors).acceptButtonText}>I Accept</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
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
  });

export default PrivacyPolicyPanel;
