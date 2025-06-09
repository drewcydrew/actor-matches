import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext, SelectedActor } from "../../context/FilmContext";
import FilmSearch from "./FilmSearch";
import ActorDisplay from "./ActorDisplay";
import ActorFilmographyModal from "./ActorFilmographyModal";

const FilmComparisonView = () => {
  const { colors } = useTheme();
  const { selectedFilm1, selectedFilm2, setSelectedFilm1, setSelectedFilm2 } =
    useFilmContext();

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

  return (
    <>
      {/* First film search */}
      <FilmSearch
        onSelectFilm={setSelectedFilm1}
        selectedFilm={selectedFilm1}
      />

      {/* Always show second film search */}
      <FilmSearch
        onSelectFilm={setSelectedFilm2}
        selectedFilm={selectedFilm2}
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
          isVisible={isActorFilmographyVisible}
          onClose={() => {
            setIsActorFilmographyVisible(false);
            setSelectedActor(null);
          }}
          onSelectFilm1={(film) => {
            setSelectedFilm1(film);
            setSelectedActor(null);
            setIsActorFilmographyVisible(false);
          }}
          onSelectFilm2={(film) => {
            setSelectedFilm2(film);
            setSelectedActor(null);
            setIsActorFilmographyVisible(false);
          }}
          selectedFilm1={selectedFilm1}
          selectedFilm2={selectedFilm2}
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
