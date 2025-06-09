import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./src/context/ThemeContext";
import { FilmProvider } from "./src/context/FilmContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainScreen from "./src/screens/MainScreen";
import SplashScreen from "./src/modals/SplashScreen";
import GetAppBanner from "./src/modals/GetAppBanner";
import PrivacyPolicyModal from "./src/modals/PrivacyPolicyModal";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(true); // Default to true

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FilmProvider>
          <MainScreen />
          <GetAppBanner
            androidUrl="https://expo.dev/accounts/drew92/projects/actormatches/builds/eab4c3a1-073b-4414-8e56-df6bb3eafa9c"
            androidTestersGroupUrl="https://groups.google.com/g/i-am-db-testers"
            iosUrl="https://testflight.apple.com/join/9rHGtzmn"
          />
          <SplashScreen isVisible={showSplash} onFinish={handleSplashFinish} />

          {/* Standalone Privacy Policy Modal that shows by default */}
          <PrivacyPolicyModal
            isVisible={showPrivacyPolicy}
            onClose={() => setShowPrivacyPolicy(false)}
            appName="I Am DB"
          />
        </FilmProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
