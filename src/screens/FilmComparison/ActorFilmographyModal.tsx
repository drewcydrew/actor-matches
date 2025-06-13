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
import tmdbApi, { Film, TVShow } from "../../api/tmdbApi";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { SelectedActor } from "../../context/FilmContext";

interface ActorFilmographyModalProps {
  actorId: number;
  actorName?: string;
  onSelectFilm1: (film: Film) => void;
  onSelectFilm2: (film: Film) => void;
  onSelectActor1?: (actor: SelectedActor) => void; // New prop for actor 1 selection
  onSelectActor2?: (actor: SelectedActor) => void; // New prop for actor 2 selection
  isVisible: boolean;
  onClose: () => void;
  selectedFilm1?: Film | null;
  selectedFilm2?: Film | null;
  selectedActor1?: SelectedActor | null; // To check if this actor is already selected
  selectedActor2?: SelectedActor | null; // To check if this actor is already selected
  actorProfilePath?: string; // Added to pass the profile path
}

type MediaType = "movies" | "tv" | "all";
type MediaItem = (Film | TVShow) & { media_type: "movie" | "tv" };

const ActorFilmographyModal = ({
  actorId,
  actorName = "Actor",
  onSelectFilm1,
  onSelectFilm2,
  onSelectActor1,
  onSelectActor2,
  isVisible,
  onClose,
  selectedFilm1,
  selectedFilm2,
  selectedActor1,
  selectedActor2,
  actorProfilePath,
}: ActorFilmographyModalProps) => {
  const { colors } = useTheme();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showItemOptions, setShowItemOptions] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("movies");
  const [showActorOptions, setShowActorOptions] = useState(false); // New state for actor options

  // Check if this actor is already selected as Actor 1 or Actor 2
  const isSelectedAsActor1 = !!selectedActor1 && selectedActor1.id === actorId;
  const isSelectedAsActor2 = !!selectedActor2 && selectedActor2.id === actorId;

  useEffect(() => {
    if (isVisible && actorId) {
      fetchCredits();
    }
  }, [actorId, isVisible, mediaType]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError("");

      let movieCredits: MediaItem[] = [];
      let tvCredits: MediaItem[] = [];

      // Fetch movie credits if needed
      if (mediaType === "movies" || mediaType === "all") {
        const movieResponse = await tmdbApi.getActorMovieCredits(actorId);
        if (movieResponse.cast && movieResponse.cast.length > 0) {
          movieCredits = movieResponse.cast
            .filter((item) => item.release_date)
            .map((item) => ({ ...item, media_type: "movie" }));
        }
      }

      // Fetch TV credits if needed
      if (mediaType === "tv" || mediaType === "all") {
        const tvResponse = await tmdbApi.getActorTVCredits(actorId);
        if (tvResponse.cast && tvResponse.cast.length > 0) {
          tvCredits = tvResponse.cast
            .filter((item) => item.first_air_date)
            .map((item) => ({ ...item, media_type: "tv" }));
        }
      }

      // Combine and sort by popularity
      const combined = [...movieCredits, ...tvCredits].sort(
        (a, b) => b.popularity - a.popularity
      );

      if (combined.length > 0) {
        setMediaItems(combined);
      } else {
        setError(
          `No ${mediaType === "all" ? "media" : mediaType} found for this actor`
        );
      }
    } catch (err) {
      console.error("Failed to fetch actor's credits:", err);
      setError(
        `Failed to load actor's ${mediaType === "all" ? "credits" : mediaType}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: MediaItem) => {
    setSelectedItem(item);
    setShowItemOptions(true);
  };

  const handleSelectOption = (option: "film1" | "film2") => {
    if (selectedItem) {
      // Convert TV shows to Film format if needed
      const filmItem: Film =
        selectedItem.media_type === "tv"
          ? {
              id: selectedItem.id,
              title: (selectedItem as TVShow).name,
              release_date: (selectedItem as TVShow).first_air_date,
              character: selectedItem.character,
              popularity: selectedItem.popularity,
              overview: selectedItem.overview,
              poster_path: selectedItem.poster_path,
              vote_average: selectedItem.vote_average,
            }
          : (selectedItem as Film);

      if (option === "film1") {
        onSelectFilm1(filmItem);
      } else {
        onSelectFilm2(filmItem);
      }
      // Close modal and reset states
      onClose();
      setShowItemOptions(false);
      setSelectedItem(null);
    }
  };

  const handleCloseModal = () => {
    onClose();
    setShowItemOptions(false);
    setSelectedItem(null);
    setShowActorOptions(false); // Reset actor options state
  };

  // New function to handle actor selection
  const handleSelectActor = (option: "actor1" | "actor2") => {
    const actorData: SelectedActor = {
      id: actorId,
      name: actorName,
      profile_path: actorProfilePath,
    };

    if (option === "actor1" && onSelectActor1) {
      onSelectActor1(actorData);
    } else if (option === "actor2" && onSelectActor2) {
      onSelectActor2(actorData);
    }

    // Close the options dialog but keep the modal open
    setShowActorOptions(false);
  };

  // Function to open the actor selection options dialog
  const openActorOptions = () => {
    setShowActorOptions(true);
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    const isMovie = item.media_type === "movie";
    const title = isMovie ? (item as Film).title : (item as TVShow).name;
    const releaseDate = isMovie
      ? (item as Film).release_date
      : (item as TVShow).first_air_date;
    const year = releaseDate
      ? new Date(releaseDate).getFullYear().toString()
      : "Unknown";

    return (
      <TouchableOpacity
        style={[
          styles(colors).filmItem,
          selectedItem?.id === item.id ? styles(colors).selectedFilmItem : null,
          selectedFilm1?.id === item.id ? styles(colors).film1Item : null,
          selectedFilm2?.id === item.id ? styles(colors).film2Item : null,
        ]}
        onPress={() => handleItemPress(item)}
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
          <Text style={styles(colors).filmTitle}>{title || "Untitled"}</Text>
          <View style={styles(colors).mediaTypeContainer}>
            <Text style={styles(colors).filmYear}>{year}</Text>
            <Text style={styles(colors).mediaTypeLabel}>
              {isMovie ? "Movie" : "TV"}
            </Text>
          </View>
          {item.character && (
            <Text style={styles(colors).character}>as {item.character}</Text>
          )}
          {!isMovie && (item as TVShow).episode_count && (
            <Text style={styles(colors).episodeCount}>
              {(item as TVShow).episode_count} episode
              {(item as TVShow).episode_count !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {/* Indicate if this item is already selected */}
        {selectedFilm1?.id === item.id && (
          <View style={styles(colors).filmIndicator}>
            <Text style={styles(colors).indicatorText}>Film 1</Text>
          </View>
        )}
        {selectedFilm2?.id === item.id && (
          <View
            style={[
              styles(colors).filmIndicator,
              {
                backgroundColor: colors.primary || colors.primary || "orange",
              },
            ]}
          >
            <Text style={styles(colors).indicatorText}>Film 2</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
            <Text style={styles(colors).modalTitle}>{actorName}</Text>

            {/* Add a button to open actor selection options */}
            <View style={styles(colors).headerActions}>
              <TouchableOpacity
                style={styles(colors).selectActorButton}
                onPress={openActorOptions}
              >
                <Ionicons name="person-add" size={20} color={colors.primary} />
                <Text style={styles(colors).selectActorText}>Select Actor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles(colors).closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Media type selector */}
          <View style={styles(colors).mediaTypeSelector}>
            <TouchableOpacity
              style={[
                styles(colors).mediaTypeButton,
                mediaType === "movies" &&
                  styles(colors).selectedMediaTypeButton,
              ]}
              onPress={() => setMediaType("movies")}
            >
              <Text
                style={[
                  styles(colors).mediaTypeText,
                  mediaType === "movies" &&
                    styles(colors).selectedMediaTypeText,
                ]}
              >
                Movies
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles(colors).mediaTypeButton,
                mediaType === "tv" && styles(colors).selectedMediaTypeButton,
              ]}
              onPress={() => setMediaType("tv")}
            >
              <Text
                style={[
                  styles(colors).mediaTypeText,
                  mediaType === "tv" && styles(colors).selectedMediaTypeText,
                ]}
              >
                TV Shows
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles(colors).mediaTypeButton,
                mediaType === "all" && styles(colors).selectedMediaTypeButton,
              ]}
              onPress={() => setMediaType("all")}
            >
              <Text
                style={[
                  styles(colors).mediaTypeText,
                  mediaType === "all" && styles(colors).selectedMediaTypeText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Credits content */}
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
                data={mediaItems}
                renderItem={renderMediaItem}
                keyExtractor={(item, index) =>
                  `${item.media_type}-${item.id}-${
                    item.character?.substring(0, 10) || ""
                  }-${index}`
                }
                ListEmptyComponent={
                  <Text style={styles(colors).emptyText}>No credits found</Text>
                }
              />
            )}
          </View>

          {/* Media selection options overlay */}
          {showItemOptions && selectedItem && (
            <View style={styles(colors).optionsOverlay}>
              <View style={styles(colors).optionsContainer}>
                <Text style={styles(colors).optionsTitle}>
                  Choose where to add "
                  {selectedItem.media_type === "movie"
                    ? (selectedItem as Film).title
                    : (selectedItem as TVShow).name}
                  "
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
                    setShowItemOptions(false);
                    setSelectedItem(null);
                  }}
                >
                  <Text style={styles(colors).cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* New actor selection options overlay */}
          {showActorOptions && (
            <View style={styles(colors).optionsOverlay}>
              <View style={styles(colors).optionsContainer}>
                <Text style={styles(colors).optionsTitle}>
                  Select {actorName} as
                </Text>

                <TouchableOpacity
                  style={[
                    styles(colors).optionButton,
                    isSelectedAsActor1 && styles(colors).selectedOptionButton,
                  ]}
                  onPress={() => handleSelectActor("actor1")}
                  disabled={isSelectedAsActor1}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles(colors).optionText}>
                    {isSelectedAsActor1
                      ? "Already selected as Actor 1"
                      : "Actor 1"}
                    {selectedActor1 && !isSelectedAsActor1
                      ? ` (replaces ${selectedActor1.name})`
                      : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles(colors).optionButton,
                    isSelectedAsActor2 && styles(colors).selectedOptionButton,
                  ]}
                  onPress={() => handleSelectActor("actor2")}
                  disabled={isSelectedAsActor2}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles(colors).optionText}>
                    {isSelectedAsActor2
                      ? "Already selected as Actor 2"
                      : "Actor 2"}
                    {selectedActor2 && !isSelectedAsActor2
                      ? ` (replaces ${selectedActor2.name})`
                      : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(colors).cancelButton}
                  onPress={() => setShowActorOptions(false)}
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
      padding: 12,
      backgroundColor: colors.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
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
    mediaTypeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    filmYear: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 8,
    },
    mediaTypeLabel: {
      fontSize: 12,
      backgroundColor: colors.surface || colors.card,
      color: colors.textSecondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    character: {
      fontSize: 12,
      fontStyle: "italic",
      color: colors.textSecondary,
    },
    episodeCount: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
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
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    selectActorButton: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 12,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    selectActorText: {
      color: colors.primary,
      fontSize: 12,
      marginLeft: 4,
      fontWeight: "500",
    },
    selectedOptionButton: {
      backgroundColor: colors.primary + "20", // Semi-transparent version of primary color
      borderColor: colors.primary,
    },
  });

export default ActorFilmographyModal;
