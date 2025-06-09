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
import { Film } from "../../api/tmdbApi";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";

interface FilmSearchProps {
  onSelectFilm: (film: Film | null) => void; // Updated to accept null
  initiallyExpanded?: boolean;
  onExpandStateChange?: (isExpanded: boolean) => void;
  selectedFilm?: Film | null;
}

const FilmSearch = ({
  onSelectFilm,
  onExpandStateChange,
  selectedFilm,
}: FilmSearchProps) => {
  // Get theme colors and film context
  const { colors } = useTheme();
  const { searchFilms } = useFilmContext();

  // Regular state
  const [searchQuery, setSearchQuery] = useState("");
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state (replacing expanded state)
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Handle clear film selection
  const handleClearFilm = (event: any) => {
    // Stop the event from propagating to parent (which would open the modal)
    event.stopPropagation();
    onSelectFilm(null);
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
    setFilms([]);
    setError("");
  };

  // Function to handle film search
  const handleSearchFilms = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a film title");
      return;
    }

    setLoading(true);
    setError("");
    setFilms([]);

    try {
      const { results, error: searchError } = await searchFilms(searchQuery);

      if (searchError) {
        setError(searchError);
      } else if (results.length > 0) {
        setFilms(results);
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

  // Film item renderer
  const renderFilm = ({ item }: { item: Film }) => (
    <TouchableOpacity
      style={[
        styles(colors).filmItem,
        selectedFilm?.id === item.id ? styles(colors).selectedFilm : null,
      ]}
      onPress={() => {
        onSelectFilm(item);
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

  // Function to generate header content for the collapsed view
  const getHeaderContent = () => {
    if (selectedFilm) {
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
            {selectedFilm && (
              <TouchableOpacity
                style={styles(colors).clearButton}
                onPress={handleClearFilm}
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

      {/* Modal for search functionality - unchanged */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        {/* Modal content unchanged */}
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).modalContent}>
            {/* Modal header */}
            <View style={styles(colors).modalHeader}>
              <Text style={styles(colors).modalTitle}>
                {selectedFilm ? "Change film" : "Search films"}
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
              {/* ...rest of the modal content (unchanged) */}
              <View style={styles(colors).inputRow}>
                <View style={styles(colors).inputContainer}>
                  <TextInput
                    style={styles(colors).input}
                    placeholder="Enter film title"
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
                  onPress={handleSearchFilms}
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
          </View>
        </View>
      </Modal>
    </>
  );
};

// Updated styles
const styles = (colors: any) =>
  StyleSheet.create({
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
    headerFilmTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    headerFilmYear: {
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
    // Modal styles remain the same
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    // ...existing styles
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
    // Film item styles
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
