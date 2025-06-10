import React, { useState, useEffect } from "react";
import { Modal, View, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import IntroPanel from "../components/IntroPanel";
import PrivacyPolicyPanel from "../components/PrivacyPolicyPanel";
import InstallApplicationPanel from "../components/InstallApplicationPanel";

// Storage key for privacy policy acceptance
const PRIVACY_ACCEPTED_KEY = "actor-matches:privacyAccepted";

interface UnifiedSplashScreenProps {
  isVisible: boolean;
  onFinish: () => void;
  appName?: string;
  androidUrl?: string;
  androidTestersGroupUrl?: string;
  iosUrl?: string;
}

type SplashStep = "splash" | "privacy" | "install";

const UnifiedSplashScreen = ({
  isVisible,
  onFinish,
  appName = "Actor Matches",
  androidUrl = "https://play.google.com/apps/testing/com.drew92.actormatches",
  androidTestersGroupUrl = "https://groups.google.com/g/i-am-db-testers",
  iosUrl = "https://testflight.apple.com/join/9rHGtzmn",
}: UnifiedSplashScreenProps) => {
  const { colors } = useTheme();

  // State to track which step of the onboarding flow we're on
  const [currentStep, setCurrentStep] = useState<SplashStep>("splash");
  const [isLoading, setIsLoading] = useState(true);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);

  // Check if privacy policy has already been accepted
  useEffect(() => {
    if (isVisible) {
      const checkPrivacyAcceptance = async () => {
        try {
          const privacyAccepted = await AsyncStorage.getItem(
            PRIVACY_ACCEPTED_KEY
          );

          if (privacyAccepted === "true") {
            setHasAcceptedPrivacy(true);
          }

          setIsLoading(false);
        } catch (error) {
          console.error("Error checking privacy acceptance:", error);
          setIsLoading(false);
        }
      };

      checkPrivacyAcceptance();
    }
  }, [isVisible]);

  // Navigate from splash to privacy policy or next step based on prior acceptance
  const handleGetStarted = () => {
    // If already accepted privacy policy, skip to next step
    if (hasAcceptedPrivacy) {
      if (Platform.OS !== "web") {
        // On mobile, go straight to app
        onFinish();
      } else {
        // On web, offer app installation
        setCurrentStep("install");
      }
    } else {
      // Show privacy policy if not yet accepted
      setCurrentStep("privacy");
    }
  };

  // Handle privacy policy acceptance
  const handlePrivacyAccept = async () => {
    try {
      // Store privacy acceptance status
      await AsyncStorage.setItem(PRIVACY_ACCEPTED_KEY, "true");
      setHasAcceptedPrivacy(true);

      // If on mobile, go directly to app
      if (Platform.OS !== "web") {
        onFinish();
      } else {
        // On web, offer app installation
        setCurrentStep("install");
      }
    } catch (error) {
      console.error("Error saving privacy acceptance:", error);
      // Continue with flow even if storage fails
      if (Platform.OS !== "web") {
        onFinish();
      } else {
        setCurrentStep("install");
      }
    }
  };

  // If not visible, don't render anything
  if (!isVisible) {
    return null;
  }

  // If still loading, don't render anything yet
  if (isLoading) {
    return null;
  }

  // Render appropriate step
  return (
    <Modal visible={true} transparent={false} animationType="fade">
      <View style={styles(colors).container}>
        {currentStep === "splash" && (
          <IntroPanel
            appName={appName}
            onContinue={handleGetStarted}
            hasAcceptedPrivacy={hasAcceptedPrivacy} // Pass the privacy status
          />
        )}

        {currentStep === "privacy" && (
          <PrivacyPolicyPanel
            appName={appName}
            onAccept={handlePrivacyAccept}
          />
        )}

        {currentStep === "install" && (
          <InstallApplicationPanel
            appName={appName}
            androidUrl={androidUrl}
            androidTestersGroupUrl={androidTestersGroupUrl}
            iosUrl={iosUrl}
            onSkip={onFinish}
            onComplete={onFinish}
          />
        )}
      </View>
    </Modal>
  );
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
  });

export default UnifiedSplashScreen;
