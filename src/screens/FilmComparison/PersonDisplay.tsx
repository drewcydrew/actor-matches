import React, { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";
import { Ionicons } from "@expo/vector-icons";
import { Person } from "../../types/types";

// Define filter type
type FilterMode = "all" | "cast" | "crew";

// Update props to use Person type
interface PersonDisplayProps {
  onActorSelect?: (actor: Person) => void;
}

const PersonDisplay = ({ onActorSelect }: PersonDisplayProps) => {
  const { colors } = useTheme();
  const {
    selectedMediaItems,
    clearMediaItems,
    castMembers,
    castLoading,
    castError,
    displayMode,
  } = useFilmContext();

  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const ITEMS_PER_PAGE = 20; // Adjust based on your needs

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

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    return filteredPeople.slice(startIndex, endIndex);
  }, [filteredPeople, currentPage]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalItems = filteredPeople.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const hasMore = currentPage < totalPages;
    const showingCount = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    return {
      totalItems,
      totalPages,
      hasMore,
      showingCount,
    };
  }, [filteredPeople.length, currentPage]);

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

  // Reset pagination when filter changes
  const handleFilterChange = useCallback((mode: FilterMode) => {
    setFilterMode(mode);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Load more items
  const loadMore = useCallback(() => {
    if (paginationInfo.hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [paginationInfo.hasMore]);

  // Load all remaining items
  const loadAll = useCallback(async () => {
    if (paginationInfo.hasMore) {
      setIsLoadingAll(true);
      // Small delay to show loading state
      setTimeout(() => {
        setCurrentPage(paginationInfo.totalPages);
        setIsLoadingAll(false);
      }, 300);
    }
  }, [paginationInfo.hasMore, paginationInfo.totalPages]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleClearMedia = useCallback(() => {
    clearMediaItems();
    setCurrentPage(1); // Reset pagination
  }, [clearMediaItems]);

  const handleActorPress = useCallback(
    (person: Person) => {
      if (onActorSelect && selectedMediaItems.length > 0) {
        onActorSelect(person);
      }
    },
    [onActorSelect, selectedMediaItems.length]
  );

  // Memoize the key extractor
  const keyExtractor = useCallback((item: [Person, Person], index: number) => {
    return `${item[0].id}-${index}`;
  }, []);

  // Get role type badge for people - updated to handle combined roles properly
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

  // Render person item function
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
          disabled={!onActorSelect || selectedMediaItems.length === 0}
          activeOpacity={
            onActorSelect && selectedMediaItems.length > 0 ? 0.7 : 1
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
              {hasCast && (
                <View style={styles(colors).roleSection}>
                  {selectedMediaItems.length === 1 ? (
                    // Single media mode
                    person1.character && (
                      <Text style={styles(colors).character}>
                        {`as: ${person1.character}`}
                      </Text>
                    )
                  ) : (
                    // Multiple media mode - show character info for ALL titles using the detailed data
                    <>
                      {person1.allMediaCharacters &&
                      person1.allMediaCharacters.length > 0 ? (
                        person1.allMediaCharacters.map(
                          (characterInfo, characterIndex) => (
                            <Text
                              key={`cast-${characterIndex}`}
                              style={styles(colors).character}
                            >
                              {`in ${characterInfo}`}
                            </Text>
                          )
                        )
                      ) : (
                        // Fallback if detailed info not available
                        <Text style={styles(colors).character}>
                          {`Appears in all ${selectedMediaItems.length} titles`}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* Crew information */}
              {hasCrew && (
                <View style={styles(colors).roleSection}>
                  <Text style={styles(colors).department}>
                    {person1.allMediaDepartments?.join(", ") ||
                      person1.departments?.join(", ") ||
                      "Crew"}
                  </Text>
                  {selectedMediaItems.length === 1 ? (
                    // Single media mode
                    <Text style={styles(colors).character} numberOfLines={2}>
                      {person1.jobs?.join(", ") || "Unknown job"}
                    </Text>
                  ) : (
                    // Multiple media mode - show job info for ALL titles using the detailed data
                    <>
                      {person1.allMediaJobs &&
                      person1.allMediaJobs.length > 0 ? (
                        person1.allMediaJobs.map((jobInfo, jobIndex) => (
                          <Text
                            key={`crew-${jobIndex}`}
                            style={styles(colors).character}
                          >
                            {`in ${jobInfo}`}
                          </Text>
                        ))
                      ) : (
                        // Fallback if detailed info not available
                        <Text style={styles(colors).character}>
                          {`Works on all ${selectedMediaItems.length} titles`}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, selectedMediaItems, handleActorPress, onActorSelect]
  );

  // Render footer with load more and load all buttons
  const renderFooter = useCallback(() => {
    if (paginatedData.length === 0) return null;

    const remainingItems =
      paginationInfo.totalItems - paginationInfo.showingCount;

    return (
      <View style={styles(colors).footerContainer}>
        <Text style={styles(colors).paginationInfo}>
          Showing {paginationInfo.showingCount} of {paginationInfo.totalItems}{" "}
          results
        </Text>

        {paginationInfo.hasMore && (
          <View style={styles(colors).buttonContainer}>
            <TouchableOpacity
              style={[
                styles(colors).loadMoreButton,
                isLoadingAll && styles(colors).disabledButton,
              ]}
              onPress={loadMore}
              activeOpacity={0.7}
              disabled={isLoadingAll}
            >
              <Text style={styles(colors).loadMoreText}>
                Load More ({Math.min(ITEMS_PER_PAGE, remainingItems)})
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles(colors).loadAllButton,
                isLoadingAll && styles(colors).loadingAllButton,
              ]}
              onPress={loadAll}
              activeOpacity={0.7}
              disabled={isLoadingAll}
            >
              {isLoadingAll ? (
                <>
                  <ActivityIndicator size={16} color="#fff" />
                  <Text style={styles(colors).loadAllText}>Loading...</Text>
                </>
              ) : (
                <>
                  <Text style={styles(colors).loadAllText}>
                    Load All ({remainingItems})
                  </Text>
                  <Ionicons name="download-outline" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [
    paginatedData.length,
    paginationInfo,
    loadMore,
    loadAll,
    colors,
    isLoadingAll,
    ITEMS_PER_PAGE,
  ]);

  // Get appropriate media type text
  const getMediaTypeText = (mediaItem: any) => {
    if (!mediaItem) return "";
    return mediaItem.media_type === "tv" ? "TV show" : "film";
  };

  // Update title text to work with array
  const getTitleText = () => {
    if (selectedMediaItems.length === 0) {
      return "Select a title to see its cast";
    } else if (selectedMediaItems.length === 1) {
      const type = getMediaTypeText(selectedMediaItems[0]);
      return `Cast of "${selectedMediaItems[0].name}" (${type})`;
    } else if (selectedMediaItems.length === 2) {
      const type1 = getMediaTypeText(selectedMediaItems[0]);
      const type2 = getMediaTypeText(selectedMediaItems[1]);
      return `Common cast in "${selectedMediaItems[0].name}" (${type1}) and "${selectedMediaItems[1].name}" (${type2})`;
    } else {
      return `Common cast across ${selectedMediaItems.length} titles`;
    }
  };

  // Update clear button condition
  const shouldShowClearButton = selectedMediaItems.length > 0;

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
            onPress={() => handleFilterChange("all")}
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
            onPress={() => handleFilterChange("cast")}
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
            onPress={() => handleFilterChange("crew")}
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
              {selectedMediaItems.length === 0
                ? "Select at least one title above to see cast members"
                : selectedMediaItems.length >= 2
                ? filterMode !== "all"
                  ? `No ${filterMode} members found in all titles`
                  : "No common cast members found"
                : filterMode !== "all"
                ? `No ${filterMode} information available`
                : "No cast information available"}
            </Text>
          ) : (
            <FlatList
              data={paginatedData}
              renderItem={renderPersonItem}
              keyExtractor={keyExtractor}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={10}
              windowSize={10}
              scrollEnabled={false} // Disable scrolling since parent handles it
              ListFooterComponent={renderFooter}
              contentContainerStyle={styles(colors).listContent}
            />
          )}
        </View>
      )}
    </View>
  );
};

// Updated styles with pagination support
const styles = (colors: any) =>
  StyleSheet.create({
    container: {
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
      // Remove flex: 1 to allow natural sizing
      minHeight: 200,
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
    roleSection: {
      marginTop: 2,
    },
    // Pagination styles
    footerContainer: {
      padding: 16,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },
    paginationInfo: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
      textAlign: "center",
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
      justifyContent: "center",
    },
    loadMoreButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
      flex: 1,
      maxWidth: 150,
      justifyContent: "center",
    },
    loadMoreText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "500",
      marginRight: 4,
    },
    loadAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.primary,
      borderRadius: 20,
      flex: 1,
      maxWidth: 150,
      justifyContent: "center",
    },
    loadAllText: {
      fontSize: 14,
      color: "#fff",
      fontWeight: "500",
      marginRight: 4,
    },
    loadingAllButton: {
      backgroundColor: colors.primary,
      opacity: 0.8,
    },
    disabledButton: {
      opacity: 0.5,
    },
    listContent: {
      paddingBottom: 8,
    },
  });

export default PersonDisplay;
