import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./src/context/ThemeContext";
import { FilmProvider } from "./src/context/FilmContext";
import { SavedSearchesProvider } from "./src/context/SavedSearchesContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainScreen from "./src/screens/MainScreen";

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
          <SavedSearchesProvider>
            <MainScreen />
          </SavedSearchesProvider>
        </FilmProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
