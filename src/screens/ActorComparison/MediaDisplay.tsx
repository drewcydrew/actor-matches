import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { MediaItem, EnhancedMediaItem } from "../../types/types";

// Define filter type
type FilterMode = "all" | "movies" | "tv";

// Define our props - update to accept EnhancedMediaItem
interface MediaDisplayProps {
  onFilmSelect?: (media: EnhancedMediaItem) => void;
}

const MediaDisplay = ({ onFilmSelect }: MediaDisplayProps) => {
  const { colors } = useTheme();
  const {
    commonMedia,
    mediaLoading,
    mediaError,
    clearCastMembers,
    selectedCastMembers, // Get all selected cast members
  } = useFilmContext();

  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const ITEMS_PER_PAGE = 20; // Adjust based on your needs

  // Memoize filtered media to avoid recalculating on every render
  const filteredMedia = useMemo(() => {
    if (!commonMedia || commonMedia.length === 0) {
      return [];
    }

    if (filterMode === "all") {
      return commonMedia;
    } else if (filterMode === "movies") {
      return commonMedia.filter((pair) => pair[0].media_type === "movie");
    } else if (filterMode === "tv") {
      return commonMedia.filter((pair) => pair[0].media_type === "tv");
    }
    return [];
  }, [commonMedia, filterMode]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    return filteredMedia.slice(startIndex, endIndex);
  }, [filteredMedia, currentPage]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalItems = filteredMedia.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const hasMore = currentPage < totalPages;
    const showingCount = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    return {
      totalItems,
      totalPages,
      hasMore,
      showingCount,
    };
  }, [filteredMedia.length, currentPage]);

  // Memoize media counts
  const mediaCounts = useMemo(() => {
    if (!commonMedia || commonMedia.length === 0)
      return { movies: 0, tv: 0, all: 0 };

    const movies = commonMedia.filter(
      (pair) => pair[0].media_type === "movie"
    ).length;
    const tv = commonMedia.filter((pair) => pair[0].media_type === "tv").length;

    return {
      movies,
      tv,
      all: movies + tv,
    };
  }, [commonMedia]);

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

  // Memoize callbacks
  const handleClearActors = useCallback(() => {
    clearCastMembers();
    setCurrentPage(1); // Reset pagination
  }, [clearCastMembers]);

  const handleMediaPress = useCallback(
    (media: EnhancedMediaItem) => {
      if (onFilmSelect) {
        onFilmSelect(media);
      }
    },
    [onFilmSelect]
  );

  // Memoize helper functions
  const getYear = useCallback((media: EnhancedMediaItem): string => {
    if (media.media_type === "tv") {
      return media.first_air_date
        ? new Date(media.first_air_date).getFullYear().toString()
        : "Unknown year";
    }

    return media.release_date
      ? new Date(media.release_date).getFullYear().toString()
      : "Unknown year";
  }, []);

  // Memoize key extractor
  const keyExtractor = useCallback(
    (item: [EnhancedMediaItem, EnhancedMediaItem], index: number) => {
      return `${item[0].media_type}-${item[0].id}-${
        item[0].role_type || "cast"
      }-${index}`;
    },
    []
  );

  // Add a new function to get role type badge with combined role support
  const getRoleTypeBadge = (media: EnhancedMediaItem) => {
    // Check if the media item has a roles array (from aggregated data)
    const roles = (media as any).roles || [];

    if (roles.length > 0) {
      const hasCast = roles.includes("cast");
      const hasCrew = roles.includes("crew");

      // If person has both roles, show a combined badge
      if (hasCast && hasCrew) {
        return (
          <View style={styles(colors).combinedRoleBadge}>
            <View
              style={[
                styles(colors).roleTypeBadge,
                { backgroundColor: colors.primary, marginRight: 4 },
              ]}
            >
              <Ionicons name="people-outline" size={8} color="#fff" />
              <Text style={styles(colors).mediaTypeBadgeText}>CAST</Text>
            </View>
            <View
              style={[
                styles(colors).roleTypeBadge,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Ionicons name="construct-outline" size={8} color="#fff" />
              <Text style={styles(colors).mediaTypeBadgeText}>CREW</Text>
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
            {
              backgroundColor: isCrew ? colors.secondary : colors.primary,
              marginLeft: 8,
            },
          ]}
        >
          <Ionicons
            name={isCrew ? "construct-outline" : "people-outline"}
            size={12}
            color="#fff"
          />
          <Text style={styles(colors).mediaTypeBadgeText}>
            {isCrew ? "CREW" : "CAST"}
          </Text>
        </View>
      );
    }

    // Fallback to checking individual properties if no roles array
    const hasCharacter = !!media.character;
    const hasJob = !!media.job;
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
            <Text style={styles(colors).mediaTypeBadgeText}>CAST</Text>
          </View>
          <View
            style={[
              styles(colors).roleTypeBadge,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Ionicons name="construct-outline" size={8} color="#fff" />
            <Text style={styles(colors).mediaTypeBadgeText}>CREW</Text>
          </View>
        </View>
      );
    }

    // Single role badge - determine from available data
    const roleType = media.role_type;
    if (!roleType) {
      // If no role_type, infer from data
      if (hasJob && !hasCharacter) {
        // Only has job info, likely crew
        return (
          <View
            style={[
              styles(colors).roleTypeBadge,
              { backgroundColor: colors.secondary, marginLeft: 8 },
            ]}
          >
            <Ionicons name="construct-outline" size={12} color="#fff" />
            <Text style={styles(colors).mediaTypeBadgeText}>CREW</Text>
          </View>
        );
      } else if (hasCharacter) {
        // Has character info, likely cast
        return (
          <View
            style={[
              styles(colors).roleTypeBadge,
              { backgroundColor: colors.primary, marginLeft: 8 },
            ]}
          >
            <Ionicons name="people-outline" size={12} color="#fff" />
            <Text style={styles(colors).mediaTypeBadgeText}>CAST</Text>
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
          {
            backgroundColor: isCrew ? colors.secondary : colors.primary,
            marginLeft: 8,
          },
        ]}
      >
        <Ionicons
          name={isCrew ? "construct-outline" : "people-outline"}
          size={12}
          color="#fff"
        />
        <Text style={styles(colors).mediaTypeBadgeText}>
          {isCrew ? "CREW" : "CAST"}
        </Text>
      </View>
    );
  };

  // Memoize render item function
  const renderMediaItem = useCallback(
    ({
      item,
      index,
    }: {
      item: [EnhancedMediaItem, EnhancedMediaItem];
      index: number;
    }) => {
      const [media1] = item; // We only need the first media item since commonMedia contains pairs
      const isTVShow = media1.media_type === "tv";
      const title = media1.media_type === "movie" ? media1.title : media1.name;
      const year = getYear(media1);

      return (
        <TouchableOpacity
          key={`${media1.id}-${index}`}
          style={[
            styles(colors).mediaItem,
            isTVShow ? styles(colors).tvItem : styles(colors).movieItem,
          ]}
          onPress={() => handleMediaPress(media1)}
          disabled={!onFilmSelect}
          activeOpacity={onFilmSelect ? 0.7 : 1}
        >
          <View style={styles(colors).mediaItemContent}>
            {media1.poster_path ? (
              <Image
                source={{
                  uri: `https://image.tmdb.org/t/p/w92${media1.poster_path}`,
                }}
                style={styles(colors).poster}
              />
            ) : (
              <View style={styles(colors).noImagePlaceholder}>
                <Text style={styles(colors).noImageText}>No Poster</Text>
              </View>
            )}
            <View style={styles(colors).mediaInfo}>
              <Text style={styles(colors).mediaTitle}>
                {title || "Untitled"}
              </Text>
              <View style={styles(colors).mediaMetadata}>
                <Text style={styles(colors).mediaYear}>{year}</Text>
                {getRoleTypeBadge(media1)}
              </View>

              {/* Show role information for all selected cast members */}
              {selectedCastMembers.length > 0 ? (
                selectedCastMembers.map((castMember, memberIndex) => {
                  // Get this person's specific role information from the enhanced media item
                  const castMemberRoles = media1.castMemberRoles || {};
                  const personRole = castMemberRoles[castMember.id];

                  if (personRole) {
                    // Determine the role info to display
                    let roleInfo = "";
                    if (personRole.character) {
                      roleInfo = `as ${personRole.character}`;
                    } else if (personRole.job) {
                      roleInfo = `${personRole.job}`;
                      if (
                        personRole.department &&
                        personRole.department !== personRole.job
                      ) {
                        roleInfo += ` (${personRole.department})`;
                      }
                    } else {
                      roleInfo = "Unknown role";
                    }

                    return (
                      <Text
                        key={`${castMember.id}-${memberIndex}`}
                        style={styles(colors).character}
                      >
                        {
                          selectedCastMembers.length === 1
                            ? roleInfo // For single person, just show the role
                            : `${castMember.name}: ${roleInfo}` // For multiple, show name: role
                        }
                      </Text>
                    );
                  }

                  // Fallback: try to get role info from the main media properties for this specific cast member
                  // This handles cases where castMemberRoles might not be populated correctly
                  if (selectedCastMembers.length === 1) {
                    // For single cast member, check if the media item has their role info
                    let fallbackRoleInfo = "";

                    if (media1.character) {
                      fallbackRoleInfo = `as ${media1.character}`;
                    } else if (media1.job) {
                      fallbackRoleInfo = `${media1.job}`;
                      if (
                        media1.department &&
                        media1.department !== media1.job
                      ) {
                        fallbackRoleInfo += ` (${media1.department})`;
                      }
                    }

                    if (fallbackRoleInfo) {
                      return (
                        <Text
                          key={`${castMember.id}-${memberIndex}-fallback`}
                          style={styles(colors).character}
                        >
                          {fallbackRoleInfo}
                        </Text>
                      );
                    }
                  }

                  return null; // Don't render if no role info found
                })
              ) : (
                <Text style={styles(colors).character}>
                  No cast members selected
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, selectedCastMembers, getYear, handleMediaPress, onFilmSelect]
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

  // Update title text to work with variable number of cast members
  const getTitleText = () => {
    const castCount = selectedCastMembers.length;

    if (castCount === 0) {
      return "Select people to see their filmography";
    } else if (castCount === 1) {
      return `Filmography of ${selectedCastMembers[0].name}`;
    } else if (castCount === 2) {
      return `Projects with ${selectedCastMembers[0].name} and ${selectedCastMembers[1].name}`;
    } else {
      return `Projects with ${selectedCastMembers[0].name} and ${
        castCount - 1
      } others`;
    }
  };

  // Update clear button logic
  const shouldShowClearButton = selectedCastMembers.length > 0;

  // Determine if we should show the filter controls
  const shouldShowFilters = commonMedia.length > 0;

  return (
    <View style={styles(colors).container}>
      <View style={styles(colors).headerContainer}>
        <Text style={styles(colors).title}>{getTitleText()}</Text>

        {shouldShowClearButton && (
          <TouchableOpacity
            style={styles(colors).clearButton}
            onPress={handleClearActors}
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
              All ({mediaCounts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles(colors).filterButton,
              filterMode === "movies" && styles(colors).activeFilterButton,
            ]}
            onPress={() => handleFilterChange("movies")}
          >
            <Text
              style={[
                styles(colors).filterButtonText,
                filterMode === "movies" && styles(colors).activeFilterText,
              ]}
            >
              Movies ({mediaCounts.movies})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles(colors).filterButton,
              filterMode === "tv" && styles(colors).activeFilterButton,
            ]}
            onPress={() => handleFilterChange("tv")}
          >
            <Text
              style={[
                styles(colors).filterButtonText,
                filterMode === "tv" && styles(colors).activeFilterText,
              ]}
            >
              TV Shows ({mediaCounts.tv})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {mediaError ? (
        <Text style={styles(colors).error}>{mediaError}</Text>
      ) : null}

      {mediaLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles(colors).mediaContainer}>
          {filteredMedia.length === 0 && !mediaError && !mediaLoading ? (
            <Text style={styles(colors).emptyText}>
              {selectedCastMembers.length === 0
                ? "Select people above to see their work"
                : selectedCastMembers.length > 1
                ? filterMode !== "all"
                  ? `No ${
                      filterMode === "movies" ? "movies" : "TV shows"
                    } found with all selected people`
                  : "No shared projects found with all selected people"
                : filterMode !== "all"
                ? `No ${
                    filterMode === "movies" ? "movies" : "TV shows"
                  } available`
                : "No credits available"}
            </Text>
          ) : (
            <FlatList
              data={paginatedData}
              renderItem={renderMediaItem}
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

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      padding: 8,
      width: "100%",
      backgroundColor: colors.background,
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
    // New styles for media type visual indicators
    mediaTypeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    mediaTypeBadgeText: {
      color: "#fff",
      fontSize: 8,
      fontWeight: "bold",
      marginLeft: 2,
    },
    movieItem: {
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    tvItem: {
      borderLeftWidth: 3,
      borderLeftColor: colors.secondary,
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
    // Media container
    mediaContainer: {
      // Remove flex: 1 to allow natural sizing
      minHeight: 200,
    },
    mediaItem: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    mediaItemContent: {
      flexDirection: "row",
    },
    poster: {
      width: 60,
      height: 90,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
    },
    noImagePlaceholder: {
      width: 60,
      height: 90,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    noImageText: {
      color: colors.textSecondary,
      fontSize: 10,
      textAlign: "center",
    },
    mediaInfo: {
      marginLeft: 12,
      flex: 1,
      justifyContent: "center",
    },
    mediaTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 2,
      color: colors.text,
    },
    mediaMetadata: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    mediaYear: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 8,
    },
    mediaType: {
      fontSize: 12,
      backgroundColor: colors.surface || colors.card,
      color: colors.textSecondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    character: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    department: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "500",
      marginTop: 2,
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
    // Add roleTypeBadge style (matching mediaTypeBadge)
    roleTypeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    combinedRoleBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
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

export default MediaDisplay;
