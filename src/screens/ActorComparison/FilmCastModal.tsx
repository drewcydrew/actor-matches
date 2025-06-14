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
import tmdbApi, { CastMember, Film } from "../../api/tmdbApi";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { MediaItem } from "../../context/FilmContext";

// Define an Actor interface for our component
export interface Actor {
  id: number;
  name: string;
  profile_path?: string;
  character?: string;
}

interface FilmCastModalProps {
  filmId: number;
  filmTitle?: string;
  filmPosterPath?: string;
  mediaType?: "movie" | "tv";  // Add media type to handle both movies and TV shows
  onSelectActor1: (actor: Actor) => void;
  onSelectActor2: (actor: Actor) => void;
  // New props for film selection
  onSelectFilm1?: (film: MediaItem) => void;
  onSelectFilm2?: (film: MediaItem) => void;
  isVisible: boolean;
  onClose: () => void;
  selectedActor1?: Actor | null;
  selectedActor2?: Actor | null;
  // Add selected films for comparison
  selectedFilm1?: MediaItem | null;
  selectedFilm2?: MediaItem | null;
}

const FilmCastModal = ({
  filmId,
  filmTitle = "Film",
  filmPosterPath,
  mediaType = "movie",
  onSelectActor1,
  onSelectActor2,
  onSelectFilm1,
  onSelectFilm2,
  isVisible,
  onClose,
  selectedActor1,
  selectedActor2,
  selectedFilm1,
  selectedFilm2,
}: FilmCastModalProps) => {
  const { colors } = useTheme();
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedActor, setSelectedActor] = useState<CastMember | null>(null);
  const [showActorOptions, setShowActorOptions] = useState(false);
  // Add state for film selection
  const [showFilmOptions, setShowFilmOptions] = useState(false);

  // Check if this film is already selected as Film 1 or Film 2
  const isSelectedAsFilm1 = !!selectedFilm1 && selectedFilm1.id === filmId;
  const isSelectedAsFilm2 = !!selectedFilm2 && selectedFilm2.id === filmId;

  useEffect(() => {
    const fetchCast = async () => {
      try {
        setLoading(true);
        setError("");

        let response;
        // Fetch cast based on media type
        if (mediaType === "tv") {
          response = await tmdbApi.getTVShowAggregateCredits(filmId);
          // Transform TV show aggregate credits to match CastMember format
          if (response && response.cast && response.cast.length > 0) {
            const transformedCast = response.cast.map(actor => ({
              id: actor.id,
              name: actor.name,
              // Use the first character role or combine them
              character: actor.roles && actor.roles.length > 0
                ? actor.roles.map(role => role.character).join(', ')
                : "Unknown role",
              profile_path: actor.profile_path,
              order: actor.order || 0,
              gender: actor.gender,
              popularity: actor.popularity
            }));
            setCast(transformedCast);
          }
        } else {
          response = await tmdbApi.getMovieCast(filmId);
          if (response && response.cast && response.cast.length > 0) {
            setCast(response.cast);
          }
        }

        if (!response || !response.cast || response.cast.length === 0) {
          setError(`No cast found for this ${mediaType === "tv" ? "TV show" : "film"}`);
        }
      } catch (err) {
        console.error(`Failed to fetch ${mediaType === "tv" ? "TV show" : "film"}'s cast:`, err);
        setError("Failed to load cast information");
      } finally {
        setLoading(false);
      }
    };

    if (isVisible && filmId) {
      fetchCast();
    }
  }, [filmId, isVisible, mediaType]);

  const handleActorPress = (actor: CastMember) => {
    setSelectedActor(actor);
    setShowActorOptions(true);
  };

  const handleSelectOption = (option: "actor1" | "actor2") => {
    if (selectedActor) {
      const actorToPass: Actor = {
        id: selectedActor.id,
        name: selectedActor.name,
        profile_path: selectedActor.profile_path,
        character: selectedActor.character,
      };

      if (option === "actor1") {
        onSelectActor1(actorToPass);
      } else {
        onSelectActor2(actorToPass);
      }

      // Close modal and reset states
      onClose();
      setShowActorOptions(false);
      setSelectedActor(null);
    }
  };

  // New function to handle film selection
  const handleSelectFilm = (option: "film1" | "film2") => {
    if (!onSelectFilm1 && !onSelectFilm2) return;
    
    const filmItem: MediaItem = {
      id: filmId,
      title: filmTitle,
      poster_path: filmPosterPath,
      popularity: 0, // Default value
      media_type: mediaType,
    };

    if (option === "film1" && onSelectFilm1) {
      onSelectFilm1(filmItem);
    } else if (option === "film2" && onSelectFilm2) {
      onSelectFilm2(filmItem);
    }

    // Close the options dialog but keep the modal open
    setShowFilmOptions(false);
  };

  // Function to open the film selection options dialog
  const openFilmOptions = () => {
    setShowFilmOptions(true);
  };

  const handleCloseModal = () => {
    onClose();
    setShowActorOptions(false);
    setSelectedActor(null);
    setShowFilmOptions(false);
  };

  const renderActor = ({ item }: { item: CastMember }) => (
    <TouchableOpacity
      style={[
        styles(colors).actorItem,
        selectedActor?.id === item.id ? styles(colors).selectedActorItem : null,
        selectedActor1?.id === item.id ? styles(colors).actor1Item : null,
        selectedActor2?.id === item.id ? styles(colors).actor2Item : null,
      ]}
      onPress={() => handleActorPress(item)}
      activeOpacity={0.7}
    >
      {item.profile_path ? (
        <Image
          source={{
            uri: `https://image.tmdb.org/t/p/w185${item.profile_path}`,
          }}
          style={styles(colors).actorImage}
        />
      ) : (
        <View style={styles(colors).noImageContainer}>
          <Ionicons name="person" size={30} color={colors.textSecondary} />
        </View>
      )}

      <View style={styles(colors).actorDetails}>
        <Text style={styles(colors).actorName}>{item.name}</Text>
        {item.character && (
          <Text style={styles(colors).character}>as {item.character}</Text>
        )}
      </View>

      {/* Indicate if this actor is already selected */}
      {selectedActor1?.id === item.id && (
        <View style={styles(colors).actorIndicator}>
          <Text style={styles(colors).indicatorText}>Actor 1</Text>
        </View>
      )}
      {selectedActor2?.id === item.id && (
        <View
          style={[
            styles(colors).actorIndicator,
            { backgroundColor: "#FF9800" }, // Orange color for Actor 2
          ]}
        >
          <Text style={styles(colors).indicatorText}>Actor 2</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Show select film button only if film selection handlers are provided
  const canSelectFilm = onSelectFilm1 || onSelectFilm2;

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
            <Text style={styles(colors).modalTitle}>Cast of {filmTitle}</Text>
            
            {/* Add header actions with Select Film button */}
            <View style={styles(colors).headerActions}>
              {canSelectFilm && (
                <TouchableOpacity
                  style={styles(colors).selectFilmButton}
                  onPress={openFilmOptions}
                >
                  <Ionicons name="film" size={20} color={colors.primary} />
                  <Text style={styles(colors).selectFilmText}>Select Film</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles(colors).closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cast content */}
          <View style={styles(colors).castContainer}>
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
                data={cast}
                renderItem={renderActor}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <Text style={styles(colors).emptyText}>
                    No cast information available
                  </Text>
                }
              />
            )}
          </View>

          {/* Actor selection options overlay */}
          {showActorOptions && selectedActor && (
            <View style={styles(colors).optionsOverlay}>
              <View style={styles(colors).optionsContainer}>
                <Text style={styles(colors).optionsTitle}>
                  Add {selectedActor.name} as:
                </Text>

                <TouchableOpacity
                  style={styles(colors).optionButton}
                  onPress={() => handleSelectOption("actor1")}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles(colors).optionText}>
                    Actor 1{" "}
                    {selectedActor1 ? `(replace ${selectedActor1.name})` : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(colors).optionButton}
                  onPress={() => handleSelectOption("actor2")}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles(colors).optionText}>
                    Actor 2{" "}
                    {selectedActor2 ? `(replace ${selectedActor2.name})` : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(colors).cancelButton}
                  onPress={() => {
                    setShowActorOptions(false);
                    setSelectedActor(null);
                  }}
                >
                  <Text style={styles(colors).cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* New film selection options overlay */}
          {showFilmOptions && (
            <View style={styles(colors).optionsOverlay}>
              <View style={styles(colors).optionsContainer}>
                <Text style={styles(colors).optionsTitle}>
                  Select {filmTitle} as
                </Text>

                <TouchableOpacity
                  style={[
                    styles(colors).optionButton,
                    isSelectedAsFilm1 && styles(colors).selectedOptionButton,
                  ]}
                  onPress={() => handleSelectFilm("film1")}
                  disabled={isSelectedAsFilm1}
                >
                  <Ionicons name="film-outline" size={20} color={colors.text} />
                  <Text style={styles(colors).optionText}>
                    {isSelectedAsFilm1 ? "Already selected as Film 1" : "Film 1"}
                    {selectedFilm1 && !isSelectedAsFilm1 
                      ? ` (replaces ${selectedFilm1.title})` 
                      : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles(colors).optionButton,
                    isSelectedAsFilm2 && styles(colors).selectedOptionButton,
                  ]}
                  onPress={() => handleSelectFilm("film2")}
                  disabled={isSelectedAsFilm2}
                >
                  <Ionicons name="film-outline" size={20} color={colors.text} />
                  <Text style={styles(colors).optionText}>
                    {isSelectedAsFilm2 ? "Already selected as Film 2" : "Film 2"}
                    {selectedFilm2 && !isSelectedAsFilm2 
                      ? ` (replaces ${selectedFilm2.title})` 
                      : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(colors).cancelButton}
                  onPress={() => setShowFilmOptions(false)}
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
    castContainer: {
      flex: 1,
    },
    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    actorItem: {
      flexDirection: "row",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: "center",
    },
    selectedActorItem: {
      backgroundColor: colors.selectedItem,
    },
    actor1Item: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    actor2Item: {
      borderLeftWidth: 4,
      borderLeftColor: "#FF9800",
    },
    actorIndicator: {
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
    actorImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.placeholderBackground,
    },
    noImageContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.placeholderBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    actorDetails: {
      marginLeft: 12,
      flex: 1,
      justifyContent: "center",
    },
    actorName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    character: {
      fontSize: 14,
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
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    selectFilmButton: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 12,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    selectFilmText: {
      color: colors.primary,
      fontSize: 12,
      marginLeft: 4,
      fontWeight: "500",
    },
    selectedOptionButton: {
      backgroundColor: colors.primary + '20',  // Semi-transparent version of primary color
      borderColor: colors.primary,
    },
  });

export default FilmCastModal;
