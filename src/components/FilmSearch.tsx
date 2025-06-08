import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import tmdbApi, { Film } from "../api/tmdbApi";
import { Ionicons } from "@expo/vector-icons";

interface FilmSearchProps {
  onSelectFilm: (film: Film) => void;
  initiallyExpanded?: boolean;
  onExpandStateChange?: (isExpanded: boolean) => void;
  selectedFilm?: Film | null;
}

const FilmSearch = ({
  onSelectFilm,
  initiallyExpanded = true,
  onExpandStateChange,
  selectedFilm,
}: FilmSearchProps) => {
  // Regular state
  const [searchQuery, setSearchQuery] = useState("");
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Collapse state
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const heightValue = useRef(new Animated.Value(1)).current;

  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // Animate height change
    Animated.timing(heightValue, {
      toValue: newExpandedState ? 1 : 0.15,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Notify parent component if callback provided
    if (onExpandStateChange) {
      onExpandStateChange(newExpandedState);
    }
  };

  const searchFilms = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a film title");
      return;
    }

    setLoading(true);
    setError("");
    setFilms([]);

    try {
      const movieData = await tmdbApi.searchMovies(searchQuery);

      if (movieData.results && movieData.results.length > 0) {
        setFilms(
          movieData.results.sort(
            (a: Film, b: Film) => b.popularity - a.popularity
          )
        );
      } else {
        setError("No films found");
      }
    } catch (err) {
      setError("An error occurred while searching");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderFilm = ({ item }: { item: Film }) => (
    <TouchableOpacity
      style={[
        styles.filmItem,
        selectedFilm?.id === item.id ? styles.selectedFilm : null,
      ]}
      onPress={() => onSelectFilm(item)}
      activeOpacity={0.7}
    >
      {item.poster_path && (
        <Image
          source={{
            uri: `https://image.tmdb.org/t/p/w92${item.poster_path}`,
          }}
          style={styles.poster}
        />
      )}
      <View style={styles.filmDetails}>
        <Text style={styles.filmTitle}>{item.title || "Untitled"}</Text>
        <Text style={styles.filmYear}>
          {item.release_date
            ? new Date(item.release_date).getFullYear().toString()
            : "Unknown"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { flex: heightValue }]}>
      {/* Header with collapse toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Films</Text>
        <TouchableOpacity
          onPress={toggleExpanded}
          style={styles.collapseButton}
        >
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#2196F3"
          />
        </TouchableOpacity>
      </View>

      {/* Content area - only shown when expanded */}
      {isExpanded && (
        <View style={styles.searchContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter film title"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.button} onPress={searchFilms}>
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <FlatList
              data={films}
              renderItem={renderFilm}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
              ListEmptyComponent={
                !error && !loading ? (
                  <Text style={styles.emptyText}>
                    Search for a film to see results
                  </Text>
                ) : null
              }
            />
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    overflow: "hidden",
  },
  searchContainer: {
    flex: 1,
    padding: 8,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  collapseButton: {
    padding: 4,
  },
  filmItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",
    backgroundColor: "#fff",
  },
  selectedFilm: {
    backgroundColor: "#e6f7ff",
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  poster: {
    width: 40,
    height: 60,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: "#e1e1e1",
  },
  filmDetails: {
    flex: 1,
    justifyContent: "center",
  },
  filmTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  filmYear: {
    fontSize: 12,
    color: "#666",
  },
  error: {
    color: "red",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
    fontSize: 14,
  },
});

export default FilmSearch;
