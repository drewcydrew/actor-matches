import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext, SelectedActor } from "../../context/FilmContext";
import FilmSearch from "./FilmSearch";
import ActorDisplay from "./ActorDisplay";
import ActorFilmographyModal from "./ActorFilmographyModal";
import { MediaItem } from "../../types/types";

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

  // Local state for filmography modal
  const [selectedActor, setSelectedActor] = useState<SelectedActor | null>(
    null
  );
  const [isActorFilmographyVisible, setIsActorFilmographyVisible] =
    useState(false);

  // Handle actor selection
  const handleActorSelect = (actor: SelectedActor) => {
    setSelectedActor(actor);
    setIsActorFilmographyVisible(true);
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
    <>
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

      {/* Actor comparison section */}
      <View style={styles(colors).actorSection}>
        <ActorDisplay onActorSelect={handleActorSelect} />
      </View>

      {/* Show modal when actor is selected */}
      {selectedActor && (
        <ActorFilmographyModal
          actorId={selectedActor.id}
          actorName={selectedActor.name}
          actorProfilePath={selectedActor.profile_path}
          isVisible={isActorFilmographyVisible}
          onClose={() => {
            setIsActorFilmographyVisible(false);
            setSelectedActor(null);
          }}
          // Film selection handlers - FIXED: preserve original media_type
          onSelectFilm1={(media) => {
            setSelectedMediaItem1(media);
            setSelectedActor(null);
            setIsActorFilmographyVisible(false);
          }}
          onSelectFilm2={(media) => {
            setSelectedMediaItem2(media);
            setSelectedActor(null);
            setIsActorFilmographyVisible(false);
          }}
          // New actor selection handlers
          onSelectActor1={(actor) => {
            setSelectedCastMember1(actor);
          }}
          onSelectActor2={(actor) => {
            setSelectedCastMember2(actor);
          }}
          // Current selections for films and actors - FIXED: ensure proper MediaItem
          selectedFilm1={ensureMediaItemProperties(selectedMediaItem1)}
          selectedFilm2={ensureMediaItemProperties(selectedMediaItem2)}
          selectedActor1={selectedCastMember1}
          selectedActor2={selectedCastMember2}
        />
      )}
    </>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    actorSection: {
      flex: 2,
      minHeight: 200,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });

export default FilmComparisonView;
