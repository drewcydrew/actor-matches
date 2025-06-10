import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { useFilmContext } from "../../context/FilmContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

// Props for the component
interface ActorDisplayProps {
  onActorSelect?: (actor: {
    id: number;
    name: string;
    profile_path?: string;
  }) => void;
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

  // Add function to clear both media items
  const handleClearMedia = () => {
    setSelectedMediaItem1(null);
    setSelectedMediaItem2(null);
  };

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
      return `Cast of "${selectedMediaItem1.title}" (${type1})`;
    } else if (!selectedMediaItem1 && selectedMediaItem2) {
      const type2 = getMediaTypeText(selectedMediaItem2);
      return `Cast of "${selectedMediaItem2.title}" (${type2})`;
    } else if (selectedMediaItem1 && selectedMediaItem2) {
      const type1 = getMediaTypeText(selectedMediaItem1);
      const type2 = getMediaTypeText(selectedMediaItem2);
      return `Common cast in "${selectedMediaItem1.title}" (${type1}) and "${selectedMediaItem2.title}" (${type2})`;
    } else {
      return "Cast Display";
    }
  };

  // Determine if we should show the clear button (when at least one media item is selected)
  const shouldShowClearButton = selectedMediaItem1 || selectedMediaItem2;

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

      {castError ? <Text style={styles(colors).error}>{castError}</Text> : null}

      {castLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles(colors).castContainer}>
          {castMembers.length === 0 && !castError && !castLoading ? (
            <Text style={styles(colors).emptyText}>
              {!selectedMediaItem1 && !selectedMediaItem2
                ? "Select at least one title above to see cast members"
                : selectedMediaItem1 && selectedMediaItem2
                ? "No common cast members found"
                : "No cast information available"}
            </Text>
          ) : (
            castMembers.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles(colors).actorItem}
                onPress={() =>
                  onActorSelect && selectedMediaItem1 && onActorSelect(item)
                }
                disabled={!onActorSelect || !selectedMediaItem1}
                activeOpacity={onActorSelect && selectedMediaItem1 ? 0.7 : 1}
              >
                <View style={styles(colors).actorItemContent}>
                  {item.profile_path ? (
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w185${item.profile_path}`,
                      }}
                      style={styles(colors).actorImage}
                    />
                  ) : (
                    <View style={styles(colors).noImagePlaceholder}>
                      <Text style={styles(colors).noImageText}>No Image</Text>
                    </View>
                  )}
                  <View style={styles(colors).actorInfo}>
                    <Text style={styles(colors).actorName}>{item.name}</Text>

                    {/* Show different character info based on mode */}
                    {displayMode === "comparison" ? (
                      <>
                        <Text style={styles(colors).character}>
                          {`in "${selectedMediaItem1?.title}": ${
                            item.characterInMedia1 ||
                            item.character ||
                            "Unknown role"
                          }`}
                        </Text>
                        <Text style={styles(colors).character}>
                          {`in "${selectedMediaItem2?.title}": ${
                            item.characterInMedia2 ||
                            item.character ||
                            "Unknown role"
                          }`}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles(colors).character}>
                        {`as: ${item.character || "Unknown role"}`}
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

// Updated styles remain the same
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
      marginBottom: 4,
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
