import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import {
  useFilmContext,
  SelectedActor,
  MediaItem,
} from "../../context/FilmContext";
import FilmSearch from "./FilmSearch";
import ActorDisplay from "./ActorDisplay";
import ActorFilmographyModal from "./ActorFilmographyModal";

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

  // Function to convert MediaItem to Film for backwards compatibility with ActorFilmographyModal
  const convertMediaItemToFilm = (media: MediaItem | null) => {
    if (!media) return null;

    return {
      id: media.id,
      title: media.title,
      release_date:
        media.media_type === "tv" ? media.first_air_date : media.release_date,
      popularity: media.popularity,
      overview: media.overview,
      poster_path: media.poster_path,
      vote_average: media.vote_average,
    };
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
          // Film selection handlers
          onSelectFilm1={(film) => {
            setSelectedMediaItem1({
              ...film,
              media_type: "movie",
            });
            setSelectedActor(null);
            setIsActorFilmographyVisible(false);
          }}
          onSelectFilm2={(film) => {
            setSelectedMediaItem2({
              ...film,
              media_type: "movie",
            });
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
          // Current selections for films and actors
          selectedFilm1={convertMediaItemToFilm(selectedMediaItem1)}
          selectedFilm2={convertMediaItemToFilm(selectedMediaItem2)}
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
