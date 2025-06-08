import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import tmdbApi, { CastMember } from "../api/tmdbApi";
import { useFilmContext } from "../context/FilmContext";
import { useTheme } from "../context/ThemeContext";

// Same interfaces as before
interface ActorDisplayProps {
  onActorSelect?: (actor: {
    id: number;
    name: string;
    profile_path?: string;
  }) => void;
}

interface CommonCastMember extends CastMember {
  characterInFilm1?: string;
  characterInFilm2?: string;
}

const ActorDisplay = ({ onActorSelect }: ActorDisplayProps) => {
  // Keep all your existing states and hooks
  const { colors } = useTheme();
  const { selectedFilm1, selectedFilm2 } = useFilmContext();
  const [castMembers, setCastMembers] = useState<CommonCastMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"single" | "comparison">("comparison");

  useEffect(() => {
    const fetchCasts = async () => {
      // Reset state
      setCastMembers([]);
      setError("");

      // Case 1: No films selected
      if (!selectedFilm1 && !selectedFilm2) {
        setMode("comparison");
        return;
      }

      // Case 2: Only one film selected
      if (
        (selectedFilm1 && !selectedFilm2) ||
        (!selectedFilm1 && selectedFilm2)
      ) {
        setMode("single");
        const selectedFilm = selectedFilm1 || selectedFilm2;

        if (!selectedFilm) return; // Shouldn't happen, but TypeScript safety

        setLoading(true);

        try {
          const castData = await tmdbApi.getMovieCast(selectedFilm.id);

          if (castData.cast && castData.cast.length > 0) {
            setCastMembers(
              castData.cast.sort(
                (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
              )
            );
          } else {
            setError("No cast information available for this film");
          }
        } catch (err) {
          setError("Error fetching cast information");
          console.error(err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Case 3: Both films selected - find common cast
      setMode("comparison");

      if (selectedFilm1 && selectedFilm2) {
        setLoading(true);

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
              setCastMembers(
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
      }
    };

    fetchCasts();
  }, [selectedFilm1, selectedFilm2]);

  const renderCastMember = ({ item }: { item: CommonCastMember }) => (
    <TouchableOpacity
      style={styles(colors).actorItem}
      onPress={() => onActorSelect && selectedFilm1 && onActorSelect(item)}
      disabled={!onActorSelect || !selectedFilm1}
      activeOpacity={onActorSelect && selectedFilm1 ? 0.7 : 1}
    >
      <View style={styles(colors).actorItem}>
        {item.profile_path ? (
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w185${item.profile_path}`,
            }}
            style={styles(colors).actorImage}
          />
        ) : (
          <View style={styles(colors).noImagePlaceholder}>
            <Text style={styles(colors).noImageText}>No Image</Text>
          </View>
        )}
        <View style={styles(colors).actorInfo}>
          <Text style={styles(colors).actorName}>{item.name}</Text>

          {/* Show different character info based on mode */}
          {mode === "comparison" ? (
            // Common cast mode - show both roles
            <>
              <Text style={styles(colors).character}>
                {`in "${selectedFilm1?.title}": ${
                  item.characterInFilm1 || item.character || "Unknown role"
                }`}
              </Text>
              <Text style={styles(colors).character}>
                {`in "${selectedFilm2?.title}": ${
                  item.characterInFilm2 || item.character || "Unknown role"
                }`}
              </Text>
            </>
          ) : (
            // Single film mode - just show the character
            <Text style={styles(colors).character}>
              {`as: ${item.character || "Unknown role"}`}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Title text based on film selection state
  const getTitleText = () => {
    if (!selectedFilm1 && !selectedFilm2) {
      return "Select a film to see its cast";
    } else if (selectedFilm1 && !selectedFilm2) {
      return `Cast of "${selectedFilm1.title}"`;
    } else if (!selectedFilm1 && selectedFilm2) {
      return `Cast of "${selectedFilm2.title}"`;
    } else if (selectedFilm1 && selectedFilm2) {
      return `Common cast in "${selectedFilm1.title}" and "${selectedFilm2.title}"`;
    } else {
      return "Actor Display";
    }
  };

  return (
    <View style={styles(colors).container}>
      <Text style={styles(colors).title}>{getTitleText()}</Text>

      {error ? <Text style={styles(colors).error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles(colors).castContainer}>
          {castMembers.length === 0 && !error && !loading ? (
            <Text style={styles(colors).emptyText}>
              {!selectedFilm1 && !selectedFilm2
                ? "Select at least one film above to see cast members"
                : selectedFilm1 && selectedFilm2
                ? "No common cast members found"
                : "No cast information available"}
            </Text>
          ) : (
            castMembers.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles(colors).actorItem}
                onPress={() =>
                  onActorSelect && selectedFilm1 && onActorSelect(item)
                }
                disabled={!onActorSelect || !selectedFilm1}
                activeOpacity={onActorSelect && selectedFilm1 ? 0.7 : 1}
              >
                <View style={styles(colors).actorItem}>
                  {item.profile_path ? (
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w185${item.profile_path}`,
                      }}
                      style={styles(colors).actorImage}
                    />
                  ) : (
                    <View style={styles(colors).noImagePlaceholder}>
                      <Text style={styles(colors).noImageText}>No Image</Text>
                    </View>
                  )}
                  <View style={styles(colors).actorInfo}>
                    <Text style={styles(colors).actorName}>{item.name}</Text>

                    {/* Show different character info based on mode */}
                    {mode === "comparison" ? (
                      <>
                        <Text style={styles(colors).character}>
                          {`in "${selectedFilm1?.title}": ${
                            item.characterInFilm1 ||
                            item.character ||
                            "Unknown role"
                          }`}
                        </Text>
                        <Text style={styles(colors).character}>
                          {`in "${selectedFilm2?.title}": ${
                            item.characterInFilm2 ||
                            item.character ||
                            "Unknown role"
                          }`}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles(colors).character}>
                        {`as: ${item.character || "Unknown role"}`}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
};

// Styles remain the same
const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 8,
      width: "100%",
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 8,
      color: colors.text,
    },
    castContainer: {
      flex: 1,
    },
    actorItem: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    actorImage: {
      width: 50,
      height: 75,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
    },
    noImagePlaceholder: {
      width: 50,
      height: 75,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    noImageText: {
      color: colors.textSecondary,
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
      color: colors.text,
    },
    character: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    error: {
      color: colors.error,
      marginBottom: 8,
      textAlign: "center",
      fontSize: 14,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      color: colors.textSecondary,
      fontSize: 14,
    },
    list: {
      flex: 1,
    },
  });

export default ActorDisplay;
