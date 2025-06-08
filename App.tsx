import MainScreen from "./src/screens/MainScreen";
import { FilmProvider } from "./src/context/FilmContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FilmProvider>
          <MainScreen />
        </FilmProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
