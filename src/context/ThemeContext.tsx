import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";

// Define theme types and colors
export type ThemeType = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  border: string;
  error: string;
  headerBackground: string;
  selectedItem: string;
  placeholderBackground: string;
}

// Define color palettes
const lightColors: ThemeColors = {
  background: "#ffffff",
  surface: "#f8f8f8",
  text: "#000000",
  textSecondary: "#666666",
  primary: "#2196F3",
  secondary: "#ff0000",
  border: "#dddddd",
  error: "#ff0000",
  headerBackground: "#f5f5f5",
  selectedItem: "#e6f7ff",
  placeholderBackground: "#e1e1e1",
};

const darkColors: ThemeColors = {
  background: "#121212",
  surface: "#1e1e1e",
  text: "#ffffff",
  textSecondary: "#aaaaaa",
  primary: "#4dabf5",
  secondary: "#ff0000",
  border: "#444444",
  error: "#ff6b6b",
  headerBackground: "#242424",
  selectedItem: "#1a3a4a",
  placeholderBackground: "#3a3a3a",
};

// Define the context type
interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeType: (type: ThemeType) => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  colors: lightColors,
  toggleTheme: () => {},
  setThemeType: () => {},
});

// Hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get device color scheme
  const deviceTheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>("dark");

  // Update theme if device theme changes
  /*useEffect(() => {
    if (deviceTheme) {
      setTheme(deviceTheme === "dark" ? "dark" : "light");
    }
  }, [deviceTheme]);*/

  // Get colors based on current theme
  const colors = theme === "dark" ? darkColors : lightColors;

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Set specific theme
  const setThemeType = (type: ThemeType) => {
    setTheme(type);
  };

  const value = {
    theme,
    colors,
    toggleTheme,
    setThemeType,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
