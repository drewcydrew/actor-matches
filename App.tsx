import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./src/context/ThemeContext";
import { FilmProvider } from "./src/context/FilmContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainScreen from "./src/screens/MainScreen";
import SplashScreen from "./src/modals/SplashScreen";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FilmProvider>
          <MainScreen />
          <SplashScreen isVisible={showSplash} onFinish={handleSplashFinish} />
        </FilmProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
