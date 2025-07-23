import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { MediaItem } from "../../types/types";
import { Person } from "../../types/types";

// Update props to use Person type
interface PersonCreditsModalProps {
  personId: number;
  personName?: string;
  onSelectPerson1?: (person: Person) => void;
  onSelectPerson2?: (person: Person) => void;
  isVisible: boolean;
  onClose: () => void;
  selectedPerson1?: Person | null;
  selectedPerson2?: Person | null;
  personProfilePath?: string;
}

type MediaType = "all" | "movies" | "tv";

// Keep ExtendedMediaItem for additional properties - updated to include roles array
type ExtendedMediaItem = MediaItem & {
  role_type?: "cast" | "crew";
  department?: string;
  roles?: ("cast" | "crew")[]; // Add roles array to track all role types
};

const PersonCreditsModal = ({
  personId,
  personName = "Person",
  onSelectPerson1,
  onSelectPerson2,
  isVisible,
  onClose,
  selectedPerson1,
  selectedPerson2,
  personProfilePath,
}: PersonCreditsModalProps) => {
  const { colors } = useTheme();
  const {
    getCredits,
    selectedMediaItems,
    addMediaItem,
    updateMediaItem,
    selectedCastMembers,
    addCastMember,
    updateCastMember,
  } = useFilmContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<ExtendedMediaItem | null>(
    null
  );
  const [showItemOptions, setShowItemOptions] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("all");
  const [showPersonOptions, setShowPersonOptions] = useState(false);
  const [allCredits, setAllCredits] = useState<ExtendedMediaItem[]>([]);

  // Determine if we should show the filter controls
  const shouldShowFilters = allCredits.length > 0;

  // Updated checks for person selection
  const isSelectedAsPerson1 =
    !!selectedPerson1 && selectedPerson1.id === personId;
  const isSelectedAsPerson2 =
    !!selectedPerson2 && selectedPerson2.id === personId;

  // Only need array-based media selection check
  const isMediaAlreadySelected = useCallback(
    (mediaId: number): { isSelected: boolean; index: number } => {
      const index = selectedMediaItems.findIndex((item) => item.id === mediaId);
      return { isSelected: index !== -1, index };
    },
    [selectedMediaItems]
  );

  // Check if this person is already in the array
  const isPersonAlreadySelected = useCallback(
    (personId: number): { isSelected: boolean; index: number } => {
      const index = selectedCastMembers.findIndex(
        (person) => person.id === personId
      );
      return { isSelected: index !== -1, index };
    },
    [selectedCastMembers]
  );

  useEffect(() => {
    if (isVisible && personId) {
      fetchPersonCredits();
    }
  }, [personId, isVisible]);

  // Memoize filtered media items
  const mediaItems = useMemo(() => {
    if (allCredits.length === 0) {
      return [];
    }

    let filtered: ExtendedMediaItem[];

    if (mediaType === "all") {
      filtered = [...allCredits];
    } else if (mediaType === "movies") {
      filtered = allCredits.filter((item) => item.media_type === "movie");
    } else {
      filtered = allCredits.filter((item) => item.media_type === "tv");
    }

    return filtered;
  }, [allCredits, mediaType]);

  // Memoize media counts to match FilmDisplay
  const mediaCounts = useMemo(() => {
    if (!allCredits || allCredits.length === 0)
      return { movies: 0, tv: 0, all: 0 };

    const movies = allCredits.filter(
      (item) => item.media_type === "movie"
    ).length;
    const tv = allCredits.filter((item) => item.media_type === "tv").length;

    return {
      movies,
      tv,
      all: allCredits.length,
    };
  }, [allCredits]);

  // Updated function name and error message
  const fetchPersonCredits = async () => {
    try {
      setLoading(true);
      setError("");

      const { results, error: creditsError } = await getCredits(personId);

      if (creditsError) {
        setError(creditsError);
        return;
      }

      if (results.length === 0) {
        setError("No credits found for this person");
        return;
      }

      // Store all results
      setAllCredits(results as ExtendedMediaItem[]);
    } catch (err) {
      console.error("Failed to fetch person's credits:", err);
      setError("Failed to load credits");
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = useCallback((item: ExtendedMediaItem) => {
    setSelectedItem(item);
    setShowItemOptions(true);
  }, []);

  // Updated person selection handler
  const handleSelectPerson = useCallback(
    (option: "addNew" | "replaceAtIndex", replaceIndex?: number) => {
      const personData: Person = {
        id: personId,
        name: personName,
        profile_path: personProfilePath,
        roles: ["cast"], // Add required roles array
      };

      if (option === "addNew") {
        // Add as new person to array
        addCastMember(personData);
      } else if (option === "replaceAtIndex" && replaceIndex !== undefined) {
        // Replace specific person in array
        updateCastMember(replaceIndex, personData);
      }

      setShowPersonOptions(false);
      onClose();
    },
    [
      personId,
      personName,
      personProfilePath,
      addCastMember,
      updateCastMember,
      onClose,
    ]
  );

  const openPersonOptions = () => {
    setShowPersonOptions(true);
  };

  // Simplified media selection handler - only array-based
  const handleSelectOption = useCallback(
    (option: "addNew" | "replaceAtIndex", replaceIndex?: number) => {
      if (selectedItem) {
        if (option === "addNew") {
          // Add as new item to array
          addMediaItem(selectedItem);
        } else if (option === "replaceAtIndex" && replaceIndex !== undefined) {
          // Replace specific item in array
          updateMediaItem(replaceIndex, selectedItem);
        }

        // Close modal and reset states
        onClose();
        setShowItemOptions(false);
        setSelectedItem(null);
      }
    },
    [selectedItem, addMediaItem, updateMediaItem, onClose]
  );

  const handleCloseModal = () => {
    onClose();
    setShowItemOptions(false);
    setSelectedItem(null);
    setShowPersonOptions(false);
  };

  // Memoize key extractor
  const keyExtractor = useCallback((item: ExtendedMediaItem, index: number) => {
    return `${item.media_type}-${item.id}-${item.role_type || "cast"}-${
      item.character?.substring(0, 10) || ""
    }-${index}`;
  }, []);

  // Get role type badge for media items - updated to handle combined roles properly
  const getRoleTypeBadge = (item: ExtendedMediaItem) => {
    // Use roles array if available (from aggregated data), otherwise fall back to individual checks
    const roles = item.roles || [];

    // If we have roles array, use it directly (consistent with ActorDisplay)
    if (roles.length > 0) {
      const hasCast = roles.includes("cast");
      const hasCrew = roles.includes("crew");

      if (hasCast && hasCrew) {
        // Show combined badges for items with both cast and crew roles
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

      // Single role badge based on roles array
      const isCrew = hasCrew && !hasCast;
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
    }

    // Fallback logic for items without roles array - check aggregated data
    const hasCharacter = !!item.character;
    const hasJob = !!item.job;
    const hasBothRoles = hasCharacter && hasJob;

    if (hasBothRoles) {
      // Show combined badges for items with both cast and crew roles
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

    // Single role badge - determine from available data
    const roleType = item.role_type;
    if (!roleType) {
      // If no role_type, infer from data
      if (hasJob && !hasCharacter) {
        // Only has job info, likely crew
        return (
          <View
            style={[
              styles(colors).roleTypeBadge,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Ionicons name="construct-outline" size={10} color="#fff" />
            <Text style={styles(colors).roleTypeBadgeText}>CREW</Text>
          </View>
        );
      } else if (hasCharacter) {
        // Has character info, likely cast
        return (
          <View
            style={[
              styles(colors).roleTypeBadge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name="people-outline" size={10} color="#fff" />
            <Text style={styles(colors).roleTypeBadgeText}>CAST</Text>
          </View>
        );
      }
      return null;
    }

    const isCrew = roleType === "crew";
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

  // Updated to handle MediaItem consistently
  const renderMediaItem = useCallback(
    ({ item }: { item: ExtendedMediaItem }) => {
      const isMovie = item.media_type === "movie";
      const title = isMovie ? item.title : item.name;
      const releaseDate = isMovie ? item.release_date : item.first_air_date;
      const year = releaseDate
        ? new Date(releaseDate).getFullYear().toString()
        : "Unknown";
      const isCrew = item.role_type === "crew";

      // Check if this item is in the selected array
      const { isSelected, index } = isMediaAlreadySelected(item.id);

      return (
        <TouchableOpacity
          style={[
            styles(colors).filmItem,
            selectedItem?.id === item.id
              ? styles(colors).selectedFilmItem
              : null,
            isSelected ? styles(colors).arraySelectedItem : null,
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
              {getRoleTypeBadge(item)}
            </View>

            {/* Show character information if available */}
            {item.character && (
              <Text style={styles(colors).character}>as: {item.character}</Text>
            )}

            {/* Show job information if available and different from character */}
            {item.job && item.job !== item.character && (
              <Text style={styles(colors).job}>job: {item.job}</Text>
            )}

            {/* Show department if available for crew roles */}
            {isCrew && item.department && (
              <Text style={styles(colors).department}>{item.department}</Text>
            )}

            {/* Handle TV show episode count */}
            {!isMovie && item.episode_count && !isCrew && (
              <Text style={styles(colors).episodeCount}>
                {item.episode_count} episode
                {item.episode_count !== 1 ? "s" : ""}
              </Text>
            )}
          </View>

          {/* Show indicators for array selections */}
          {isSelected && (
            <View style={styles(colors).arrayIndicator}>
              <Text style={styles(colors).indicatorText}>#{index + 1}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [colors, selectedItem, handleItemPress, isMediaAlreadySelected]
  );

  // Simplified media selection overlay
  const renderMediaSelectionOverlay = () => {
    if (!showItemOptions || !selectedItem) return null;

    const { isSelected, index } = isMediaAlreadySelected(selectedItem.id);
    const mediaTitle =
      selectedItem.media_type === "movie"
        ? selectedItem.title || selectedItem.name
        : selectedItem.name;

    return (
      <View style={styles(colors).optionsOverlay}>
        <View style={styles(colors).optionsContainer}>
          <Text style={styles(colors).optionsTitle}>
            {isSelected
              ? `"${mediaTitle}" is already selected`
              : `Add "${mediaTitle}"`}
          </Text>

          {isSelected ? (
            // Media is already selected - show update option
            <>
              <Text style={styles(colors).alreadySelectedText}>
                This title is already in your selection at position {index + 1}.
              </Text>

              <TouchableOpacity
                style={styles(colors).optionButton}
                onPress={() => handleSelectOption("replaceAtIndex", index)}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles(colors).optionText}>
                  Update at position {index + 1}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Media is not selected - show add/replace options
            <>
              {/* Option to add as new */}
              <TouchableOpacity
                style={styles(colors).primaryOptionButton}
                onPress={() => handleSelectOption("addNew")}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles(colors).primaryOptionText}>
                  Add as new selection
                </Text>
              </TouchableOpacity>

              {/* Show existing selections for replacement */}
              {selectedMediaItems.length > 0 && (
                <>
                  <Text style={styles(colors).sectionTitle}>
                    Or replace existing:
                  </Text>

                  {selectedMediaItems.map((media, index) => (
                    <TouchableOpacity
                      key={`${media.id}-${index}`}
                      style={styles(colors).optionButton}
                      onPress={() =>
                        handleSelectOption("replaceAtIndex", index)
                      }
                    >
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={20}
                        color={colors.text}
                      />
                      <Text style={styles(colors).optionText}>
                        Replace #{index + 1}: {media.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}

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
    );
  };

  // Helper function to get person title
  const getPersonTitle = useCallback((person: Person): string => {
    return person.name;
  }, []);

  // Person selection overlay
  const renderPersonSelectionOverlay = () => {
    if (!showPersonOptions) return null;

    const { isSelected, index } = isPersonAlreadySelected(personId);

    return (
      <View style={styles(colors).optionsOverlay}>
        <View style={styles(colors).optionsContainer}>
          <Text style={styles(colors).optionsTitle}>
            {isSelected
              ? `"${personName}" is already selected`
              : `Add "${personName}"`}
          </Text>

          {isSelected ? (
            // Person is already selected - show update option
            <>
              <Text style={styles(colors).alreadySelectedText}>
                This person is already in your selection at position {index + 1}
                .
              </Text>

              <TouchableOpacity
                style={styles(colors).optionButton}
                onPress={() => handleSelectPerson("replaceAtIndex", index)}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles(colors).optionText}>
                  Update at position {index + 1}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Person is not selected - show add/replace options
            <>
              {/* Option to add as new */}
              <TouchableOpacity
                style={styles(colors).primaryOptionButton}
                onPress={() => handleSelectPerson("addNew")}
              >
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles(colors).primaryOptionText}>
                  Add as new selection
                </Text>
              </TouchableOpacity>

              {/* Show existing selections for replacement */}
              {selectedCastMembers.length > 0 && (
                <>
                  <Text style={styles(colors).sectionTitle}>
                    Or replace existing:
                  </Text>

                  {selectedCastMembers.map((person, index) => (
                    <TouchableOpacity
                      key={`${person.id}-${index}`}
                      style={styles(colors).optionButton}
                      onPress={() =>
                        handleSelectPerson("replaceAtIndex", index)
                      }
                    >
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={20}
                        color={colors.text}
                      />
                      <Text style={styles(colors).optionText}>
                        Replace #{index + 1}: {person.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles(colors).cancelButton}
            onPress={() => setShowPersonOptions(false)}
          >
            <Text style={styles(colors).cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
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
            <Text style={styles(colors).modalTitle}>{personName}</Text>

            <View style={styles(colors).headerActions}>
              <TouchableOpacity
                style={styles(colors).selectPersonButton}
                onPress={openPersonOptions}
              >
                <Ionicons name="person-add" size={20} color={colors.primary} />
                <Text style={styles(colors).selectPersonText}>Add</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles(colors).closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter controls - updated to match FilmDisplay style */}
          {shouldShowFilters && (
            <View style={styles(colors).filterContainer}>
              <TouchableOpacity
                style={[
                  styles(colors).filterButton,
                  mediaType === "all" && styles(colors).activeFilterButton,
                ]}
                onPress={() => setMediaType("all")}
              >
                <Text
                  style={[
                    styles(colors).filterButtonText,
                    mediaType === "all" && styles(colors).activeFilterText,
                  ]}
                >
                  All ({mediaCounts.all})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles(colors).filterButton,
                  mediaType === "movies" && styles(colors).activeFilterButton,
                ]}
                onPress={() => setMediaType("movies")}
              >
                <Text
                  style={[
                    styles(colors).filterButtonText,
                    mediaType === "movies" && styles(colors).activeFilterText,
                  ]}
                >
                  Movies ({mediaCounts.movies})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles(colors).filterButton,
                  mediaType === "tv" && styles(colors).activeFilterButton,
                ]}
                onPress={() => setMediaType("tv")}
              >
                <Text
                  style={[
                    styles(colors).filterButtonText,
                    mediaType === "tv" && styles(colors).activeFilterText,
                  ]}
                >
                  TV Shows ({mediaCounts.tv})
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
                keyExtractor={keyExtractor}
                removeClippedSubviews={true}
                maxToRenderPerBatch={15}
                updateCellsBatchingPeriod={50}
                initialNumToRender={15}
                windowSize={10}
                ListEmptyComponent={
                  <Text style={styles(colors).emptyText}>
                    {mediaType !== "all"
                      ? `No ${
                          mediaType === "movies" ? "movies" : "TV shows"
                        } found for this person`
                      : "No credits found"}
                  </Text>
                }
              />
            )}
          </View>

          {/* Simplified media selection overlay */}
          {renderMediaSelectionOverlay()}

          {/* Updated person selection overlay */}
          {renderPersonSelectionOverlay()}
        </View>
      </View>
    </Modal>
  );
};

// Remove styles related to legacy media selections
const styles = (colors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 50,
    },
    department: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.primary,
      marginBottom: 2,
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
    filterContainer: {
      flexDirection: "row",
      marginBottom: 0,
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 0,
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
    primaryOptionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.primary,
      borderRadius: 8,
      marginBottom: 12,
    },
    primaryOptionText: {
      fontSize: 14,
      color: "#fff",
      marginLeft: 12,
      fontWeight: "600",
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
    selectPersonButton: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 12,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    selectPersonText: {
      color: colors.primary,
      fontSize: 12,
      marginLeft: 4,
      fontWeight: "500",
    },
    selectedOptionButton: {
      backgroundColor: colors.primary + "20", // Semi-transparent version of primary color
      borderColor: colors.primary,
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
    job: {
      fontSize: 12,
      fontStyle: "italic",
      color: colors.textSecondary,
      marginTop: 2,
    },
    combinedRoleBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 6,
    },
    arraySelectedItem: {
      borderLeftWidth: 4,
      borderLeftColor: colors.accent || "#9C27B0", // Purple for array selections
    },
    arrayIndicator: {
      backgroundColor: colors.accent || "#9C27B0",
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
    alreadySelectedText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 12,
      fontStyle: "italic",
    },
    sectionTitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "600",
      marginTop: 8,
      marginBottom: 4,
      textAlign: "center",
    },
  });

export default PersonCreditsModal;
