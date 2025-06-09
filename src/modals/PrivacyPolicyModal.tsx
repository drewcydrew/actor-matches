import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface PrivacyPolicyModalProps {
  isVisible: boolean;
  onClose: () => void;
  appName?: string;
}

const PrivacyPolicyModal = ({
  isVisible,
  onClose,
  appName = "Actor Matches",
}: PrivacyPolicyModalProps) => {
  const { colors } = useTheme();

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
              onPress={onClose}
              style={styles(colors).modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles(colors).scrollContent}
            contentContainerStyle={styles(colors).contentContainer}
          >
            <Text style={styles(colors).lastUpdated}>
              Last Updated: June 9, 2025
            </Text>

            <Text style={styles(colors).sectionTitle}>Introduction</Text>
            <Text style={styles(colors).paragraph}>
              Thank you for using {appName}. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              use our mobile application and website. Please read this Privacy
              Policy carefully.
            </Text>

            <Text style={styles(colors).sectionTitle}>
              Information We Collect
            </Text>
            <Text style={styles(colors).paragraph}>
              <Text style={styles(colors).bold}>Personal Data:</Text> We do not
              collect personally identifiable information unless you explicitly
              provide it.
            </Text>
            <Text style={styles(colors).paragraph}>
              <Text style={styles(colors).bold}>Usage Data:</Text> We may
              collect anonymous usage statistics to improve our service,
              including:
            </Text>
            <View style={styles(colors).bulletList}>
              <Text style={styles(colors).bulletItem}>
                • Search queries for actors and films
              </Text>
              <Text style={styles(colors).bulletItem}>
                • App feature usage patterns
              </Text>
              <Text style={styles(colors).bulletItem}>
                • Device type and operating system
              </Text>
            </View>

            <Text style={styles(colors).sectionTitle}>
              Third-Party Services
            </Text>
            <Text style={styles(colors).paragraph}>
              Our application uses The Movie Database (TMDb) API to provide film
              and actor information. Your use of the app is also subject to
              TMDb's privacy policy. We also use analytics services to improve
              app performance and user experience.
            </Text>

            <Text style={styles(colors).sectionTitle}>Data Storage</Text>
            <Text style={styles(colors).paragraph}>
              Your search history and preferences may be stored locally on your
              device to improve your experience. This data is not transmitted to
              our servers.
            </Text>

            <Text style={styles(colors).sectionTitle}>Security</Text>
            <Text style={styles(colors).paragraph}>
              We value your trust in providing us your information, thus we
              strive to use commercially acceptable means of protecting it.
              However, no method of transmission over the internet or electronic
              storage is 100% secure and reliable.
            </Text>

            <Text style={styles(colors).sectionTitle}>Children's Privacy</Text>
            <Text style={styles(colors).paragraph}>
              Our service is not intended for anyone under the age of 13. We do
              not knowingly collect personal information from children under 13.
            </Text>

            <Text style={styles(colors).sectionTitle}>
              Changes to This Privacy Policy
            </Text>
            <Text style={styles(colors).paragraph}>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last Updated" date.
            </Text>

            <Text style={styles(colors).sectionTitle}>Contact Us</Text>
            <Text style={styles(colors).paragraph}>
              If you have any questions about this Privacy Policy, please
              contact us at:
            </Text>
            <Text style={styles(colors).contactInfo}>
              support@actormatches.com
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
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
    bulletList: {
      marginLeft: 8,
      marginBottom: 8,
    },
    bulletItem: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
      lineHeight: 20,
    },
    contactInfo: {
      fontSize: 14,
      color: colors.primary,
      marginBottom: 16,
      textAlign: "center",
    },
  });

export default PrivacyPolicyModal;
