import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { Film } from "../../api/tmdbApi";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";
import { Ionicons } from "@expo/vector-icons";

// Define our props
interface FilmDisplayProps {
  actor1Id?: number;
  actor2Id?: number;
  actor1Name?: string;
  actor2Name?: string;
  onFilmSelect?: (film: Film) => void;
}

const FilmDisplay = ({
  actor1Id,
  actor2Id,
  actor1Name = "First actor",
  actor2Name = "Second actor",
  onFilmSelect,
}: FilmDisplayProps) => {
  const { colors } = useTheme();
  const {
    commonFilms,
    filmsLoading,
    filmsError,
    getActorFilmography,
    setSelectedCastMember1,
    setSelectedCastMember2,
  } = useFilmContext();

  // Add function to clear both actors
  const handleClearActors = () => {
    setSelectedCastMember1(null);
    setSelectedCastMember2(null);
  };

  // Fetch filmography data when actor props change
  useEffect(() => {
    getActorFilmography(actor1Id, actor2Id, actor1Name, actor2Name);
  }, [actor1Id, actor2Id, actor1Name, actor2Name]);

  // Title text based on actor selection state
  const getTitleText = () => {
    if (!actor1Id && !actor2Id) {
      return "Select actors to see their films";
    } else if (actor1Id && !actor2Id) {
      return `Filmography of ${actor1Name}`;
    } else if (!actor1Id && actor2Id) {
      return `Filmography of ${actor2Name}`;
    } else if (actor1Id && actor2Id) {
      return `Films with both ${actor1Name} and ${actor2Name}`;
    } else {
      return "Film Display";
    }
  };

  // Determine if we should show the clear button (when at least one actor is selected)
  const shouldShowClearButton = actor1Id || actor2Id;

  return (
    <View style={styles(colors).container}>
      <View style={styles(colors).headerContainer}>
        <Text style={styles(colors).title}>{getTitleText()}</Text>

        {shouldShowClearButton && (
          <TouchableOpacity
            style={styles(colors).clearButton}
            onPress={handleClearActors}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={16} color={colors.primary} />
            <Text style={styles(colors).clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {filmsError ? (
        <Text style={styles(colors).error}>{filmsError}</Text>
      ) : null}

      {filmsLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles(colors).filmsContainer}>
          {commonFilms.length === 0 && !filmsError && !filmsLoading ? (
            <Text style={styles(colors).emptyText}>
              {!actor1Id && !actor2Id
                ? "Select actors above to see their common films"
                : actor1Id && actor2Id
                ? "No films found with both actors"
                : "No filmography information available"}
            </Text>
          ) : (
            commonFilms.map((film) => (
              <TouchableOpacity
                key={film.id.toString()}
                style={styles(colors).filmItem}
                onPress={() => onFilmSelect && onFilmSelect(film)}
                disabled={!onFilmSelect}
                activeOpacity={onFilmSelect ? 0.7 : 1}
              >
                <View style={styles(colors).filmItemContent}>
                  {film.poster_path ? (
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w92${film.poster_path}`,
                      }}
                      style={styles(colors).poster}
                    />
                  ) : (
                    <View style={styles(colors).noImagePlaceholder}>
                      <Text style={styles(colors).noImageText}>No Poster</Text>
                    </View>
                  )}
                  <View style={styles(colors).filmInfo}>
                    <Text style={styles(colors).filmTitle}>{film.title}</Text>
                    <Text style={styles(colors).filmYear}>
                      {film.release_date
                        ? new Date(film.release_date).getFullYear()
                        : "Unknown year"}
                    </Text>

                    {/* Show character info for both actors when in common film mode */}
                    {actor1Id && actor2Id ? (
                      <>
                        <Text style={styles(colors).character}>
                          {`${actor1Name} as: ${
                            film.characterForActor1 || "Unknown role"
                          }`}
                        </Text>
                        <Text style={styles(colors).character}>
                          {`${actor2Name} as: ${
                            film.characterForActor2 || "Unknown role"
                          }`}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles(colors).character}>
                        {`as: ${film.character || "Unknown role"}`}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 8,
      width: "100%",
      backgroundColor: colors.background,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 6,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    clearButtonText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "500",
      marginLeft: 4,
    },
    filmsContainer: {
      flex: 1,
    },
    filmItem: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filmItemContent: {
      flexDirection: "row",
    },
    poster: {
      width: 60,
      height: 90,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
    },
    noImagePlaceholder: {
      width: 60,
      height: 90,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    noImageText: {
      color: colors.textSecondary,
      fontSize: 10,
      textAlign: "center",
    },
    filmInfo: {
      marginLeft: 12,
      flex: 1,
      justifyContent: "center",
    },
    filmTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 2,
      color: colors.text,
    },
    filmYear: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    character: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    error: {
      color: colors.error,
      marginBottom: 8,
      textAlign: "center",
      fontSize: 14,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

export default FilmDisplay;
