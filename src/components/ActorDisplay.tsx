import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import tmdbApi, { CastMember } from "../api/tmdbApi";
import { useFilmContext } from "../context/FilmContext";

interface ActorDisplayProps {}

// Extended CastMember to include roles from both films
interface CommonCastMember extends CastMember {
  characterInFilm1: string;
  characterInFilm2: string;
}

const ActorDisplay = ({}: ActorDisplayProps) => {
  // Get selected films from context
  const { selectedFilm1, selectedFilm2 } = useFilmContext();

  const [commonCast, setCommonCast] = useState<CommonCastMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCasts = async () => {
      // Only proceed if both films are selected
      if (!selectedFilm1 || !selectedFilm2) return;

      setLoading(true);
      setError("");
      setCommonCast([]);

      try {
        // Fetch cast for both films
        const cast1Data = await tmdbApi.getMovieCast(selectedFilm1.id);
        const cast2Data = await tmdbApi.getMovieCast(selectedFilm2.id);

        if (
          cast1Data.cast &&
          cast2Data.cast &&
          cast1Data.cast.length > 0 &&
          cast2Data.cast.length > 0
        ) {
          // Create map of actor IDs from first cast for fast lookup
          const cast1Map = new Map();
          cast1Data.cast.forEach((actor) => {
            cast1Map.set(actor.id, actor);
          });

          // Find actors in both casts
          const matchingActors = cast2Data.cast
            .filter((actor) => cast1Map.has(actor.id))
            .map((actor) => {
              const actorInFilm1 = cast1Map.get(actor.id);
              return {
                ...actor,
                characterInFilm1: actorInFilm1.character || "Unknown role",
                characterInFilm2: actor.character || "Unknown role",
              };
            });

          if (matchingActors.length > 0) {
            setCommonCast(
              matchingActors.sort(
                (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
              )
            );
          } else {
            setError("No common cast members found");
          }
        } else {
          setError("Cast information not available for one or both films");
        }
      } catch (err) {
        setError("Error fetching cast information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCasts();
  }, [selectedFilm1, selectedFilm2]);

  const renderCastMember = ({ item }: { item: CommonCastMember }) => (
    <View style={styles.actorItem}>
      {item.profile_path ? (
        <Image
          source={{
            uri: `https://image.tmdb.org/t/p/w185${item.profile_path}`,
          }}
          style={styles.actorImage}
        />
      ) : (
        <View style={styles.noImagePlaceholder}>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      <View style={styles.actorInfo}>
        <Text style={styles.actorName}>{item.name}</Text>
        <Text style={styles.character}>
          {`in "${selectedFilm1?.title}": ${item.characterInFilm1}`}
        </Text>
        <Text style={styles.character}>
          {`in "${selectedFilm2?.title}": ${item.characterInFilm2}`}
        </Text>
      </View>
    </View>
  );

  // Title text based on film selection state
  const getTitleText = () => {
    if (!selectedFilm1 && !selectedFilm2) {
      return "Select two films to find common cast";
    } else if (!selectedFilm1) {
      return `Select a first film to compare with "${selectedFilm2?.title}"`;
    } else if (!selectedFilm2) {
      return `Select a second film to compare with "${selectedFilm1?.title}"`;
    } else {
      return `Common cast in "${selectedFilm1.title}" and "${selectedFilm2.title}"`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitleText()}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={commonCast}
          renderItem={renderCastMember}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          ListEmptyComponent={
            !error && !loading && (!selectedFilm1 || !selectedFilm2) ? (
              <Text style={styles.emptyText}>
                Select two films above to see common cast members
              </Text>
            ) : !error && !loading && commonCast.length === 0 ? (
              <Text style={styles.emptyText}>No common cast members found</Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    width: "100%",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
  },
  list: {
    flex: 1,
  },
  actorItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  actorImage: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: "#e1e1e1",
  },
  noImagePlaceholder: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: "#e1e1e1",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#999",
    fontSize: 8,
  },
  actorInfo: {
    marginLeft: 8,
    flex: 1,
  },
  actorName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  character: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  error: {
    color: "red",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
    fontSize: 14,
  },
});

export default ActorDisplay;
