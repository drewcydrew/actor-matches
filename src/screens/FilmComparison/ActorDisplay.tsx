import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useFilmContext } from "../../context/FilmContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Person } from "../../types/types";

// Define filter type
type FilterMode = "all" | "cast" | "crew";

// Update props to use Person type
interface ActorDisplayProps {
  onActorSelect?: (actor: Person) => void;
}

const ActorDisplay = ({ onActorSelect }: ActorDisplayProps) => {
  const { colors } = useTheme();
  const {
    selectedMediaItem1,
    selectedMediaItem2,
    setSelectedMediaItem1,
    setSelectedMediaItem2,
    castMembers,
    castLoading,
    castError,
    displayMode,
  } = useFilmContext();

  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Memoize the filtered people to avoid recalculating on every render
  const filteredPeople = useMemo(() => {
    if (!castMembers || castMembers.length === 0) {
      return [];
    }

    if (filterMode === "all") {
      return castMembers;
    } else if (filterMode === "cast") {
      return castMembers.filter((pair) => pair[0].roles.includes("cast"));
    } else if (filterMode === "crew") {
      return castMembers.filter((pair) => pair[0].roles.includes("crew"));
    }
    return [];
  }, [castMembers, filterMode]);

  // Memoize person counts to avoid recalculating
  const personCounts = useMemo(() => {
    if (!castMembers || castMembers.length === 0)
      return { cast: 0, crew: 0, all: 0 };

    const castCount = castMembers.filter((pair) =>
      pair[0].roles.includes("cast")
    ).length;
    const crewCount = castMembers.filter((pair) =>
      pair[0].roles.includes("crew")
    ).length;

    return {
      cast: castCount,
      crew: crewCount,
      all: castMembers.length,
    };
  }, [castMembers]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleClearMedia = useCallback(() => {
    setSelectedMediaItem1(null);
    setSelectedMediaItem2(null);
  }, [setSelectedMediaItem1, setSelectedMediaItem2]);

  const handleFilterChange = useCallback((mode: FilterMode) => {
    setFilterMode(mode);
  }, []);

  const handleActorPress = useCallback(
    (person: Person) => {
      if (onActorSelect && (selectedMediaItem1 || selectedMediaItem2)) {
        onActorSelect(person);
      }
    },
    [onActorSelect, selectedMediaItem1, selectedMediaItem2]
  );

  // Memoize the key extractor
  const keyExtractor = useCallback((item: [Person, Person], index: number) => {
    return `${item[0].id}-${item[0].roles.join("-")}-${index}`;
  }, []);

  // Memoize the render item function
  const renderPersonItem = useCallback(
    ({ item, index }: { item: [Person, Person]; index: number }) => {
      const [person1, person2] = item;
      const hasCrew = person1.roles.includes("crew");
      const hasCast = person1.roles.includes("cast");

      return (
        <TouchableOpacity
          key={`${person1.id}-${index}`}
          style={[
            styles(colors).actorItem,
            hasCrew && hasCast
              ? styles(colors).combinedItem
              : hasCrew
              ? styles(colors).crewItem
              : styles(colors).castItem,
          ]}
          onPress={() => handleActorPress(person1)}
          disabled={
            !onActorSelect || (!selectedMediaItem1 && !selectedMediaItem2)
          }
          activeOpacity={
            onActorSelect && (selectedMediaItem1 || selectedMediaItem2)
              ? 0.7
              : 1
          }
        >
          <View style={styles(colors).actorItemContent}>
            {person1.profile_path ? (
              <Image
                source={{
                  uri: `https://image.tmdb.org/t/p/w185${person1.profile_path}`,
                }}
                style={styles(colors).actorImage}
              />
            ) : (
              <View style={styles(colors).noImagePlaceholder}>
                <Text style={styles(colors).noImageText}>No Image</Text>
              </View>
            )}
            <View style={styles(colors).actorInfo}>
              <View style={styles(colors).nameContainer}>
                <Text style={styles(colors).actorName}>{person1.name}</Text>
                {getRoleTypeBadge(person1.roles)}
              </View>

              {/* Cast character information */}
              {hasCast && person1.character && (
                <Text style={styles(colors).character}>
                  {`as: ${person1.character}`}
                </Text>
              )}

              {/* Crew information */}
              {hasCrew && (
                <View>
                  <Text style={styles(colors).department}>
                    {person1.departments?.join(", ") || "Crew"}
                  </Text>
                  {displayMode === "comparison" ? (
                    <>
                      <Text style={styles(colors).character}>
                        {`in "${selectedMediaItem1?.name}": ${
                          person1.jobs?.join(", ") || "Unknown job"
                        }`}
                      </Text>
                      <Text style={styles(colors).character}>
                        {`in "${selectedMediaItem2?.name}": ${
                          person2.jobs?.join(", ") || "Unknown job"
                        }`}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles(colors).character} numberOfLines={2}>
                      {person1.jobs?.join(", ") || "Unknown job"}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [
      colors,
      displayMode,
      selectedMediaItem1,
      selectedMediaItem2,
      handleActorPress,
      onActorSelect,
    ]
  );

  // Get appropriate media type text
  const getMediaTypeText = (mediaItem: any) => {
    if (!mediaItem) return "";
    return mediaItem.media_type === "tv" ? "TV show" : "film";
  };

  // Title text based on media selection state
  const getTitleText = () => {
    if (!selectedMediaItem1 && !selectedMediaItem2) {
      return "Select a title to see its cast";
    } else if (selectedMediaItem1 && !selectedMediaItem2) {
      const type1 = getMediaTypeText(selectedMediaItem1);
      return `Cast of "${selectedMediaItem1.name}" (${type1})`;
    } else if (!selectedMediaItem1 && selectedMediaItem2) {
      const type2 = getMediaTypeText(selectedMediaItem2);
      return `Cast of "${selectedMediaItem2.name}" (${type2})`;
    } else if (selectedMediaItem1 && selectedMediaItem2) {
      const type1 = getMediaTypeText(selectedMediaItem1);
      const type2 = getMediaTypeText(selectedMediaItem2);
      return `Common cast in "${selectedMediaItem1.name}" (${type1}) and "${selectedMediaItem2.name}" (${type2})`;
    } else {
      return "Cast Display";
    }
  };

  // Get role type badge
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
            <Ionicons name="people-outline" size={10} color="#fff" />
            <Text style={styles(colors).roleTypeBadgeText}>CAST</Text>
          </View>
          <View
            style={[
              styles(colors).roleTypeBadge,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Ionicons name="construct-outline" size={10} color="#fff" />
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
          size={12}
          color="#fff"
        />
        <Text style={styles(colors).roleTypeBadgeText}>
          {isCrew ? "CREW" : "CAST"}
        </Text>
      </View>
    );
  };

  // Determine if we should show the clear button (when at least one media item is selected)
  const shouldShowClearButton = selectedMediaItem1 || selectedMediaItem2;

  // Determine if we should show the filter controls
  const shouldShowFilters = castMembers.length > 0;

  return (
    <View style={styles(colors).container}>
      <View style={styles(colors).headerContainer}>
        <Text style={styles(colors).title}>{getTitleText()}</Text>

        {shouldShowClearButton && (
          <TouchableOpacity
            style={styles(colors).clearButton}
            onPress={handleClearMedia}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={16} color={colors.primary} />
            <Text style={styles(colors).clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
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
              All ({personCounts.all})
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
              Cast ({personCounts.cast})
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
              Crew ({personCounts.crew})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {castError ? <Text style={styles(colors).error}>{castError}</Text> : null}

      {castLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles(colors).castContainer}>
          {filteredPeople.length === 0 && !castError && !castLoading ? (
            <Text style={styles(colors).emptyText}>
              {!selectedMediaItem1 && !selectedMediaItem2
                ? "Select at least one title above to see cast members"
                : selectedMediaItem1 && selectedMediaItem2
                ? filterMode !== "all"
                  ? `No ${filterMode} members found in both titles`
                  : "No common cast members found"
                : filterMode !== "all"
                ? `No ${filterMode} information available`
                : "No cast information available"}
            </Text>
          ) : (
            <FlatList
              data={filteredPeople}
              renderItem={renderPersonItem}
              keyExtractor={keyExtractor}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={10}
              windowSize={10}
            />
          )}
        </View>
      )}
    </View>
  );
};

// Updated styles with combined role support
const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 8,
      width: "100%",
      backgroundColor: colors.background,
    },
    // Filter controls
    filterContainer: {
      flexDirection: "row",
      marginBottom: 10,
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 8,
    },
    filterButton: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    activeFilterButton: {
      backgroundColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    activeFilterText: {
      color: "#FFF",
      fontWeight: "600",
    },
    nameContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    roleTypeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    roleTypeBadgeText: {
      color: "#fff",
      fontSize: 8,
      fontWeight: "bold",
      marginLeft: 2,
    },
    castItem: {
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    crewItem: {
      borderLeftWidth: 3,
      borderLeftColor: colors.secondary,
    },
    combinedRoleBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
    },
    combinedItem: {
      borderLeftWidth: 3,
      borderLeftColor: colors.accent || "#9C27B0", // Purple for combined roles
    },
    department: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.primary,
      marginBottom: 2,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 6,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    clearButtonText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "500",
      marginLeft: 4,
    },
    castContainer: {
      flex: 1,
    },
    actorItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actorItemContent: {
      padding: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    actorImage: {
      width: 50,
      height: 75,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
    },
    noImagePlaceholder: {
      width: 50,
      height: 75,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    noImageText: {
      color: colors.textSecondary,
      fontSize: 8,
    },
    actorInfo: {
      marginLeft: 8,
      flex: 1,
    },
    actorName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    character: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    error: {
      color: colors.error,
      marginBottom: 8,
      textAlign: "center",
      fontSize: 14,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      color: colors.textSecondary,
      fontSize: 14,
    },
    list: {
      flex: 1,
    },
  });

export default ActorDisplay;
