import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";
import FilmSearch from "./FilmSearch";
import ActorDisplay from "./ActorDisplay";
import PersonCreditsModal from "./ActorFilmographyModal"; // Updated import
import { MediaItem } from "../../types/types";
import { Person } from "../../types/types";

const FilmComparisonView = () => {
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

  // Local state for person credits modal
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonCreditsVisible, setIsPersonCreditsVisible] = useState(false);

  // Handle person selection
  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
    setIsPersonCreditsVisible(true);
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
  });

export default FilmComparisonView;
