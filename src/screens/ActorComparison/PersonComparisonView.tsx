import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Text,
  Platform,
  FlatList,
  Image,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";
import { useSavedSearches } from "../../context/SavedSearchesContext";
import ActorSearch from "./PersonSearch";
import FilmDisplay from "./MediaDisplay";
import MediaCastModal from "./MediaCreditsModal";
import { MediaItem, Person, EnhancedMediaItem } from "../../types/types";
import { Ionicons } from "@expo/vector-icons";

const PersonComparisonView = () => {
  const { colors } = useTheme();
  const {
    // Use array-based cast member selection
    selectedCastMembers,
    addCastMember,
    removeCastMember,
    clearCastMembers,
    // Use array-based media selection instead of individual items
    selectedMediaItems,
    addMediaItem,
  } = useFilmContext();

  const { saveCurrentPersonComparison } = useSavedSearches();

  const [isMediaCastVisible, setIsMediaCastVisible] = useState(false);
  const [selectedMediaForCast, setSelectedMediaForCast] =
    useState<MediaItem | null>(null);

  // Remove save modal state
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);

  // Handle adding person - updated to handle null
  const handleAddPerson = (person: Person | null) => {
    if (person !== null) {
      addCastMember(person);
    }
    // If person is null, we don't need to do anything since we're adding people
  };

  // Handle removing person
  const handleRemovePerson = (personId: number) => {
    removeCastMember(personId);
  };

  // Handle save search button press - now immediate
  const handleSaveSearch = async () => {
    if (selectedCastMembers.length === 0) {
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

      // Generate description with all selected people
      const description = selectedCastMembers
        .map((person) => {
          const departmentText = person.known_for_department
            ? ` (${person.known_for_department})`
            : "";

          return `${person.name}${departmentText}`;
        })
        .join(", ");

      // Use the new array-based function with generated description
      await saveCurrentPersonComparison(
        defaultName,
        selectedCastMembers, // Pass the entire array
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

  // Generate a default search name based on selected actors
  const generateDefaultSearchName = (): string => {
    if (selectedCastMembers.length === 0) {
      return "Person Comparison";
    } else if (selectedCastMembers.length === 1) {
      return `${selectedCastMembers[0].name} Filmography`;
    } else if (selectedCastMembers.length === 2) {
      return `${selectedCastMembers[0].name} & ${selectedCastMembers[1].name}`;
    } else {
      return `${selectedCastMembers[0].name} + ${
        selectedCastMembers.length - 1
      } more`;
    }
  };

  // Render selected person item
  const renderSelectedPersonItem = ({
    item,
    index,
  }: {
    item: Person;
    index: number;
  }) => {
    return (
      <View style={styles(colors).personItemContainer}>
        {item.profile_path ? (
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w185${item.profile_path}`,
            }}
            style={styles(colors).personPhoto}
          />
        ) : (
          <View style={styles(colors).noPhotoPlaceholder}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles(colors).personInfo}>
          <Text style={styles(colors).personName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.known_for_department && (
            <Text style={styles(colors).personDepartment}>
              {item.known_for_department}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles(colors).removeButton}
          onPress={() => handleRemovePerson(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  // Check if we should show the save button
  const shouldShowSaveButton = selectedCastMembers.length > 0;

  return (
    <View style={styles(colors).container}>
      {/* Person Search */}
      <ActorSearch
        onSelectActor={handleAddPerson}
        selectedActor={null} // Don't show any single selection
        defaultQuery="Tom Hanks"
        performInitialSearch={true}
      />

      {/* Selected People */}
      {selectedCastMembers.length > 0 && (
        <View style={styles(colors).selectedPeopleSection}>
          <View style={styles(colors).selectedPeopleHeader}>
            <Text style={styles(colors).selectedPeopleTitle}>
              Selected People ({selectedCastMembers.length})
            </Text>
            <TouchableOpacity
              style={styles(colors).clearAllButton}
              onPress={clearCastMembers}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={styles(colors).clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={selectedCastMembers}
            renderItem={renderSelectedPersonItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles(colors).peopleList}
          />
        </View>
      )}

      <View style={styles(colors).filmSection}>
        <FilmDisplay
          onFilmSelect={(media: EnhancedMediaItem) => {
            // Convert EnhancedMediaItem to MediaItem for the modal
            const basicMediaItem: MediaItem = {
              id: media.id,
              name: media.name,
              popularity: media.popularity,
              media_type: media.media_type,
              poster_path: media.poster_path,
              ...(media.media_type === "movie"
                ? {
                    title: media.title || media.name,
                    release_date: media.release_date,
                  }
                : {
                    title: media.name,
                    first_air_date: media.first_air_date,
                    episode_count: media.episode_count,
                  }),
            } as MediaItem;

            setSelectedMediaForCast(basicMediaItem);
            setIsMediaCastVisible(true);
          }}
        />

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
            onSelectActor1={(person) => {
              // Add person if not already selected
              const isAlreadySelected = selectedCastMembers.some(
                (p) => p.id === person.id
              );
              if (!isAlreadySelected) {
                addCastMember(person);
              }
            }}
            onSelectActor2={(person) => {
              // Add person if not already selected
              const isAlreadySelected = selectedCastMembers.some(
                (p) => p.id === person.id
              );
              if (!isAlreadySelected) {
                addCastMember(person);
              }
            }}
            selectedActor1={selectedCastMembers[0] || null}
            selectedActor2={selectedCastMembers[1] || null}
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
    // New styles for selected people section
    selectedPeopleSection: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 12,
    },
    selectedPeopleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    selectedPeopleTitle: {
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
    peopleList: {
      paddingHorizontal: 16,
      gap: 12,
    },
    personItemContainer: {
      width: 120,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    personPhoto: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.placeholderBackground,
      marginBottom: 8,
    },
    noPhotoPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.placeholderBackground,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    personInfo: {
      flex: 1,
      alignItems: "center",
    },
    personName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
      marginBottom: 4,
    },
    personDepartment: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
    },
    removeButton: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 2,
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

export default PersonComparisonView;
