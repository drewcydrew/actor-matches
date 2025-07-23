import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Platform,
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
import { Text } from "react-native";

const MediaComparisonView = () => {
  const { colors } = useTheme();
  const {
    selectedMediaItem1,
    selectedMediaItem2,
    setSelectedMediaItem1,
    setSelectedMediaItem2,
    selectedCastMember1,
    selectedCastMember2,
    setSelectedCastMember1,
    setSelectedCastMember2,
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

  // Handle save search button press - now immediate
  const handleSaveSearch = async () => {
    if (!selectedMediaItem1 && !selectedMediaItem2) {
      Alert.alert(
        "No Selection",
        "Please select at least one media item before saving."
      );
      return;
    }

    setIsSaving(true);

    try {
      // Generate default name
      const defaultName = generateDefaultSearchName();

      await saveCurrentMediaComparison(
        defaultName,
        selectedMediaItem1,
        selectedMediaItem2
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
    if (selectedMediaItem1 && selectedMediaItem2) {
      return `${selectedMediaItem1.name} & ${selectedMediaItem2.name}`;
    } else if (selectedMediaItem1) {
      return `${selectedMediaItem1.name} Cast`;
    } else if (selectedMediaItem2) {
      return `${selectedMediaItem2.name} Cast`;
    }
    return "Media Comparison";
  };

  // Function to ensure media items have all required properties
  const ensureMediaItemProperties = (
    media: MediaItem | null
  ): MediaItem | null => {
    if (!media) return null;

    if (media.media_type === "movie") {
      // For movies, return with explicit movie type
      return {
        ...media,
        name: media.name || media.title || "Unknown",
        title: media.title || media.name || "Unknown",
        media_type: "movie" as const, // Use const assertion for literal type
      };
    } else {
      // For TV shows, return with explicit TV type
      return {
        ...media,
        name: media.name || "Unknown",
        media_type: "tv" as const, // Use const assertion for literal type
      };
    }
  };

  // Check if we should show the save button
  const shouldShowSaveButton = selectedMediaItem1 || selectedMediaItem2;

  return (
    <View style={styles(colors).container}>
      {/* First media search */}
      <FilmSearch
        onSelectMedia={setSelectedMediaItem1}
        selectedMedia={selectedMediaItem1}
      />

      {/* Second media search */}
      <FilmSearch
        onSelectMedia={setSelectedMediaItem2}
        selectedMedia={selectedMediaItem2}
      />

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

      {/* Remove Save Search Modal */}

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
          // Media selection handlers
          onSelectMedia1={(media) => {
            setSelectedMediaItem1(media);
            setSelectedPerson(null);
            setIsPersonCreditsVisible(false);
          }}
          onSelectMedia2={(media) => {
            setSelectedMediaItem2(media);
            setSelectedPerson(null);
            setIsPersonCreditsVisible(false);
          }}
          // Person selection handlers
          onSelectPerson1={(person) => {
            setSelectedCastMember1(person);
          }}
          onSelectPerson2={(person) => {
            setSelectedCastMember2(person);
          }}
          // Current selections
          selectedMedia1={ensureMediaItemProperties(selectedMediaItem1)}
          selectedMedia2={ensureMediaItemProperties(selectedMediaItem2)}
          selectedPerson1={selectedCastMember1}
          selectedPerson2={selectedCastMember2}
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
    actorSection: {
      flex: 1, // Changed from flex: 2 to flex: 1
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
