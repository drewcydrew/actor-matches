import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import tmdbApi, { Film } from "../api/tmdbApi";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface FilmSearchProps {
  onSelectFilm: (film: Film) => void;
  initiallyExpanded?: boolean;
  onExpandStateChange?: (isExpanded: boolean) => void;
  selectedFilm?: Film | null;
}

const FilmSearch = ({
  onSelectFilm,
  initiallyExpanded = true,
  onExpandStateChange,
  selectedFilm,
}: FilmSearchProps) => {
  // Get theme colors
  const { colors } = useTheme();

  // Regular state
  const [searchQuery, setSearchQuery] = useState("");
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Collapse state
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const heightValue = useRef(new Animated.Value(1)).current;

  const toggleExpanded = () => {
    // Existing toggle function...
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    Animated.timing(heightValue, {
      toValue: newExpandedState ? 1 : 0.15,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (onExpandStateChange) {
      onExpandStateChange(newExpandedState);
    }
  };

  // New function to clear search
  const clearSearch = () => {
    setSearchQuery("");
    setFilms([]);
    setError("");
  };

  const searchFilms = async () => {
    // Existing search function...
    if (!searchQuery.trim()) {
      setError("Please enter a film title");
      return;
    }

    setLoading(true);
    setError("");
    setFilms([]);

    try {
      const movieData = await tmdbApi.searchMovies(searchQuery);

      if (movieData.results && movieData.results.length > 0) {
        setFilms(
          movieData.results.sort(
            (a: Film, b: Film) => b.popularity - a.popularity
          )
        );
      } else {
        setError("No films found");
      }
    } catch (err) {
      setError("An error occurred while searching");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Existing renderFilm function...
  const renderFilm = ({ item }: { item: Film }) => (
    <TouchableOpacity
      style={[
        styles(colors).filmItem,
        selectedFilm?.id === item.id ? styles(colors).selectedFilm : null,
      ]}
      onPress={() => onSelectFilm(item)}
      activeOpacity={0.7}
    >
      {item.poster_path && (
        <Image
          source={{
            uri: `https://image.tmdb.org/t/p/w92${item.poster_path}`,
          }}
          style={styles(colors).poster}
        />
      )}
      <View style={styles(colors).filmDetails}>
        <Text style={styles(colors).filmTitle}>{item.title || "Untitled"}</Text>
        <Text style={styles(colors).filmYear}>
          {item.release_date
            ? new Date(item.release_date).getFullYear().toString()
            : "Unknown"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Function to get header content based on expanded state and selection
  const getHeaderContent = () => {
    if (isExpanded) {
      return <Text style={styles(colors).sectionTitle}>Films</Text>;
    } else if (selectedFilm) {
      return (
        <View style={styles(colors).collapsedHeader}>
          {selectedFilm.poster_path && (
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w92${selectedFilm.poster_path}`,
              }}
              style={styles(colors).headerPoster}
            />
          )}
          <View style={styles(colors).headerTextContainer}>
            <Text style={styles(colors).headerFilmTitle} numberOfLines={1}>
              {selectedFilm.title}
            </Text>
            {selectedFilm.release_date && (
              <Text style={styles(colors).headerFilmYear}>
                {new Date(selectedFilm.release_date).getFullYear()}
              </Text>
            )}
          </View>
        </View>
      );
    } else {
      return <Text style={styles(colors).sectionTitle}>Select a film</Text>;
    }
  };

  return (
    <Animated.View style={[styles(colors).container, { flex: heightValue }]}>
      {/* Header with collapse toggle */}
      <View style={styles(colors).headerRow}>
        {getHeaderContent()}
        <TouchableOpacity
          onPress={toggleExpanded}
          style={styles(colors).collapseButton}
        >
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Content area - only shown when expanded */}
      {isExpanded && (
        <View style={styles(colors).searchContainer}>
          <View style={styles(colors).inputRow}>
            <View style={styles(colors).inputContainer}>
              <TextInput
                style={styles(colors).input}
                placeholder="Enter film title"
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                //color={colors.text}
              />
              {/* Clear button - only shown when there's text */}
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles(colors).clearButton}
                  onPress={clearSearch}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles(colors).button}
              onPress={searchFilms}
            >
              <Text style={styles(colors).buttonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles(colors).error}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={films}
              renderItem={renderFilm}
              keyExtractor={(item) => item.id.toString()}
              style={styles(colors).list}
              ListEmptyComponent={
                !error && !loading ? (
                  <Text style={styles(colors).emptyText}>
                    Search for a film to see results
                  </Text>
                ) : null
              }
            />
          )}
        </View>
      )}
    </Animated.View>
  );
};

// Use a function to create styles with dynamic theme colors
const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      overflow: "hidden",
    },
    searchContainer: {
      flex: 1,
      padding: 8,
      width: "100%",
      backgroundColor: colors.background,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.headerBackground,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    collapsedHeader: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    headerPoster: {
      width: 24,
      height: 36,
      marginRight: 8,
      borderRadius: 2,
      backgroundColor: colors.placeholderBackground,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerFilmTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    headerFilmYear: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    collapseButton: {
      padding: 4,
      marginLeft: 8,
    },
    filmItem: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      backgroundColor: colors.background,
    },
    selectedFilm: {
      backgroundColor: colors.selectedItem,
    },
    inputRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    inputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      height: 36,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      marginRight: 8,
      backgroundColor: colors.surface,
      position: "relative",
    },
    input: {
      flex: 1,
      color: colors.text,
      height: "100%",
      paddingRight: 24, // Space for the clear button
    },
    clearButton: {
      padding: 3,
      justifyContent: "center",
      alignItems: "center",
    },
    button: {
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 14,
    },
    list: {
      flex: 1,
    },
    poster: {
      width: 40,
      height: 60,
      marginRight: 8,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
    },
    filmDetails: {
      flex: 1,
      justifyContent: "center",
    },
    filmTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    filmYear: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    error: {
      color: colors.error,
      marginBottom: 8,
      textAlign: "center",
      fontSize: 12,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

export default FilmSearch;
