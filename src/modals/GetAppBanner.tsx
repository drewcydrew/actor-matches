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

interface GetAppBannerProps {
  androidUrl?: string;
  iosUrl?: string;
}

const GetAppBanner = ({
  androidUrl = "https://play.google.com/store/apps/details?id=com.actormatches.app",
  iosUrl = "https://apps.apple.com/app/actor-matches/id1234567890",
}: GetAppBannerProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bannerHeight] = useState(new Animated.Value(0));

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
    setShowModal(true);
  };

  const handleDownload = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error("Error opening URL:", err);
    });
    setShowModal(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles(colors, insets).bannerContainer,
          { height: bannerHeight },
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
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).modalContainer}>
            <View style={styles(colors).modalHeader}>
              <Text style={styles(colors).modalTitle}>Get the App</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles(colors).modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles(colors).modalDescription}>
              Experience I Am DB on your mobile device for the best experience.
            </Text>

            <View style={styles(colors).buttonsContainer}>
              <TouchableOpacity
                style={[styles(colors).appButton, styles(colors).androidButton]}
                onPress={() => handleDownload(androidUrl)}
              >
                <Ionicons name="logo-google-playstore" size={24} color="#fff" />
                <Text style={styles(colors).buttonText}>Google Play</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles(colors).appButton, styles(colors).iosButton]}
                onPress={() => handleDownload(iosUrl)}
              >
                <Ionicons name="logo-apple" size={24} color="#fff" />
                <Text style={styles(colors).buttonText}>App Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = (colors: any, insets?: any) =>
  StyleSheet.create({
    bannerContainer: {
      backgroundColor: colors.primary,
      width: "100%",
      position: "absolute", // Changed from absolute for better integration with MainScreen
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
  });

export default GetAppBanner;
