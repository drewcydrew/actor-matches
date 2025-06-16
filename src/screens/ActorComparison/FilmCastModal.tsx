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
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext"; // Add this import
import { Ionicons } from "@expo/vector-icons";
import { MediaItem, Person } from "../../types/types"; // Use Person instead of CastMember
import { Actor } from "../../types/types";

interface FilmCastModalProps {
  filmId: number;
  filmTitle?: string;
  filmPosterPath?: string;
  mediaType?: "movie" | "tv";
  onSelectActor1: (actor: Actor) => void;
  onSelectActor2: (actor: Actor) => void;
  onSelectFilm1?: (film: MediaItem) => void;
  onSelectFilm2?: (film: MediaItem) => void;
  isVisible: boolean;
  onClose: () => void;
  selectedActor1?: Actor | null;
  selectedActor2?: Actor | null;
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
  const { getCast } = useFilmContext(); // Get getCast from context

  // Update state type to use Person instead of CastMember
  const [cast, setCast] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedActor, setSelectedActor] = useState<Person | null>(null);
  const [showActorOptions, setShowActorOptions] = useState(false);
  const [showFilmOptions, setShowFilmOptions] = useState(false);

  const isSelectedAsFilm1 = !!selectedFilm1 && selectedFilm1.id === filmId;
  const isSelectedAsFilm2 = !!selectedFilm2 && selectedFilm2.id === filmId;

  // Update useEffect to use getCast from context
  useEffect(() => {
    const fetchCast = async () => {
      if (!filmId) return;

      try {
        setLoading(true);
        setError("");

        // Use getCast from FilmContext
        const { results, error: castError } = await getCast(filmId, mediaType);

        if (castError) {
          setError(castError);
          return;
        }

        if (results.length > 0) {
          // Filter to only show cast members (not crew)
          const castMembers = results.filter(
            (person) => person.role_type === "cast"
          );
          setCast(castMembers);
        } else {
          setError(
            `No cast found for this ${mediaType === "tv" ? "TV show" : "film"}`
          );
        }
      } catch (err) {
        console.error(
          `Failed to fetch ${mediaType === "tv" ? "TV show" : "film"}'s cast:`,
          err
        );
        setError("Failed to load cast information");
      } finally {
        setLoading(false);
      }
    };

    if (isVisible && filmId) {
      fetchCast();
    }
  }, [filmId, isVisible, mediaType, getCast]);

  const handleActorPress = (actor: Person) => {
    setSelectedActor(actor);
    setShowActorOptions(true);
  };

  const handleSelectOption = (option: "actor1" | "actor2") => {
    if (selectedActor) {
      // Convert Person to Actor interface
      const actorToPass: Actor = {
        id: selectedActor.id,
        name: selectedActor.name,
        profile_path: selectedActor.profile_path,
        //character: selectedActor.character,
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

  // Rest of the component remains mostly the same
  // Update renderActor function to work with Person instead of CastMember
  const renderActor = ({ item }: { item: Person }) => (
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
            { backgroundColor: "#FF9800" },
          ]}
        >
          <Text style={styles(colors).indicatorText}>Actor 2</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Film selection functions remain the same
  const handleSelectFilm = (option: "film1" | "film2") => {
    // ... existing implementation
  };

  const openFilmOptions = () => {
    setShowFilmOptions(true);
  };

  const handleCloseModal = () => {
    onClose();
    setShowActorOptions(false);
    setSelectedActor(null);
    setShowFilmOptions(false);
  };

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
            <View style={styles(colors).titleContainer}>
              <Text
                style={styles(colors).modalTitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {filmTitle}
              </Text>
            </View>

            {/* Add header actions with Select Film button */}
            <View style={styles(colors).headerActions}>
              {canSelectFilm && (
                <TouchableOpacity
                  style={styles(colors).selectFilmButton}
                  onPress={openFilmOptions}
                  accessibilityLabel="Select film"
                >
                  <Ionicons name="film" size={20} color={colors.primary} />
                  <Text style={styles(colors).selectFilmText}>Select</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles(colors).closeButton}
                onPress={handleCloseModal}
                accessibilityLabel="Close modal"
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
                    {isSelectedAsFilm1
                      ? "Already selected as Film 1"
                      : "Film 1"}
                    {selectedFilm1 && !isSelectedAsFilm1
                      ? ` (replaces ${selectedFilm1.name})`
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
                    {isSelectedAsFilm2
                      ? "Already selected as Film 2"
                      : "Film 2"}
                    {selectedFilm2 && !isSelectedAsFilm2
                      ? ` (replaces ${selectedFilm2.name})`
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
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
      backgroundColor: colors.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 60, // Set minimum height for the header
    },
    titleContainer: {
      flex: 1,
      marginRight: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      flexWrap: "wrap", // Allow text to wrap
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 0, // Prevent the actions from shrinking
    },
    closeButton: {
      padding: 8, // Increased touch target
      marginLeft: 8, // Add spacing between buttons
    },
    selectFilmButton: {
      flexDirection: "row",
      alignItems: "center",
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

    selectedOptionButton: {
      backgroundColor: colors.primary + "20", // Semi-transparent version of primary color
      borderColor: colors.primary,
    },
  });

export default FilmCastModal;
