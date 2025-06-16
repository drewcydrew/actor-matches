import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import {
  useFilmContext,
  convertCommonMediaToMediaItem,
} from "../../context/FilmContext";
import { Ionicons } from "@expo/vector-icons";
import { MediaItem, CommonMediaItem } from "../../types/types";

// Define filter type
type FilterMode = "all" | "movies" | "tv";

// Define our props
interface FilmDisplayProps {
  actor1Id?: number;
  actor2Id?: number;
  actor1Name?: string;
  actor2Name?: string;
  onFilmSelect?: (media: MediaItem) => void;
}

const FilmDisplay = ({
  actor1Id,
  actor2Id,
  actor1Name = "First actor",
  actor2Name = "Second actor",
  onFilmSelect,
}: FilmDisplayProps) => {
  const { colors } = useTheme();
  const {
    commonMedia,
    mediaLoading,
    mediaError,
    //getActorFilmography,
    setSelectedCastMember1,
    setSelectedCastMember2,
  } = useFilmContext();

  // Add state for media type filtering
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filteredMedia, setFilteredMedia] = useState<CommonMediaItem[]>([]);

  // Add function to clear both actors
  const handleClearActors = () => {
    setSelectedCastMember1(null);
    setSelectedCastMember2(null);
  };

  // Apply filtering when commonMedia or filterMode changes
  useEffect(() => {
    if (!commonMedia || commonMedia.length === 0) {
      setFilteredMedia([]);
      return;
    }

    if (filterMode === "all") {
      setFilteredMedia(commonMedia);
    } else if (filterMode === "movies") {
      setFilteredMedia(
        commonMedia.filter((item) => item.media_type === "movie")
      );
    } else if (filterMode === "tv") {
      setFilteredMedia(commonMedia.filter((item) => item.media_type === "tv"));
    }
  }, [commonMedia, filterMode]);

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

  // Get year from the appropriate date field based on media type
  const getYear = (media: CommonMediaItem): string => {
    if (media.media_type === "tv") {
      return media.first_air_date
        ? new Date(media.first_air_date).getFullYear().toString()
        : "Unknown year";
    }

    return media.release_date
      ? new Date(media.release_date).getFullYear().toString()
      : "Unknown year";
  };

  // Get counts for filter badges
  const getMediaCounts = () => {
    if (!commonMedia || commonMedia.length === 0)
      return { movies: 0, tv: 0, all: 0 };

    const movies = commonMedia.filter(
      (item) => item.media_type === "movie"
    ).length;
    const tv = commonMedia.filter((item) => item.media_type === "tv").length;

    return {
      movies,
      tv,
      all: movies + tv,
    };
  };

  const mediaCounts = getMediaCounts();

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
            filteredMedia.map((media, index) => (
              <TouchableOpacity
                key={`${media.media_type}-${media.id}-${index}`}
                style={styles(colors).mediaItem}
                onPress={() =>
                  onFilmSelect &&
                  onFilmSelect(convertCommonMediaToMediaItem(media))
                }
                disabled={!onFilmSelect}
                activeOpacity={onFilmSelect ? 0.7 : 1}
              >
                <View style={styles(colors).mediaItemContent}>
                  {media.poster_path ? (
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w92${media.poster_path}`,
                      }}
                      style={styles(colors).poster}
                    />
                  ) : (
                    <View style={styles(colors).noImagePlaceholder}>
                      <Text style={styles(colors).noImageText}>No Poster</Text>
                    </View>
                  )}
                  <View style={styles(colors).mediaInfo}>
                    <Text style={styles(colors).mediaTitle}>{media.title}</Text>
                    <View style={styles(colors).mediaMetadata}>
                      <Text style={styles(colors).mediaYear}>
                        {getYear(media)}
                      </Text>
                      <Text style={styles(colors).mediaType}>
                        {media.media_type === "tv" ? "TV Show" : "Movie"}
                      </Text>
                    </View>

                    {/* Show character info for both actors when in common media mode */}
                    {actor1Id && actor2Id ? (
                      <>
                        <Text style={styles(colors).character}>
                          {`${actor1Name} as: ${
                            media.characterForActor1 || "Unknown role"
                          }`}
                        </Text>
                        <Text style={styles(colors).character}>
                          {`${actor2Name} as: ${
                            media.characterForActor2 || "Unknown role"
                          }`}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles(colors).character}>
                        {`as: ${
                          media.character ||
                          media.characterForActor1 ||
                          media.characterForActor2 ||
                          "Unknown role"
                        }`}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
  });

export default FilmDisplay;
