import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Alert, Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";
import { useSavedSearches } from "../../context/SavedSearchesContext";
import ActorSearch from "./ActorSearch";
import FilmDisplay from "./FilmDisplay";
import MediaCastModal from "./FilmCastModal";
import { MediaItem } from "../../types/types";
import { Ionicons } from "@expo/vector-icons";

const ActorComparisonView = () => {
  const { colors } = useTheme();
  const {
    selectedCastMember1,
    selectedCastMember2,
    setSelectedCastMember1,
    setSelectedCastMember2,
    selectedMediaItem1,
    selectedMediaItem2,
    setSelectedMediaItem1,
    setSelectedMediaItem2,
  } = useFilmContext();

  const { saveCurrentPersonComparison } = useSavedSearches();

  const [isMediaCastVisible, setIsMediaCastVisible] = useState(false);
  const [selectedMediaForCast, setSelectedMediaForCast] =
    useState<MediaItem | null>(null);

  // Remove save modal state
  const [isSaving, setIsSaving] = useState(false);

  // Handle save search button press - now immediate
  const handleSaveSearch = async () => {
    if (!selectedCastMember1 && !selectedCastMember2) {
      Alert.alert(
        "No Selection",
        "Please select at least one person before saving."
      );
      return;
    }

    setIsSaving(true);

    try {
      // Generate default name
      const defaultName = generateDefaultSearchName();

      await saveCurrentPersonComparison(
        defaultName,
        selectedCastMember1,
        selectedCastMember2
      );

      // Show quick success message
      Alert.alert(
        "Saved!",
        `"${defaultName}" has been saved to your searches.`
      );
    } catch (error) {
      console.error("Error saving search:", error);
      Alert.alert("Error", "Failed to save search. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate a default search name based on selected actors
  const generateDefaultSearchName = (): string => {
    if (selectedCastMember1 && selectedCastMember2) {
      return `${selectedCastMember1.name} & ${selectedCastMember2.name}`;
    } else if (selectedCastMember1) {
      return `${selectedCastMember1.name} Filmography`;
    } else if (selectedCastMember2) {
      return `${selectedCastMember2.name} Filmography`;
    }
    return "Person Comparison";
  };

  // Check if we should show the save button
  const shouldShowSaveButton = selectedCastMember1 || selectedCastMember2;

  return (
    <View style={styles(colors).container}>
      <ActorSearch
        onSelectActor={setSelectedCastMember1}
        selectedActor={selectedCastMember1}
        defaultQuery="Tom Hanks"
        performInitialSearch={true}
      />
      <ActorSearch
        onSelectActor={setSelectedCastMember2}
        selectedActor={selectedCastMember2}
      />

      <View style={styles(colors).filmSection}>
        <FilmDisplay
          actor1Id={selectedCastMember1?.id}
          actor2Id={selectedCastMember2?.id}
          actor1Name={selectedCastMember1?.name}
          actor2Name={selectedCastMember2?.name}
          onFilmSelect={(media) => {
            setSelectedMediaForCast(media);
            setIsMediaCastVisible(true);
          }}
        />

        {/* Floating Save Button */}
        {shouldShowSaveButton && (
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
        )}

        {selectedMediaForCast && (
          <MediaCastModal
            mediaId={selectedMediaForCast.id}
            mediaTitle={selectedMediaForCast.name}
            mediaPosterPath={selectedMediaForCast.poster_path}
            mediaType={selectedMediaForCast.media_type}
            isVisible={isMediaCastVisible}
            onClose={() => {
              setIsMediaCastVisible(false);
              setSelectedMediaForCast(null);
            }}
            onSelectActor1={(actor) => {
              setSelectedCastMember1(actor);
              setIsMediaCastVisible(false);
              setSelectedMediaForCast(null);
            }}
            onSelectActor2={(actor) => {
              setSelectedCastMember2(actor);
              setIsMediaCastVisible(false);
              setSelectedMediaForCast(null);
            }}
            onSelectMedia1={(media) => {
              setSelectedMediaItem1(media);
            }}
            onSelectMedia2={(media) => {
              setSelectedMediaItem2(media);
            }}
            selectedActor1={selectedCastMember1}
            selectedActor2={selectedCastMember2}
            selectedMedia1={selectedMediaItem1}
            selectedMedia2={selectedMediaItem2}
          />
        )}
      </View>
    </View>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    filmSection: {
      flex: 1,
      minHeight: 300,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
  });

export default ActorComparisonView;
