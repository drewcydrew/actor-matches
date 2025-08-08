import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  FlatList,
  Text,
  Image,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";
import { useSavedSearches } from "../../context/SavedSearchesContext";
import FilmSearch from "./MediaSearch";
import ActorDisplay from "./PersonDisplay";
import PersonCreditsModal from "./PersonCreditsModal";
import { MediaItem } from "../../types/types";
import { Person } from "../../types/types";
import { Ionicons } from "@expo/vector-icons";

const MediaComparisonView = () => {
  const { colors } = useTheme();
  const {
    // Use array-based media items
    selectedMediaItems,
    addMediaItem,
    removeMediaItem,
    clearMediaItems,
    reorderMediaItems,
    updateMediaItem,
    // Use array-based cast members
    selectedCastMembers,
    addCastMember,
    updateCastMember,
  } = useFilmContext();

  const { saveCurrentMediaComparison } = useSavedSearches();

  // Local state for person credits modal
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonCreditsVisible, setIsPersonCreditsVisible] = useState(false);

  // Remove save modal state, keep only saving state
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);

  // Handle person selection
  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
    setIsPersonCreditsVisible(true);
  };

  // Handle adding media item
  const handleAddMedia = (media: MediaItem) => {
    addMediaItem(media);
  };

  // Handle removing media item
  const handleRemoveMedia = (mediaId: number) => {
    removeMediaItem(mediaId);
  };

  // Handle save search button press - now immediate with array support
  const handleSaveSearch = async () => {
    if (selectedMediaItems.length === 0) {
      Alert.alert(
        "No Selection",
        "Please add at least one media item before saving."
      );
      return;
    }

    setIsSaving(true);

    try {
      // Generate default name
      const defaultName = generateDefaultSearchName();

      // Generate description with all media items
      const description = selectedMediaItems
        .map((item) => {
          const year =
            item.media_type === "tv"
              ? item.first_air_date
                ? new Date(item.first_air_date).getFullYear()
                : ""
              : item.release_date
              ? new Date(item.release_date).getFullYear()
              : "";

          const yearText = year ? ` (${year})` : "";
          const typeText = item.media_type === "tv" ? " [TV]" : " [Movie]";

          return `${item.name}${yearText}${typeText}`;
        })
        .join(", ");

      // Use the new array-based method with generated description
      await saveCurrentMediaComparison(
        defaultName,
        selectedMediaItems,
        description
      );

      if (Platform.OS === "web") {
        // Show visual success indicator for web
        setShowSuccessIndicator(true);
        setTimeout(() => setShowSuccessIndicator(false), 3000);
      } else {
        // Show alert for native platforms
        Alert.alert(
          "Saved!",
          `"${defaultName}" has been saved to your searches.`
        );
      }
    } catch (error) {
      console.error("Error saving search:", error);
      Alert.alert("Error", "Failed to save search. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate a default search name based on selected media
  const generateDefaultSearchName = (): string => {
    if (selectedMediaItems.length === 0) {
      return "Media Comparison";
    } else if (selectedMediaItems.length === 1) {
      return `${selectedMediaItems[0].name} Cast`;
    } else if (selectedMediaItems.length === 2) {
      return `${selectedMediaItems[0].name} & ${selectedMediaItems[1].name}`;
    } else {
      return `${selectedMediaItems[0].name} + ${
        selectedMediaItems.length - 1
      } more`;
    }
  };

  // Render selected media item
  const renderSelectedMediaItem = ({
    item,
    index,
  }: {
    item: MediaItem;
    index: number;
  }) => {
    const releaseDate =
      item.media_type === "tv" ? item.first_air_date : item.release_date;
    const year = releaseDate
      ? new Date(releaseDate).getFullYear().toString()
      : "";

    return (
      <View style={styles(colors).mediaItemContainer}>
        {item.poster_path && (
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w92${item.poster_path}`,
            }}
            style={styles(colors).mediaPoster}
          />
        )}
        <View style={styles(colors).mediaInfo}>
          <Text style={styles(colors).mediaTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles(colors).mediaDetails}>
            {year} • {item.media_type === "tv" ? "TV Show" : "Movie"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles(colors).removeButton}
          onPress={() => handleRemoveMedia(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  // Check if we should show the save button
  const shouldShowSaveButton = selectedMediaItems.length > 0;

  return (
    <View style={styles(colors).container}>
      {/* Media Search */}
      <FilmSearch onSelectMedia={handleAddMedia} />

      {/* Selected Media Items */}
      {selectedMediaItems.length > 0 && (
        <View style={styles(colors).selectedMediaSection}>
          <View style={styles(colors).selectedMediaHeader}>
            <Text style={styles(colors).selectedMediaTitle}>
              Selected Media ({selectedMediaItems.length})
            </Text>
            <TouchableOpacity
              style={styles(colors).clearAllButton}
              onPress={clearMediaItems}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={styles(colors).clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={selectedMediaItems}
            renderItem={renderSelectedMediaItem}
            keyExtractor={(item, index) =>
              `${item.media_type}-${item.id}-${index}`
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles(colors).mediaList}
          />
        </View>
      )}

      {/* Actor comparison section - this contains the FlatList */}
      <View style={styles(colors).actorSection}>
        <ActorDisplay onActorSelect={handlePersonSelect} />
      </View>

      {/* Floating Save Button */}
      {shouldShowSaveButton && (
        <>
          <TouchableOpacity
            style={[
              styles(colors).floatingSaveButton,
              isSaving && styles(colors).disabledButton,
            ]}
            onPress={handleSaveSearch}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Ionicons
              name={isSaving ? "hourglass-outline" : "bookmark-outline"}
              size={24}
              color="#fff"
            />
            <Text style={styles(colors).saveButtonText}>
              {isSaving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>

          {/* Success Indicator for Web */}
          {Platform.OS === "web" && showSuccessIndicator && (
            <View style={styles(colors).successIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles(colors).successText}>Saved!</Text>
            </View>
          )}
        </>
      )}

      {/* Show modal when person is selected */}
      {selectedPerson && (
        <PersonCreditsModal
          personId={selectedPerson.id}
          personName={selectedPerson.name}
          personProfilePath={selectedPerson.profile_path}
          isVisible={isPersonCreditsVisible}
          onClose={() => {
            setIsPersonCreditsVisible(false);
            setSelectedPerson(null);
          }}
          // Person selection handlers - updated to use array
          onSelectPerson1={(person) => {
            // If no cast members, add as first
            if (selectedCastMembers.length === 0) {
              addCastMember(person);
            } else {
              // Replace first cast member or add if only one exists
              updateCastMember(0, person);
            }
          }}
          onSelectPerson2={(person) => {
            // If less than 2 cast members, add as new
            if (selectedCastMembers.length < 2) {
              addCastMember(person);
            } else {
              // Replace second cast member
              updateCastMember(1, person);
            }
          }}
          // Current person selections - for compatibility
          selectedPerson1={selectedCastMembers[0] || null}
          selectedPerson2={selectedCastMembers[1] || null}
        />
      )}
    </View>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    // New styles for selected media section
    selectedMediaSection: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 12,
    },
    selectedMediaHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    selectedMediaTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    clearAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    clearAllText: {
      fontSize: 12,
      color: colors.error,
      marginLeft: 4,
      fontWeight: "500",
    },
    mediaList: {
      paddingHorizontal: 16,
      gap: 12,
    },
    mediaItemContainer: {
      width: 160,
      minHeight: 160,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mediaPoster: {
      width: "100%",
      height: 90,
      borderRadius: 6,
      backgroundColor: colors.placeholderBackground,
      marginBottom: 8,
    },
    mediaInfo: {
      flex: 1,
    },
    mediaTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    mediaDetails: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    removeButton: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 2,
    },
    actorSection: {
      flex: 1,
      minHeight: 200,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    // Floating Save Button
    floatingSaveButton: {
      position: "absolute",
      bottom: 20,
      right: 20,
      backgroundColor: colors.primary,
      borderRadius: 28,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    disabledButton: {
      opacity: 0.6,
    },
    successIndicator: {
      position: "absolute",
      bottom: 80,
      right: 20,
      backgroundColor: "#4CAF50",
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    successText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
    },
  });

export default MediaComparisonView;
