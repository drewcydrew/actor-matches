import React, { useState } from "react";
import { ThemeProvider } from "./src/context/ThemeContext";
import { FilmProvider } from "./src/context/FilmContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainScreen from "./src/screens/MainScreen";
import SplashScreen from "./src/modals/SplashScreen";
import GetAppBanner from "./src/modals/GetAppBanner";

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
          <GetAppBanner
            androidUrl="https://expo.dev/accounts/drew92/projects/actormatches/builds/eab4c3a1-073b-4414-8e56-df6bb3eafa9c"
            iosUrl="https://testflight.apple.com/join/9rHGtzmn"
          />
          <SplashScreen isVisible={showSplash} onFinish={handleSplashFinish} />
        </FilmProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
