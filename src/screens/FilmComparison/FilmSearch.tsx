import React, { useState, useCallback } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";
import { MediaItem } from "../../types/types";

// Add debounce helper function for smoother autocomplete
const debounce = (func: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

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
  const { getMediaItems } = useFilmContext();

  // Regular state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state (replacing expanded state)
  const [isModalVisible, setIsModalVisible] = useState(false);

  // New state for autocomplete
  const [isAutocompleting, setIsAutocompleting] = useState(false);

  // Create debounced search function for autocomplete
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        setIsAutocompleting(false);
        return;
      }

      setLoading(true);
      setError("");
      setIsAutocompleting(true);

      try {
        const { results, error: searchError } = await getMediaItems(query);

        if (searchError) {
          setError(searchError);
          setSearchResults([]);
        } else if (results.length > 0) {
          // Show top 6 results for autocomplete
          setSearchResults(results.slice(0, 6));
        } else {
          setSearchResults([]);
          setError("No matching titles found");
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
        setSearchResults([]);
        setError("Error searching for media");
      } finally {
        setLoading(false);
      }
    }, 300), // 300ms delay before searching
    [getMediaItems]
  );

  // Handle input changes and trigger autocomplete
  const handleInputChange = (text: string) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      debouncedSearch(text);
    } else {
      setSearchResults([]);
      setIsAutocompleting(false);
      setError("");
    }
  };

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

    // Reset autocomplete when opening/closing modal
    if (!isModalVisible) {
      setIsAutocompleting(false);
    }
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setError("");
    setIsAutocompleting(false);
  };

  // Function to handle media search (full search)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a title");
      return;
    }

    setLoading(true);
    setError("");
    setSearchResults([]);
    setIsAutocompleting(false); // We're doing a full search, not autocomplete

    try {
      const { results, error: searchError } = await getMediaItems(searchQuery);

      if (searchError) {
        setError(searchError);
      } else if (results.length > 0) {
        setSearchResults(results);
      } else {
        setError("No matching titles found");
      }
    } catch (err) {
      setError("An error occurred while searching for media");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Media item renderer
  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    // Get title/name and release date based on item type
    const title = item.name || "Untitled";
    const releaseDate =
      item.media_type === "tv" ? item.first_air_date : item.release_date;

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
          onSelectMedia(item);
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
          <Text style={styles(colors).mediaTitle}>{title}</Text>
          <View style={styles(colors).mediaTypeContainer}>
            <Text style={styles(colors).mediaYear}>{year}</Text>
            <Text style={styles(colors).mediaTypeLabel}>
              {item.media_type === "tv" ? "TV" : "Movie"}
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
              {selectedMedia.name}
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

            {/* Search controls */}
            <View style={styles(colors).searchContainer}>
              <View style={styles(colors).inputRow}>
                <View style={styles(colors).inputContainer}>
                  <TextInput
                    style={styles(colors).input}
                    placeholder="Enter movie or TV show title"
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={handleInputChange}
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

              {/* Autocomplete suggestions */}
              {isAutocompleting && searchQuery.length >= 2 && (
                <View style={styles(colors).autoCompleteContainer}>
                  {loading ? (
                    <View style={styles(colors).autocompleteLoading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles(colors).autocompleteLoadingText}>
                        Finding movies and TV shows...
                      </Text>
                    </View>
                  ) : searchResults.length > 0 ? (
                    <>
                      <Text style={styles(colors).suggestionsTitle}>
                        Suggestions
                      </Text>
                      <FlatList
                        data={searchResults}
                        renderItem={renderMediaItem}
                        keyExtractor={(item) => `${item.media_type}-${item.id}`}
                        style={styles(colors).autoCompleteList}
                      />
                    </>
                  ) : error ? (
                    <Text style={styles(colors).autocompleteError}>
                      {error}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Show full search results when not in autocomplete mode */}
              {!isAutocompleting && (
                <>
                  {error ? (
                    <Text style={styles(colors).error}>{error}</Text>
                  ) : null}

                  {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                  ) : (
                    <FlatList
                      data={searchResults}
                      renderItem={renderMediaItem}
                      keyExtractor={(item) => `${item.media_type}-${item.id}`}
                      style={styles(colors).list}
                      ListEmptyComponent={
                        !error && !loading ? (
                          <Text style={styles(colors).emptyText}>
                            Search for a movie or TV show to see results
                          </Text>
                        ) : null
                      }
                    />
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Updated styles
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
    // Add new styles for autocomplete
    autoCompleteContainer: {
      backgroundColor: colors.surface || colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
      maxHeight: 300,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
      paddingVertical: 5,
    },
    autoCompleteList: {
      maxHeight: 280,
    },
    suggestionsTitle: {
      fontSize: 12,
      color: colors.textSecondary,
      paddingHorizontal: 12,
      paddingBottom: 4,
      marginBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    autocompleteLoading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
    },
    autocompleteLoadingText: {
      marginLeft: 8,
      color: colors.textSecondary,
      fontSize: 14,
    },
    autocompleteError: {
      padding: 12,
      color: colors.error,
      textAlign: "center",
    },
  });

export default FilmSearch;
