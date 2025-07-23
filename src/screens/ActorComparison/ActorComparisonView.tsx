import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";
import ActorSearch from "./ActorSearch";
import FilmDisplay from "./FilmDisplay";
import MediaCastModal from "./FilmCastModal"; // Updated import name
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

  const [isMediaCastVisible, setIsMediaCastVisible] = useState(false);
  const [selectedMediaForCast, setSelectedMediaForCast] =
    useState<MediaItem | null>(null);

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
      flex: 1, // Changed from flex: 2 to flex: 1
      minHeight: 300,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

export default ActorComparisonView;
