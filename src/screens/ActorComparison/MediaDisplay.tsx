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
import { useFilmContext } from "../../context/FilmContext"; // Remove the convertCommonMediaToMediaItem import
import { Ionicons } from "@expo/vector-icons";
import { MediaItem } from "../../types/types"; // Remove CommonMediaItem import

// Define filter type
type FilterMode = "all" | "movies" | "tv";

// Define our props
interface MediaDisplayProps {
  actor1Id?: number;
  actor2Id?: number;
  actor1Name?: string;
  actor2Name?: string;
  onFilmSelect?: (media: MediaItem) => void;
}

const MediaDisplay = ({
  actor1Id,
  actor2Id,
  actor1Name = "First actor",
  actor2Name = "Second actor",
  onFilmSelect,
}: MediaDisplayProps) => {
  const { colors } = useTheme();
  const {
    commonMedia,
    mediaLoading,
    mediaError,
    setSelectedCastMember1,
    setSelectedCastMember2,
  } = useFilmContext();

  const [filterMode, setFilterMode] = useState<FilterMode>("all");

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

  // Memoize callbacks
  const handleClearActors = useCallback(() => {
    setSelectedCastMember1(null);
    setSelectedCastMember2(null);
  }, [setSelectedCastMember1, setSelectedCastMember2]);

  const handleFilterChange = useCallback((mode: FilterMode) => {
    setFilterMode(mode);
  }, []);

  const handleMediaPress = useCallback(
    (media: MediaItem) => {
      if (onFilmSelect) {
        onFilmSelect(media);
      }
    },
    [onFilmSelect]
  );

  // Memoize helper functions
  const getYear = useCallback((media: MediaItem): string => {
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
    (item: [MediaItem, MediaItem], index: number) => {
      return `${item[0].media_type}-${item[0].id}-${
        item[0].role_type || "cast"
      }-${index}`;
    },
    []
  );

  // Add a new function to get role type badge with combined role support
  const getRoleTypeBadge = (media: MediaItem) => {
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
    ({ item, index }: { item: [MediaItem, MediaItem]; index: number }) => {
      const [media1, media2] = item;
      const isTVShow = media1.media_type === "tv";
      const title = media1.media_type === "movie" ? media1.title : media1.name;
      const year = getYear(media1);

      return (
        <TouchableOpacity
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

              {actor1Id && actor2Id ? (
                <>
                  {/* Show character or job information for first actor */}
                  <Text style={styles(colors).character}>
                    {`${actor1Name}: ${
                      media1.character || media1.job || "Unknown role"
                    }`}
                  </Text>
                  {/* Show character or job information for second actor */}
                  <Text style={styles(colors).character}>
                    {`${actor2Name}: ${
                      media2.character || media2.job || "Unknown role"
                    }`}
                  </Text>
                </>
              ) : (
                <>
                  {/* Show character information if it exists */}
                  {media1.character && (
                    <Text style={styles(colors).character}>
                      {`as: ${media1.character}`}
                    </Text>
                  )}
                  {/* Show job information if it exists and no character */}
                  {media1.job && !media1.character && (
                    <Text style={styles(colors).character}>
                      {`job: ${media1.job}`}
                    </Text>
                  )}
                  {/* Show department if available */}
                  {media1.department && (
                    <Text style={styles(colors).department}>
                      {media1.department}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [
      colors,
      actor1Id,
      actor2Id,
      actor1Name,
      actor2Name,
      getYear,
      handleMediaPress,
      onFilmSelect,
    ]
  );

  // Title text based on actor selection state
  const getTitleText = () => {
    if (!actor1Id && !actor2Id) {
      return "Select actors to see their filmography";
    } else if (actor1Id && !actor2Id) {
      return `Filmography of ${actor1Name}`;
    } else if (!actor1Id && actor2Id) {
      return `Filmography of ${actor2Name}`;
    } else if (actor1Id && actor2Id) {
      return `Projects with both ${actor1Name} and ${actor2Name}`;
    } else {
      return "Media Display";
    }
  };

  // Determine if we should show the clear button (when at least one actor is selected)
  const shouldShowClearButton = actor1Id || actor2Id;

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
            onPress={() => setFilterMode("all")}
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
            onPress={() => setFilterMode("movies")}
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
            onPress={() => setFilterMode("tv")}
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
              {!actor1Id && !actor2Id
                ? "Select actors above to see their work"
                : actor1Id && actor2Id
                ? filterMode !== "all"
                  ? `No ${
                      filterMode === "movies" ? "movies" : "TV shows"
                    } found with both actors`
                  : "No shared projects found with both actors"
                : filterMode !== "all"
                ? `No ${
                    filterMode === "movies" ? "movies" : "TV shows"
                  } available`
                : "No credits available"}
            </Text>
          ) : (
            <FlatList
              data={filteredMedia}
              renderItem={renderMediaItem}
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

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
      flex: 1,
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
  });

export default MediaDisplay;
