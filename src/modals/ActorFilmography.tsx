import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import tmdbApi, { Film } from "../api/tmdbApi";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

interface ActorFilmographyProps {
  actorId: number;
  actorName?: string;
  onSelectFilm1: (film: Film) => void;
  onSelectFilm2: (film: Film) => void;
  isVisible: boolean;
  onClose: () => void;
  selectedFilm1?: Film | null;
  selectedFilm2?: Film | null;
}

const ActorFilmography = ({
  actorId,
  actorName = "Actor",
  onSelectFilm1,
  onSelectFilm2,
  isVisible,
  onClose,
  selectedFilm1,
  selectedFilm2,
}: ActorFilmographyProps) => {
  const { colors } = useTheme();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [showFilmOptions, setShowFilmOptions] = useState(false);

  useEffect(() => {
    const fetchFilmography = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await tmdbApi.getActorMovieCredits(actorId);

        if (response.cast && response.cast.length > 0) {
          // Sort by popularity and filter out films with no release date
          const sortedFilms = response.cast
            .filter((film) => film.release_date)
            .sort((a, b) => b.popularity - a.popularity);

          setFilms(sortedFilms);
        } else {
          setError("No films found for this actor");
        }
      } catch (err) {
        console.error("Failed to fetch actor's films:", err);
        setError("Failed to load actor's filmography");
      } finally {
        setLoading(false);
      }
    };

    if (isVisible && actorId) {
      fetchFilmography();
    }
  }, [actorId, isVisible]);

  const handleFilmPress = (film: Film) => {
    setSelectedFilm(film);
    setShowFilmOptions(true);
  };

  const handleSelectOption = (option: "film1" | "film2") => {
    if (selectedFilm) {
      if (option === "film1") {
        onSelectFilm1(selectedFilm);
      } else {
        onSelectFilm2(selectedFilm);
      }
      // Close modal and reset states
      onClose();
      setShowFilmOptions(false);
      setSelectedFilm(null);
    }
  };

  const handleCloseModal = () => {
    onClose();
    setShowFilmOptions(false);
    setSelectedFilm(null);
  };

  const renderFilm = ({ item }: { item: Film }) => (
    <TouchableOpacity
      style={[
        styles(colors).filmItem,
        selectedFilm?.id === item.id ? styles(colors).selectedFilmItem : null,
        selectedFilm1?.id === item.id ? styles(colors).film1Item : null,
        selectedFilm2?.id === item.id ? styles(colors).film2Item : null,
      ]}
      onPress={() => handleFilmPress(item)}
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
        {item.character && (
          <Text style={styles(colors).character}>as {item.character}</Text>
        )}
      </View>

      {/* Indicate if this film is already selected */}
      {selectedFilm1?.id === item.id && (
        <View style={styles(colors).filmIndicator}>
          <Text style={styles(colors).indicatorText}>Film 1</Text>
        </View>
      )}
      {selectedFilm2?.id === item.id && (
        <View
          style={[
            styles(colors).filmIndicator,
            { backgroundColor: colors.primary || colors.primary || "orange" },
          ]}
        >
          <Text style={styles(colors).indicatorText}>Film 2</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseModal}
    >
      <View style={styles(colors).modalOverlay}>
        <View style={styles(colors).modalContent}>
          {/* Modal header */}
          <View style={styles(colors).modalHeader}>
            <Text style={styles(colors).modalTitle}>
              Films with {actorName}
            </Text>
            <TouchableOpacity
              style={styles(colors).closeButton}
              onPress={handleCloseModal}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Filmography content */}
          <View style={styles(colors).filmographyContainer}>
            {loading ? (
              <View style={styles(colors).centerContent}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : error ? (
              <View style={styles(colors).centerContent}>
                <Text style={styles(colors).errorText}>{error}</Text>
              </View>
            ) : (
              <FlatList
                data={films}
                renderItem={renderFilm}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <Text style={styles(colors).emptyText}>No films found</Text>
                }
              />
            )}
          </View>

          {/* Film selection options overlay */}
          {showFilmOptions && selectedFilm && (
            <View style={styles(colors).optionsOverlay}>
              <View style={styles(colors).optionsContainer}>
                <Text style={styles(colors).optionsTitle}>
                  Choose where to add "{selectedFilm.title}"
                </Text>

                <TouchableOpacity
                  style={styles(colors).optionButton}
                  onPress={() => handleSelectOption("film1")}
                >
                  <Ionicons name="film-outline" size={20} color={colors.text} />
                  <Text style={styles(colors).optionText}>
                    Replace Film 1{" "}
                    {selectedFilm1 ? `(${selectedFilm1.title})` : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(colors).optionButton}
                  onPress={() => handleSelectOption("film2")}
                >
                  <Ionicons name="film-outline" size={20} color={colors.text} />
                  <Text style={styles(colors).optionText}>
                    Replace Film 2{" "}
                    {selectedFilm2 ? `(${selectedFilm2.title})` : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(colors).cancelButton}
                  onPress={() => {
                    setShowFilmOptions(false);
                    setSelectedFilm(null);
                  }}
                >
                  <Text style={styles(colors).cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 50,
    },
    modalContent: {
      width: "90%",
      height: "80%",
      backgroundColor: colors.background,
      borderRadius: 10,
      overflow: "hidden",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
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
    filmographyContainer: {
      flex: 1,
    },
    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    filmItem: {
      flexDirection: "row",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedFilmItem: {
      backgroundColor: colors.selectedItem,
    },
    film1Item: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    film2Item: {
      borderLeftWidth: 4,
      borderLeftColor: colors.secondary || colors.accent || "orange",
    },
    filmIndicator: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
      justifyContent: "center",
    },
    indicatorText: {
      color: "white",
      fontSize: 10,
      fontWeight: "bold",
    },
    poster: {
      width: 45,
      height: 68,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
    },
    filmDetails: {
      marginLeft: 12,
      flex: 1,
      justifyContent: "center",
    },
    filmTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    filmYear: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    character: {
      fontSize: 12,
      fontStyle: "italic",
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.error,
      textAlign: "center",
      margin: 20,
    },
    emptyText: {
      textAlign: "center",
      margin: 20,
      color: colors.textSecondary,
    },
    optionsOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    optionsContainer: {
      width: "80%",
      backgroundColor: colors.surface || colors.background,
      borderRadius: 8,
      padding: 16,
      elevation: 6,
    },
    optionsTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
      textAlign: "center",
    },
    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginBottom: 12,
      backgroundColor: colors.surface || colors.card || colors.background,
    },
    optionText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 12,
    },
    cancelButton: {
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 4,
    },
    cancelButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
    },
  });

export default ActorFilmography;
