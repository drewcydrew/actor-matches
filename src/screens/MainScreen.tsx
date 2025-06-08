import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Platform,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import FilmSearch from "../components/FilmSearch";
import ActorDisplay from "../components/ActorDisplay";
import { useFilmContext } from "../context/FilmContext";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActorFilmography from "../modals/ActorFilmography";
import { Ionicons } from "@expo/vector-icons";
import ActorSearch from "../components/ActorSearch";
import FilmDisplay from "../components/FilmDisplay";
import { Film } from "../api/tmdbApi";
import FilmCast from "../modals/FilmCast";

// Actor interface to track selected actor
interface Actor {
  id: number;
  name: string;
  profile_path?: string;
}

// Define comparison modes
type ComparisonMode = "compareByFilm" | "compareByActor";

const MainScreen = () => {
  // Get selected films and setters from context
  const { setSelectedFilm1, setSelectedFilm2, selectedFilm1, selectedFilm2 } =
    useFilmContext();

  // Add state for selected actors in this mode
  const [selectedActor1, setSelectedActor1] = useState<Actor | null>(null);
  const [selectedActor2, setSelectedActor2] = useState<Actor | null>(null);

  // Add state for selected actor
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [isActorFilmographyVisible, setIsActorFilmographyVisible] =
    useState(false);

  const [isFilmCastVisible, setIsFilmCastVisible] = useState(false);
  const [selectedFilmForCast, setSelectedFilmForCast] = useState<Film | null>(
    null
  );

  // Add state for comparison mode
  const [comparisonMode, setComparisonMode] =
    useState<ComparisonMode>("compareByFilm");

  // Get theme colors
  const { colors, theme } = useTheme();

  // Get safe area insets with fallback values
  const insets = useSafeAreaInsets();

  // Handle actor selection
  const handleActorSelect = (actor: Actor) => {
    setSelectedActor(actor);
    setIsActorFilmographyVisible(true); // Show the modal when an actor is selected
  };

  // Reset selected actor and clear second film
  const resetActorSelection = () => {
    setSelectedActor(null);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      width: "100%",
    },
    safeArea: {
      paddingTop: insets.top,
      backgroundColor: colors.surface,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    actorSection: {
      flex: 2,
      minHeight: 200,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionHeader: {
      flexDirection: "row",
      padding: 8,
      backgroundColor: colors.headerBackground,
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    backButtonText: {
      marginLeft: 4,
      color: colors.primary,
      fontWeight: "500",
    },
    // Mode selector styles
    modeSelector: {
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modeTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginHorizontal: 5,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    inactiveTab: {
      backgroundColor: colors.headerBackground,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "500",
    },
    activeTabText: {
      color: "#fff",
    },
    inactiveTabText: {
      color: colors.text,
    },
    filmSection: {
      flex: 2,
      minHeight: 300,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

  // Render the compare by film content
  const renderCompareByFilmContent = () => (
    <>
      {/* Always show first film search */}
      <FilmSearch
        onSelectFilm={setSelectedFilm1}
        selectedFilm={selectedFilm1}
      />

      {/* Show either second film search or actor filmography */}
      {selectedActor ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Select a film with {selectedActor.name}
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={resetActorSelection}
            >
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
          <ActorFilmography
            actorId={selectedActor.id}
            actorName={selectedActor.name}
            isVisible={isActorFilmographyVisible}
            onClose={() => {
              setIsActorFilmographyVisible(false);
            }}
            onSelectFilm1={(film) => {
              setSelectedFilm1(film);
              setSelectedActor(null);
              setIsActorFilmographyVisible(false);
            }}
            onSelectFilm2={(film) => {
              setSelectedFilm2(film);
              setSelectedActor(null);
              setIsActorFilmographyVisible(false);
            }}
            selectedFilm1={selectedFilm1}
            selectedFilm2={selectedFilm2}
          />
        </>
      ) : (
        <FilmSearch
          onSelectFilm={setSelectedFilm2}
          selectedFilm={selectedFilm2}
        />
      )}

      {/* Actor comparison section */}
      <View style={styles.actorSection}>
        <ActorDisplay onActorSelect={handleActorSelect} />
      </View>
    </>
  );

  // Render the compare by actor content
  const renderCompareByActorContent = () => {
    return (
      <>
        <ActorSearch
          onSelectActor={setSelectedActor1}
          selectedActor={selectedActor1}
          defaultQuery="Tom Hanks"
          performInitialSearch={true}
          //defaultActorId={31}
        />
        <ActorSearch
          onSelectActor={setSelectedActor2}
          selectedActor={selectedActor2}
        />

        {/* Add FilmDisplay component */}
        <View style={styles.filmSection}>
          <FilmDisplay
            actor1Id={selectedActor1?.id}
            actor2Id={selectedActor2?.id}
            actor1Name={selectedActor1?.name}
            actor2Name={selectedActor2?.name}
            onFilmSelect={(film) => {
              setSelectedFilmForCast(film);
              setIsFilmCastVisible(true);
            }}
          />

          {selectedFilmForCast && (
            <FilmCast
              filmId={selectedFilmForCast.id}
              filmTitle={selectedFilmForCast.title}
              isVisible={isFilmCastVisible}
              onClose={() => setIsFilmCastVisible(false)}
              onSelectActor1={(actor) => {
                setSelectedActor1(actor);
                setIsFilmCastVisible(false);
                setSelectedFilmForCast(null);
              }}
              onSelectActor2={(actor) => {
                setSelectedActor2(actor);
                setIsFilmCastVisible(false);
                setSelectedFilmForCast(null);
              }}
              selectedActor1={selectedActor1}
              selectedActor2={selectedActor2}
            />
          )}
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Render the status bar with correct style */}
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Safe area padding for top notch */}
      <View style={styles.safeArea}>
        {/* Mode selector - now inside the safe area */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              comparisonMode === "compareByFilm"
                ? styles.activeTab
                : styles.inactiveTab,
            ]}
            onPress={() => setComparisonMode("compareByFilm")}
          >
            <Text
              style={[
                styles.tabText,
                comparisonMode === "compareByFilm"
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Compare by Film
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              comparisonMode === "compareByActor"
                ? styles.activeTab
                : styles.inactiveTab,
            ]}
            onPress={() => setComparisonMode("compareByActor")}
          >
            <Text
              style={[
                styles.tabText,
                comparisonMode === "compareByActor"
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Compare by Actor
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Render content based on selected mode */}
        {comparisonMode === "compareByFilm"
          ? renderCompareByFilmContent()
          : renderCompareByActorContent()}
      </ScrollView>
    </View>
  );
};

export default MainScreen;
