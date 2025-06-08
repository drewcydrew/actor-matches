import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, SafeAreaView, Platform } from "react-native";
import React from "react";
import FilmSearch from "../components/FilmSearch";
import ActorDisplay from "../components/ActorDisplay";
import { useFilmContext } from "../context/FilmContext";

const BlankScreen = () => {
  // Get selected films and setters from context
  const { setSelectedFilm1, setSelectedFilm2, selectedFilm1, selectedFilm2 } =
    useFilmContext();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <FilmSearch
          onSelectFilm={setSelectedFilm1}
          initiallyExpanded={true}
          selectedFilm={selectedFilm1}
        />

        {/* Second FilmSearch component */}
        <FilmSearch
          onSelectFilm={setSelectedFilm2}
          initiallyExpanded={true}
          selectedFilm={selectedFilm2}
        />

        {/* Actors section - shows intersection of casts */}
        <View style={styles.actorSection}>
          <ActorDisplay />
        </View>
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
  },
  innerContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  actorSection: {
    flex: 2, // Give the actor section a consistent size
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});

export default BlankScreen;
