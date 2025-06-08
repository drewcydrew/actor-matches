import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import tmdbApi, { Film } from "../api/tmdbApi";
import { useTheme } from "../context/ThemeContext";

// Define our props
interface FilmDisplayProps {
  actor1Id?: number;
  actor2Id?: number;
  actor1Name?: string;
  actor2Name?: string;
  onFilmSelect?: (film: Film) => void;
}

// Extended Film interface to include character information
interface CommonFilm extends Film {
  characterForActor1?: string;
  characterForActor2?: string;
}

const FilmDisplay = ({
  actor1Id,
  actor2Id,
  actor1Name = "First actor",
  actor2Name = "Second actor",
  onFilmSelect,
}: FilmDisplayProps) => {
  const { colors } = useTheme();
  const [commonFilms, setCommonFilms] = useState<CommonFilm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCommonFilms = async () => {
      // Reset state
      setCommonFilms([]);
      setError("");

      // Case 1: No actors selected
      if (!actor1Id && !actor2Id) {
        return;
      }

      // Case 2: Only one actor selected - show their films
      if ((actor1Id && !actor2Id) || (!actor1Id && actor2Id)) {
        const selectedActorId = actor1Id || actor2Id;
        const selectedActorName = actor1Id ? actor1Name : actor2Name;

        if (!selectedActorId) return; // TypeScript safety

        setLoading(true);

        try {
          const creditsData = await tmdbApi.getActorMovieCredits(
            selectedActorId
          );

          if (creditsData.cast && creditsData.cast.length > 0) {
            // Sort by popularity and add character information
            const actorFilms = creditsData.cast
              .filter((film) => film.release_date) // Filter out films with no release date
              .map((film) => ({
                ...film,
                characterForActor1: actor1Id ? film.character : undefined,
                characterForActor2: actor2Id ? film.character : undefined,
              }))
              .sort((a, b) => b.popularity - a.popularity);

            setCommonFilms(actorFilms);
          } else {
            setError(`No films found for ${selectedActorName}`);
          }
        } catch (err) {
          setError("Error fetching actor's filmography");
          console.error(err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Case 3: Both actors selected - find common films
      if (actor1Id && actor2Id) {
        setLoading(true);

        try {
          // Fetch credits for both actors
          const actor1Credits = await tmdbApi.getActorMovieCredits(actor1Id);
          const actor2Credits = await tmdbApi.getActorMovieCredits(actor2Id);

          if (
            actor1Credits.cast &&
            actor2Credits.cast &&
            actor1Credits.cast.length > 0 &&
            actor2Credits.cast.length > 0
          ) {
            // Create map of films from first actor for fast lookup
            const filmsMap = new Map();
            actor1Credits.cast.forEach((film) => {
              if (film.release_date) {
                // Filter out films with no release date
                filmsMap.set(film.id, {
                  ...film,
                  characterForActor1: film.character || "Unknown role",
                });
              }
            });

            // Find films that both actors appeared in
            const matchingFilms = actor2Credits.cast
              .filter((film) => filmsMap.has(film.id) && film.release_date)
              .map((film) => {
                const filmWithActor1 = filmsMap.get(film.id);
                return {
                  ...filmWithActor1,
                  characterForActor2: film.character || "Unknown role",
                };
              });

            if (matchingFilms.length > 0) {
              setCommonFilms(
                matchingFilms.sort((a, b) => b.popularity - a.popularity)
              );
            } else {
              setError(
                `${actor1Name} and ${actor2Name} haven't appeared in any films together`
              );
            }
          } else {
            setError("Filmography not available for one or both actors");
          }
        } catch (err) {
          setError("Error fetching filmography information");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCommonFilms();
  }, [actor1Id, actor2Id, actor1Name, actor2Name]);

  // Title text based on actor selection state
  const getTitleText = () => {
    if (!actor1Id && !actor2Id) {
      return "Select actors to see their films";
    } else if (actor1Id && !actor2Id) {
      return `Filmography of ${actor1Name}`;
    } else if (!actor1Id && actor2Id) {
      return `Filmography of ${actor2Name}`;
    } else if (actor1Id && actor2Id) {
      return `Films with both ${actor1Name} and ${actor2Name}`;
    } else {
      return "Film Display";
    }
  };

  return (
    <View style={styles(colors).container}>
      <Text style={styles(colors).title}>{getTitleText()}</Text>

      {error ? <Text style={styles(colors).error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles(colors).filmsContainer}>
          {commonFilms.length === 0 && !error && !loading ? (
            <Text style={styles(colors).emptyText}>
              {!actor1Id && !actor2Id
                ? "Select actors above to see their common films"
                : actor1Id && actor2Id
                ? "No films found with both actors"
                : "No filmography information available"}
            </Text>
          ) : (
            commonFilms.map((film) => (
              <TouchableOpacity
                key={film.id.toString()}
                style={styles(colors).filmItem}
                onPress={() => onFilmSelect && onFilmSelect(film)}
                disabled={!onFilmSelect}
                activeOpacity={onFilmSelect ? 0.7 : 1}
              >
                <View style={styles(colors).filmItemContent}>
                  {film.poster_path ? (
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w92${film.poster_path}`,
                      }}
                      style={styles(colors).poster}
                    />
                  ) : (
                    <View style={styles(colors).noImagePlaceholder}>
                      <Text style={styles(colors).noImageText}>No Poster</Text>
                    </View>
                  )}
                  <View style={styles(colors).filmInfo}>
                    <Text style={styles(colors).filmTitle}>{film.title}</Text>
                    <Text style={styles(colors).filmYear}>
                      {film.release_date
                        ? new Date(film.release_date).getFullYear()
                        : "Unknown year"}
                    </Text>

                    {/* Show character info for both actors when in common film mode */}
                    {actor1Id && actor2Id ? (
                      <>
                        <Text style={styles(colors).character}>
                          {`${actor1Name} as: ${
                            film.characterForActor1 || "Unknown role"
                          }`}
                        </Text>
                        <Text style={styles(colors).character}>
                          {`${actor2Name} as: ${
                            film.characterForActor2 || "Unknown role"
                          }`}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles(colors).character}>
                        {`as: ${film.character || "Unknown role"}`}
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
    filmsContainer: {
      flex: 1,
    },
    filmItem: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filmItemContent: {
      flexDirection: "row",
    },
    poster: {
      width: 60,
      height: 90,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
    },
    noImagePlaceholder: {
      width: 60,
      height: 90,
      borderRadius: 4,
      backgroundColor: colors.placeholderBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    noImageText: {
      color: colors.textSecondary,
      fontSize: 10,
      textAlign: "center",
    },
    filmInfo: {
      marginLeft: 12,
      flex: 1,
      justifyContent: "center",
    },
    filmTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 2,
      color: colors.text,
    },
    filmYear: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
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
  });

export default FilmDisplay;
