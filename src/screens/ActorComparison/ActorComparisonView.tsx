import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext"; // Import MediaItem
import ActorSearch from "./ActorSearch";
import FilmDisplay from "./FilmDisplay";
import FilmCastModal from "./FilmCastModal";
import { MediaItem } from "../../types/types";

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

  const [isFilmCastVisible, setIsFilmCastVisible] = useState(false);
  // Change type from Film to MediaItem
  const [selectedFilmForCast, setSelectedFilmForCast] =
    useState<MediaItem | null>(null);

  return (
    <>
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

      {/* Add FilmDisplay component */}
      <View style={styles(colors).filmSection}>
        <FilmDisplay
          actor1Id={selectedCastMember1?.id}
          actor2Id={selectedCastMember2?.id}
          actor1Name={selectedCastMember1?.name}
          actor2Name={selectedCastMember2?.name}
          onFilmSelect={(film) => {
            setSelectedFilmForCast(film);
            setIsFilmCastVisible(true);
          }}
        />

        {selectedFilmForCast && (
          <FilmCastModal
            filmId={selectedFilmForCast.id}
            filmTitle={selectedFilmForCast.name}
            filmPosterPath={selectedFilmForCast.poster_path}
            mediaType={selectedFilmForCast.media_type}
            isVisible={isFilmCastVisible}
            onClose={() => {
              setIsFilmCastVisible(false);
              setSelectedFilmForCast(null);
            }}
            onSelectActor1={(actor) => {
              setSelectedCastMember1(actor);
              setIsFilmCastVisible(false);
              setSelectedFilmForCast(null);
            }}
            onSelectActor2={(actor) => {
              setSelectedCastMember2(actor);
              setIsFilmCastVisible(false);
              setSelectedFilmForCast(null);
            }}
            // Add these new props for film selection
            onSelectFilm1={(film) => {
              setSelectedMediaItem1(film);
            }}
            onSelectFilm2={(film) => {
              setSelectedMediaItem2(film);
            }}
            selectedActor1={selectedCastMember1}
            selectedActor2={selectedCastMember2}
            // Pass the current selected films
            selectedFilm1={selectedMediaItem1}
            selectedFilm2={selectedMediaItem2}
          />
        )}
      </View>
    </>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    filmSection: {
      flex: 2,
      minHeight: 300,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

export default ActorComparisonView;
