import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, SafeAreaView, Platform } from "react-native";
import React from "react";
import FilmSearch from "../components/FilmSearch";
import ActorDisplay from "../components/ActorDisplay";
import { useFilmContext } from "../context/FilmContext";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MainScreen = () => {
  // Get selected films and setters from context
  const { setSelectedFilm1, setSelectedFilm2, selectedFilm1, selectedFilm2 } =
    useFilmContext();

  // Get theme colors
  const { colors, theme } = useTheme();

  // Get safe area insets with fallback values
  const insets = {
    ...useSafeAreaInsets(),
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      width: "100%",
    },
    innerContainer: {
      flex: 1,
      // Use proper insets with Platform-specific adjustments
      paddingTop: insets.top + (Platform.OS === "android" ? 25 : 0),
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    actorSection: {
      flex: 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });

  return (
    <View style={styles.container}>
      {/* Render the status bar with correct style */}
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={styles.innerContainer}>
        <FilmSearch
          onSelectFilm={setSelectedFilm1}
          initiallyExpanded={true}
          selectedFilm={selectedFilm1}
        />

        <FilmSearch
          onSelectFilm={setSelectedFilm2}
          initiallyExpanded={true}
          selectedFilm={selectedFilm2}
        />

        <View style={styles.actorSection}>
          <ActorDisplay />
        </View>
      </View>
    </View>
  );
};

export default MainScreen;
