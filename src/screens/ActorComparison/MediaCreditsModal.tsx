import React, { useState, useEffect, useMemo } from "react";
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
import { useFilmContext } from "../../context/FilmContext";
import { Ionicons } from "@expo/vector-icons";
import { MediaItem, Person } from "../../types/types";

// Define filter type
type FilterMode = "all" | "cast" | "crew";

interface MediaCastModalProps {
  mediaId: number;
  mediaTitle?: string;
  mediaPosterPath?: string;
  mediaType?: "movie" | "tv";
  onSelectActor1: (actor: Person) => void;
  onSelectActor2: (actor: Person) => void;
  onSelectMedia1?: (media: MediaItem) => void;
  onSelectMedia2?: (media: MediaItem) => void;
  isVisible: boolean;
  onClose: () => void;
  selectedActor1?: Person | null;
  selectedActor2?: Person | null;
  selectedMedia1?: MediaItem | null;
  selectedMedia2?: MediaItem | null;
}

const MediaCreditsModal = ({
  mediaId,
  mediaTitle = "Media",
  mediaPosterPath,
  mediaType = "movie",
  onSelectActor1,
  onSelectActor2,
  onSelectMedia1,
  onSelectMedia2,
  isVisible,
  onClose,
  selectedActor1,
  selectedActor2,
  selectedMedia1,
  selectedMedia2,
}: MediaCastModalProps) => {
  const { colors } = useTheme();
  const { getCast } = useFilmContext();

  // Update state type to use Person instead of CastMember
  const [cast, setCast] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedActor, setSelectedActor] = useState<Person | null>(null);
  const [showActorOptions, setShowActorOptions] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const isSelectedAsMedia1 = !!selectedMedia1 && selectedMedia1.id === mediaId;
  const isSelectedAsMedia2 = !!selectedMedia2 && selectedMedia2.id === mediaId;

  // Memoize filtered cast to avoid recalculating on every render
  const filteredCast = useMemo(() => {
    if (!cast || cast.length === 0) {
      return [];
    }

    if (filterMode === "all") {
      return cast;
    } else if (filterMode === "cast") {
      return cast.filter((person) => person.roles.includes("cast"));
    } else if (filterMode === "crew") {
      return cast.filter((person) => person.roles.includes("crew"));
    }
    return [];
  }, [cast, filterMode]);

  // Memoize cast counts to avoid recalculating
  const castCounts = useMemo(() => {
    if (!cast || cast.length === 0) return { cast: 0, crew: 0, all: 0 };

    const castCount = cast.filter((person) =>
      person.roles.includes("cast")
    ).length;
    const crewCount = cast.filter((person) =>
      person.roles.includes("crew")
    ).length;

    return {
      cast: castCount,
      crew: crewCount,
      all: cast.length,
    };
  }, [cast]);

  // Update useEffect to use getCast from context
  useEffect(() => {
    const fetchCast = async () => {
      if (!mediaId) return;

      try {
        setLoading(true);
        setError("");

        // Use getCast from FilmContext
        const { results, error: castError } = await getCast(mediaId, mediaType);

        if (castError) {
          setError(castError);
          return;
        }

        if (results.length > 0) {
          // Show all credits (both cast and crew) instead of filtering
          setCast(results);
        } else {
          setError(
            `No cast or crew found for this ${
              mediaType === "tv" ? "TV show" : "movie"
            }`
          );
        }
      } catch (err) {
        console.error(
          `Failed to fetch ${mediaType === "tv" ? "TV show" : "movie"}'s cast:`,
          err
        );
        setError("Failed to load cast information");
      } finally {
        setLoading(false);
      }
    };

    if (isVisible && mediaId) {
      fetchCast();
    }
  }, [mediaId, isVisible, mediaType, getCast]);

  const handleActorPress = (actor: Person) => {
    setSelectedActor(actor);
    setShowActorOptions(true);
  };

  const handleSelectOption = (option: "actor1" | "actor2") => {
    if (selectedActor) {
      // Pass the Person directly with required roles array
      const actorToPass: Person = {
        id: selectedActor.id,
        name: selectedActor.name,
        profile_path: selectedActor.profile_path,
        character: selectedActor.character,
        roles: selectedActor.roles, // Include the roles array
        popularity: selectedActor.popularity,
        gender: selectedActor.gender,
        jobs: selectedActor.jobs,
        departments: selectedActor.departments,
        known_for_department: selectedActor.known_for_department,
        known_for: selectedActor.known_for,
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

  // Get role type badge for credits
  const getRoleTypeBadge = (roles: ("cast" | "crew")[]) => {
    if (roles.length === 0) return null;

    // If person has both roles, show a combined badge
    if (roles.includes("cast") && roles.includes("crew")) {
      return (
        <View style={styles(colors).combinedRoleBadge}>
          <View
            style={[
              styles(colors).roleTypeBadge,
              { backgroundColor: colors.primary, marginRight: 4 },
            ]}
          >
            <Ionicons name="people-outline" size={8} color="#fff" />
            <Text style={styles(colors).roleTypeBadgeText}>CAST</Text>
          </View>
          <View
            style={[
              styles(colors).roleTypeBadge,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Ionicons name="construct-outline" size={8} color="#fff" />
            <Text style={styles(colors).roleTypeBadgeText}>CREW</Text>
          </View>
        </View>
      );
    }

    // Single role badge
    const isCrew = roles.includes("crew");
    return (
      <View
        style={[
          styles(colors).roleTypeBadge,
          { backgroundColor: isCrew ? colors.secondary : colors.primary },
        ]}
      >
        <Ionicons
          name={isCrew ? "construct-outline" : "people-outline"}
          size={10}
          color="#fff"
        />
        <Text style={styles(colors).roleTypeBadgeText}>
          {isCrew ? "CREW" : "CAST"}
        </Text>
      </View>
    );
  };

  // Rest of the component remains mostly the same
  // Update renderActor function to work with Person instead of CastMember
  const renderActor = ({ item }: { item: Person }) => {
    const hasCast = item.roles.includes("cast");
    const hasCrew = item.roles.includes("crew");

    return (
      <TouchableOpacity
        style={[
          styles(colors).actorItem,
          selectedActor?.id === item.id
            ? styles(colors).selectedActorItem
            : null,
          selectedActor1?.id === item.id ? styles(colors).actor1Item : null,
          selectedActor2?.id === item.id ? styles(colors).actor2Item : null,
          // Add visual distinction for different role types
          hasCast && hasCrew
            ? styles(colors).combinedItem
            : hasCrew
            ? styles(colors).crewItem
            : styles(colors).castItem,
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
          <View style={styles(colors).nameContainer}>
            <Text style={styles(colors).actorName}>{item.name}</Text>
            {getRoleTypeBadge(item.roles)}
          </View>

          {/* Show character information if available */}
          {hasCast && item.character && (
            <Text style={styles(colors).character}>as {item.character}</Text>
          )}

          {/* Show crew information if available */}
          {hasCrew && (
            <View>
              {item.departments && item.departments.length > 0 && (
                <Text style={styles(colors).department}>
                  {item.departments.join(", ")}
                </Text>
              )}
              {item.jobs && item.jobs.length > 0 && (
                <Text style={styles(colors).job}>{item.jobs.join(", ")}</Text>
              )}
            </View>
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
  };

  // Media selection functions - implement the missing functionality
  const handleSelectMedia = (option: "media1" | "media2") => {
    if (mediaId && mediaTitle) {
      // Create MediaItem object from current media data
      const mediaData: MediaItem = {
        id: mediaId,
        name: mediaTitle,
        title: mediaTitle, // For movies, both name and title should be the same
        popularity: 0, // Default value since we don't have this data
        media_type: mediaType,
        poster_path: mediaPosterPath,
        // Add required properties based on media type
        ...(mediaType === "movie"
          ? { release_date: undefined }
          : { first_air_date: undefined, episode_count: undefined }),
      };

      if (option === "media1" && onSelectMedia1) {
        onSelectMedia1(mediaData);
      } else if (option === "media2" && onSelectMedia2) {
        onSelectMedia2(mediaData);
      }

      // Close modal and reset states
      onClose();
      setShowMediaOptions(false);
    }
  };

  const openMediaOptions = () => {
    setShowMediaOptions(true);
  };

  const handleCloseModal = () => {
    onClose();
    setShowActorOptions(false);
    setSelectedActor(null);
    setShowMediaOptions(false);
  };

  const canSelectMedia = onSelectMedia1 || onSelectMedia2;

  // Determine if we should show the filter controls
  const shouldShowFilters = cast.length > 0;

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
                {mediaTitle}
              </Text>
            </View>

            {/* Add header actions with Select Media button */}
            <View style={styles(colors).headerActions}>
              {canSelectMedia && (
                <TouchableOpacity
                  style={styles(colors).selectMediaButton}
                  onPress={openMediaOptions}
                  accessibilityLabel="Select media"
                >
                  <Ionicons name="film" size={20} color={colors.primary} />
                  <Text style={styles(colors).selectMediaText}>Select</Text>
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

          {/* Filter controls */}
          {shouldShowFilters && (
            <View style={styles(colors).filterContainer}>
              <TouchableOpacity
                style={[
                  styles(colors).filterButton,
                  filterMode === "all" && styles(colors).activeFilterButton,
                ]}
                onPress={() => setFilterMode("all")}
              >
                <Text
                  style={[
                    styles(colors).filterButtonText,
                    filterMode === "all" && styles(colors).activeFilterText,
                  ]}
                >
                  All ({castCounts.all})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles(colors).filterButton,
                  filterMode === "cast" && styles(colors).activeFilterButton,
                ]}
                onPress={() => setFilterMode("cast")}
              >
                <Text
                  style={[
                    styles(colors).filterButtonText,
                    filterMode === "cast" && styles(colors).activeFilterText,
                  ]}
                >
                  Cast ({castCounts.cast})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles(colors).filterButton,
                  filterMode === "crew" && styles(colors).activeFilterButton,
                ]}
                onPress={() => setFilterMode("crew")}
              >
                <Text
                  style={[
                    styles(colors).filterButtonText,
                    filterMode === "crew" && styles(colors).activeFilterText,
                  ]}
                >
                  Crew ({castCounts.crew})
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
                data={filteredCast}
                renderItem={renderActor}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <Text style={styles(colors).emptyText}>
                    {filterMode !== "all"
                      ? `No ${filterMode} information available`
                      : "No cast information available"}
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

          {/* New media selection options overlay */}
          {showMediaOptions && (
            <View style={styles(colors).optionsOverlay}>
              <View style={styles(colors).optionsContainer}>
                <Text style={styles(colors).optionsTitle}>
                  Select {mediaTitle} as
                </Text>

                <TouchableOpacity
                  style={[
                    styles(colors).optionButton,
                    isSelectedAsMedia1 && styles(colors).selectedOptionButton,
                  ]}
                  onPress={() => handleSelectMedia("media1")}
                  disabled={isSelectedAsMedia1}
                >
                  <Ionicons name="film-outline" size={20} color={colors.text} />
                  <Text style={styles(colors).optionText}>
                    {isSelectedAsMedia1
                      ? "Already selected as Media 1"
                      : "Media 1"}
                    {selectedMedia1 && !isSelectedAsMedia1
                      ? ` (replaces ${selectedMedia1.name})`
                      : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles(colors).optionButton,
                    isSelectedAsMedia2 && styles(colors).selectedOptionButton,
                  ]}
                  onPress={() => handleSelectMedia("media2")}
                  disabled={isSelectedAsMedia2}
                >
                  <Ionicons name="film-outline" size={20} color={colors.text} />
                  <Text style={styles(colors).optionText}>
                    {isSelectedAsMedia2
                      ? "Already selected as Media 2"
                      : "Media 2"}
                    {selectedMedia2 && !isSelectedAsMedia2
                      ? ` (replaces ${selectedMedia2.name})`
                      : ""}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(colors).cancelButton}
                  onPress={() => setShowMediaOptions(false)}
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
    selectMediaButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    selectMediaText: {
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
    nameContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    roleTypeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 8,
      marginLeft: 6,
    },
    roleTypeBadgeText: {
      color: "#fff",
      fontSize: 8,
      fontWeight: "bold",
      marginLeft: 2,
    },
    combinedRoleBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 6,
    },
    combinedItem: {
      borderLeftWidth: 4,
      borderLeftColor: colors.accent || "#9C27B0", // Purple for combined roles
    },
    castItem: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    crewItem: {
      borderLeftWidth: 4,
      borderLeftColor: colors.secondary,
    },
    department: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.primary,
      marginTop: 2,
    },
    job: {
      fontSize: 12,
      fontStyle: "italic",
      color: colors.textSecondary,
      marginTop: 1,
    },
    // Filter controls
    filterContainer: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    activeFilterButton: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    activeFilterText: {
      color: colors.primary,
      fontWeight: "600",
    },
  });

export default MediaCreditsModal;
