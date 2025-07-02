import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ThemeProvider } from "./src/context/ThemeContext";
import { FilmProvider } from "./src/context/FilmContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainScreen from "./src/screens/MainScreen";
import PrivacyPolicyScreen from "./src/screens/PrivacyPolicyScreen";
import UnifiedSplashScreen from "./src/modals/UnifiedSplashScreen";

const Stack = createStackNavigator();

function MainApp() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <>
      <UnifiedSplashScreen
        isVisible={showSplash}
        onFinish={handleSplashFinish}
        appName="I Am DB"
      />
      <MainScreen />
    </>
  );
}

// Enhanced linking configuration
const linking = {
  prefixes: ["https://iamdb.onrender.com", "http://localhost:8081"],
  config: {
    screens: {
      Main: "",
      PrivacyPolicy: "PrivacyPolicy",
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FilmProvider>
          <NavigationContainer
            linking={linking}
            fallback={<Text>Loading...</Text>}
          >
            <Stack.Navigator
              initialRouteName="Main"
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="Main" component={MainApp} />
              <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </FilmProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
