import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { Film, TVShow } from "../../api/tmdbApi";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext, MediaItem } from "../../context/FilmContext";

// Define SearchItem type for local component use
type SearchItem =
  | (Film & { media_type?: "movie" })
  | (TVShow & { media_type: "tv" });

interface MediaSearchProps {
  onSelectMedia: (media: MediaItem | null) => void;
  initiallyExpanded?: boolean;
  onExpandStateChange?: (isExpanded: boolean) => void;
  selectedMedia?: MediaItem | null;
}

const FilmSearch = ({
  onSelectMedia,
  onExpandStateChange,
  selectedMedia,
}: MediaSearchProps) => {
  // Get theme colors and film context
  const { colors } = useTheme();
  const { searchFilms, searchTVShows } = useFilmContext();

  // Regular state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchMode, setSearchMode] = useState<"movies" | "tv">("movies");

  // Modal state (replacing expanded state)
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Handle clear media selection
  const handleClearMedia = (event: any) => {
    // Stop the event from propagating to parent (which would open the modal)
    event.stopPropagation();
    onSelectMedia(null);
  };

  // Modal toggle function
  const toggleModal = () => {
    const newModalState = !isModalVisible;
    setIsModalVisible(newModalState);

    if (onExpandStateChange) {
      onExpandStateChange(newModalState);
    }
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setError("");
  };

  // Function to handle media search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a title");
      return;
    }

    setLoading(true);
    setError("");
    setSearchResults([]);

    try {
      if (searchMode === "movies") {
        const { results, error: searchError } = await searchFilms(searchQuery);

        if (searchError) {
          setError(searchError);
        } else if (results.length > 0) {
          // Add media_type to movie results
          setSearchResults(
            results.map((movie) => ({ ...movie, media_type: "movie" as const }))
          );
        } else {
          setError("No films found");
        }
      } else {
        // Handle TV show search
        const { results, error: searchError } = await searchTVShows(
          searchQuery
        );

        if (searchError) {
          setError(searchError);
        } else if (results.length > 0) {
          // Add media_type property to TV shows
          setSearchResults(
            results.map((show) => ({ ...show, media_type: "tv" as const }))
          );
        } else {
          setError("No TV shows found");
        }
      }
    } catch (err) {
      setError(
        `An error occurred while searching for ${
          searchMode === "movies" ? "movies" : "TV shows"
        }`
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Convert search result to MediaItem
  const convertToMediaItem = (item: SearchItem): MediaItem => {
    const isTVShow = item.media_type === "tv" || "name" in item;

    if (isTVShow) {
      const tvShow = item as TVShow & { media_type: "tv" };
      return {
        id: tvShow.id,
        title: tvShow.name,
        name: tvShow.name,
        first_air_date: tvShow.first_air_date,
        popularity: tvShow.popularity,
        overview: tvShow.overview,
        poster_path: tvShow.poster_path,
        vote_average: tvShow.vote_average,
        media_type: "tv",
      };
    } else {
      const movie = item as Film & { media_type?: "movie" };
      return {
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        popularity: movie.popularity,
        overview: movie.overview,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        media_type: "movie",
      };
    }
  };

  // Media item renderer
  const renderMediaItem = ({ item }: { item: SearchItem }) => {
    // Check if this is a TV show based on media_type or name property
    const isTVShow = item.media_type === "tv" || "name" in item;

    // Get title/name and release date based on item type
    const title = isTVShow ? (item as TVShow).name : (item as Film).title;
    const releaseDate = isTVShow
      ? (item as TVShow).first_air_date
      : (item as Film).release_date;

    const year = releaseDate
      ? new Date(releaseDate).getFullYear().toString()
      : "Unknown";

    return (
      <TouchableOpacity
        style={[
          styles(colors).mediaItem,
          selectedMedia?.id === item.id ? styles(colors).selectedMedia : null,
        ]}
        onPress={() => {
          const mediaItem = convertToMediaItem(item);
          onSelectMedia(mediaItem);
          setIsModalVisible(false); // Close modal after selection
        }}
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
        <View style={styles(colors).mediaDetails}>
          <Text style={styles(colors).mediaTitle}>{title || "Untitled"}</Text>
          <View style={styles(colors).mediaTypeContainer}>
            <Text style={styles(colors).mediaYear}>{year}</Text>
            <Text style={styles(colors).mediaTypeLabel}>
              {isTVShow ? "TV" : "Movie"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Function to generate header content for the collapsed view
  const getHeaderContent = () => {
    if (selectedMedia) {
      const releaseDate =
        selectedMedia.media_type === "tv"
          ? selectedMedia.first_air_date
          : selectedMedia.release_date;

      const year = releaseDate
        ? new Date(releaseDate).getFullYear().toString()
        : "";

      return (
        <View style={styles(colors).collapsedHeader}>
          {selectedMedia.poster_path && (
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w92${selectedMedia.poster_path}`,
              }}
              style={styles(colors).headerPoster}
            />
          )}
          <View style={styles(colors).headerTextContainer}>
            <Text style={styles(colors).headerMediaTitle} numberOfLines={1}>
              {selectedMedia.title}
            </Text>
            {year && (
              <Text style={styles(colors).headerMediaYear}>
                {year} -{" "}
                {selectedMedia.media_type === "tv" ? "TV Show" : "Movie"}
              </Text>
            )}
          </View>
        </View>
      );
    } else {
      return <Text style={styles(colors).sectionTitle}>Select a title</Text>;
    }
  };

  return (
    <>
      {/* Collapsed view - always visible */}
      <View style={styles(colors).container}>
        <TouchableOpacity
          style={styles(colors).headerRow}
          onPress={toggleModal}
          activeOpacity={0.7}
        >
          {getHeaderContent()}
          <View style={styles(colors).actionButtons}>
            {selectedMedia && (
              <TouchableOpacity
                style={styles(colors).clearButton}
                onPress={handleClearMedia}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
            <View style={styles(colors).collapseButton}>
              <Ionicons name="search" size={24} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal for search functionality */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).modalContent}>
            {/* Modal header */}
            <View style={styles(colors).modalHeader}>
              <Text style={styles(colors).modalTitle}>
                {selectedMedia ? "Change selection" : "Search"}
              </Text>
              <TouchableOpacity
                style={styles(colors).closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Media type selector */}
            <View style={styles(colors).mediaTypeSelector}>
              <TouchableOpacity
                style={[
                  styles(colors).mediaTypeButton,
                  searchMode === "movies" &&
                    styles(colors).selectedMediaTypeButton,
                ]}
                onPress={() => setSearchMode("movies")}
              >
                <Text
                  style={[
                    styles(colors).mediaTypeText,
                    searchMode === "movies" &&
                      styles(colors).selectedMediaTypeText,
                  ]}
                >
                  Movies
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles(colors).mediaTypeButton,
                  searchMode === "tv" && styles(colors).selectedMediaTypeButton,
                ]}
                onPress={() => setSearchMode("tv")}
              >
                <Text
                  style={[
                    styles(colors).mediaTypeText,
                    searchMode === "tv" && styles(colors).selectedMediaTypeText,
                  ]}
                >
                  TV Shows
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search controls */}
            <View style={styles(colors).searchContainer}>
              <View style={styles(colors).inputRow}>
                <View style={styles(colors).inputContainer}>
                  <TextInput
                    style={styles(colors).input}
                    placeholder={`Enter ${
                      searchMode === "movies" ? "film" : "TV show"
                    } title`}
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus={true}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles(colors).searchClearButton}
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
                  onPress={handleSearch}
                >
                  <Text style={styles(colors).buttonText}>Search</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles(colors).error}>{error}</Text> : null}

              {/* Results area */}
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <FlatList
                  data={searchResults}
                  renderItem={renderMediaItem}
                  keyExtractor={(item) =>
                    `${item.media_type || "movie"}-${item.id}`
                  }
                  style={styles(colors).list}
                  ListEmptyComponent={
                    !error && !loading ? (
                      <Text style={styles(colors).emptyText}>
                        Search for{" "}
                        {searchMode === "movies" ? "a film" : "a TV show"} to
                        see results
                      </Text>
                    ) : null
                  }
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Updated styles with renamed classes for clarity
const styles = (colors: any) =>
  StyleSheet.create({
    // Existing styles with renamed properties
    container: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
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
    headerMediaTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    headerMediaYear: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    collapseButton: {
      padding: 4,
      marginLeft: 8,
    },
    clearButton: {
      padding: 4,
      marginRight: 4,
    },
    // Media type selector
    mediaTypeSelector: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    mediaTypeButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedMediaTypeButton: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    mediaTypeText: {
      color: colors.textSecondary,
      fontWeight: "500",
    },
    selectedMediaTypeText: {
      color: colors.primary,
      fontWeight: "600",
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "90%",
      maxHeight: "80%",
      backgroundColor: colors.background,
      borderRadius: 10,
      overflow: "hidden",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      flex: 1,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    // Search container styles
    searchContainer: {
      flex: 1,
      padding: 16,
    },
    inputRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    inputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      marginRight: 8,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      color: colors.text,
      height: "100%",
      paddingRight: 24,
    },
    searchClearButton: {
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
    // Media item styles (renamed from film)
    mediaItem: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      backgroundColor: colors.background,
    },
    selectedMedia: {
      backgroundColor: colors.selectedItem,
    },
    poster: {
      width: 40,
      height: 60,
      marginRight: 8,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
    },
    mediaDetails: {
      flex: 1,
      justifyContent: "center",
    },
    mediaTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    mediaTypeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
    },
    mediaYear: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: 8,
    },
    mediaTypeLabel: {
      fontSize: 10,
      backgroundColor: colors.surface || colors.card,
      color: colors.textSecondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
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
