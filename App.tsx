import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./src/context/ThemeContext";
import { FilmProvider } from "./src/context/FilmContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainScreen from "./src/screens/MainScreen";
import SplashScreen from "./src/modals/SplashScreen";
import GetAppBanner from "./src/modals/GetAppBanner";
import PrivacyPolicyModal from "./src/modals/PrivacyPolicyModal";
import UnifiedSplashScreen from "./src/modals/UnifiedSplashScreen";

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
          <UnifiedSplashScreen
            isVisible={showSplash}
            onFinish={handleSplashFinish}
            appName="I Am DB" // Customize the app name
          />

          <MainScreen />
        </FilmProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
