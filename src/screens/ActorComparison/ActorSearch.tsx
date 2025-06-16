import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useFilmContext } from "../../context/FilmContext";
import { Person } from "../../types/types";

// Add debounce helper function for smoother autocomplete
const debounce = (func: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

interface ActorSearchProps {
  onSelectActor: (actor: Person | null) => void; // Updated to accept null
  selectedActor?: Person | null;
  defaultQuery?: string;
  performInitialSearch?: boolean;
  defaultActorId?: number;
}

const ActorSearch = ({
  onSelectActor,
  selectedActor,
  defaultQuery = "",
  performInitialSearch = false,
  defaultActorId,
}: ActorSearchProps) => {
  const { colors } = useTheme();
  const { searchPeople } = useFilmContext();

  const [searchQuery, setSearchQuery] = useState(defaultQuery);
  const [actors, setActors] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialSearchDone, setInitialSearchDone] = useState(false);
  // New state for handling autocomplete
  const [isAutocompleting, setIsAutocompleting] = useState(false);

  // Create debounced search function for autocomplete
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setActors([]);
        setIsAutocompleting(false);
        return;
      }

      setLoading(true);
      setError("");
      setIsAutocompleting(true);

      try {
        const { results, error: searchError } = await searchPeople(query);

        if (searchError) {
          setError(searchError);
          setActors([]);
        } else if (results.length > 0) {
          setActors(results.slice(0, 6)); // Show top 6 results for autocomplete
        } else {
          setActors([]);
          setError("No matching actors found");
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
        setActors([]);
        setError("Error searching for actors");
      } finally {
        setLoading(false);
      }
    }, 300), // 300ms delay before searching
    [searchPeople]
  );

  // Handle input changes and trigger autocomplete
  const handleInputChange = (text: string) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      debouncedSearch(text);
    } else {
      setActors([]);
      setIsAutocompleting(false);
      setError("");
    }
  };

  // Handle clear actor selection
  const handleClearActor = (event: any) => {
    // Stop the event from propagating to parent (which would open the modal)
    event.stopPropagation();
    onSelectActor(null);
  };

  // Effect to handle initial search if requested
  useEffect(() => {
    if (performInitialSearch && defaultQuery && !initialSearchDone) {
      handleSearchActors();
      setInitialSearchDone(true);
    }
  }, []);

  // Effect to handle pre-selecting an actor by ID
  useEffect(() => {
    const fetchActorById = async () => {
      if (defaultActorId && !selectedActor) {
        try {
          setLoading(true);
          const searchTerm = defaultQuery || "";
          const { results, error: searchError } = await searchPeople(
            searchTerm
          );

          if (!searchError && results.length > 0) {
            // Find the actor with the matching ID
            const foundActor = results.find(
              (person: Person) => person.id === defaultActorId
            );

            if (foundActor) {
              onSelectActor(foundActor);
              setInitialSearchDone(true);
            }
          }
        } catch (err) {
          console.error("Failed to fetch actor by ID:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchActorById();
  }, [defaultActorId]);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
    // Reset autocomplete when opening/closing modal
    if (!isModalVisible) {
      setIsAutocompleting(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActors([]);
    setError("");
    setIsAutocompleting(false);
  };

  // Full search function (keeps existing functionality)
  const handleSearchActors = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter an actor's name");
      return;
    }

    setLoading(true);
    setError("");
    setActors([]);
    setIsAutocompleting(false); // We're doing a full search, not autocomplete

    try {
      const { results, error: searchError } = await searchPeople(searchQuery);

      if (searchError) {
        setError(searchError);
      } else if (results.length > 0) {
        setActors(results);

        // If we have a defaultActorId and this is the initial search, select that actor
        if (defaultActorId && !initialSearchDone) {
          const defaultActor = results.find(
            (actor) => actor.id === defaultActorId
          );
          if (defaultActor) {
            onSelectActor(defaultActor);
            setInitialSearchDone(true);
          }
        }
      } else {
        setError("No actors found");
      }
    } catch (err) {
      setError("An error occurred while searching");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderActor = ({ item }: { item: Person }) => (
    <TouchableOpacity
      style={[
        styles(colors).actorItem,
        selectedActor?.id === item.id ? styles(colors).selectedActor : null,
      ]}
      onPress={() => {
        onSelectActor(item);
        setIsModalVisible(false);
      }}
      activeOpacity={0.7}
    >
      {item.profile_path ? (
        <Image
          source={{
            uri: `https://image.tmdb.org/t/p/w185${item.profile_path}`,
          }}
          style={styles(colors).actorImage}
        />
      ) : (
        <View style={styles(colors).noImagePlaceholder}>
          <Ionicons name="person" size={30} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles(colors).actorDetails}>
        <Text style={styles(colors).actorName}>{item.name || "Unknown"}</Text>
        {item.known_for_department && (
          <Text style={styles(colors).actorDepartment}>
            {item.known_for_department}
          </Text>
        )}
        {item.known_for && item.known_for.length > 0 && (
          <Text
            style={styles(colors).knownFor}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Known for:{" "}
            {item.known_for
              .map((work) => work.title || work.name)
              .filter(Boolean)
              .join(", ")}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const getHeaderContent = () => {
    if (selectedActor) {
      console.log(
        `https://image.tmdb.org/t/p/w185${selectedActor.profile_path}`
      );
      return (
        <View style={styles(colors).collapsedHeader}>
          {selectedActor.profile_path ? (
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w185${selectedActor.profile_path}`,
              }}
              style={styles(colors).headerPhoto}
            />
          ) : (
            <View style={styles(colors).headerNoImage}>
              <Ionicons name="person" size={14} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles(colors).headerTextContainer}>
            <Text style={styles(colors).headerActorName} numberOfLines={1}>
              {selectedActor.name}
            </Text>
          </View>
        </View>
      );
    } else {
      return <Text style={styles(colors).sectionTitle}>Select an actor</Text>;
    }
  };

  return (
    <>
      {/* Collapsed view - always visible */}
      <View style={styles(colors).container}>
        <TouchableOpacity
          style={styles(colors).headerRow}
          onPress={toggleModal}
          activeOpacity={0.7}
        >
          {getHeaderContent()}

          <View style={styles(colors).actionButtons}>
            {selectedActor && (
              <TouchableOpacity
                style={styles(colors).clearButton}
                onPress={handleClearActor}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
            <View style={styles(colors).collapseButton}>
              <Ionicons name="search" size={24} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal for search functionality */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).modalContent}>
            <View style={styles(colors).modalHeader}>
              <Text style={styles(colors).modalTitle}>
                {selectedActor ? "Change actor" : "Search actors"}
              </Text>
              <TouchableOpacity
                style={styles(colors).closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles(colors).searchContainer}>
              <View style={styles(colors).inputRow}>
                <View style={styles(colors).inputContainer}>
                  <TextInput
                    style={styles(colors).input}
                    placeholder="Enter actor name"
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={handleInputChange} // Use new handler for autocomplete
                    autoFocus={true}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles(colors).searchClearButton}
                      onPress={clearSearch}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles(colors).button}
                  onPress={handleSearchActors}
                >
                  <Text style={styles(colors).buttonText}>Search</Text>
                </TouchableOpacity>
              </View>

              {/* Autocomplete suggestions */}
              {isAutocompleting && searchQuery.length >= 2 && (
                <View style={styles(colors).autoCompleteContainer}>
                  {loading ? (
                    <View style={styles(colors).autocompleteLoading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles(colors).autocompleteLoadingText}>
                        Finding actors...
                      </Text>
                    </View>
                  ) : actors.length > 0 ? (
                    <>
                      <Text style={styles(colors).suggestionsTitle}>
                        Suggestions
                      </Text>
                      <FlatList
                        data={actors}
                        renderItem={renderActor}
                        keyExtractor={(item) => item.id.toString()}
                        style={styles(colors).autoCompleteList}
                      />
                    </>
                  ) : error ? (
                    <Text style={styles(colors).autocompleteError}>
                      {error}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Show full search results when not in autocomplete mode */}
              {!isAutocompleting && (
                <>
                  {error ? (
                    <Text style={styles(colors).error}>{error}</Text>
                  ) : null}

                  {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                  ) : (
                    <FlatList
                      data={actors}
                      renderItem={renderActor}
                      keyExtractor={(item) => item.id.toString()}
                      style={styles(colors).list}
                      ListEmptyComponent={
                        !error && !loading ? (
                          <Text style={styles(colors).emptyText}>
                            Search for an actor to see results
                          </Text>
                        ) : null
                      }
                    />
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Updated styles
const styles = (colors: any) =>
  StyleSheet.create({
    // Existing styles
    container: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.headerBackground,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    collapsedHeader: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    headerPhoto: {
      width: 30,
      height: 30,
      marginRight: 8,
      borderRadius: 15,
      backgroundColor: colors.placeholderBackground,
    },
    headerNoImage: {
      width: 30,
      height: 30,
      marginRight: 8,
      borderRadius: 15,
      backgroundColor: colors.placeholderBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTextContainer: {
      flex: 1,
    },
    headerActorName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    // New buttons container
    actionButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    collapseButton: {
      padding: 4,
      marginLeft: 8,
    },
    clearButton: {
      padding: 4,
      marginRight: 4,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "90%",
      maxHeight: "80%",
      backgroundColor: colors.background,
      borderRadius: 10,
      overflow: "hidden",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      flex: 1,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    searchContainer: {
      flex: 1,
      padding: 16,
    },
    inputRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    inputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      marginRight: 8,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      color: colors.text,
      height: "100%",
      paddingRight: 24,
    },
    searchClearButton: {
      // Renamed from clearButton to avoid conflicts
      padding: 3,
      justifyContent: "center",
      alignItems: "center",
    },
    button: {
      backgroundColor: colors.primary,
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
    actorItem: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      backgroundColor: colors.background,
      alignItems: "center",
    },
    selectedActor: {
      backgroundColor: colors.selectedItem,
    },
    actorImage: {
      width: 50,
      height: 50,
      marginRight: 10,
      borderRadius: 25,
      backgroundColor: colors.placeholderBackground,
    },
    noImagePlaceholder: {
      width: 50,
      height: 50,
      marginRight: 10,
      borderRadius: 25,
      backgroundColor: colors.placeholderBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    actorDetails: {
      flex: 1,
      justifyContent: "center",
    },
    actorName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 2,
    },
    actorDepartment: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    knownFor: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    error: {
      color: colors.error,
      marginBottom: 8,
      textAlign: "center",
      fontSize: 12,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      color: colors.textSecondary,
      fontSize: 14,
    },
    // Add new styles for autocomplete
    autoCompleteContainer: {
      backgroundColor: colors.surface || colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
      maxHeight: 300,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
      paddingVertical: 5,
    },
    autoCompleteList: {
      maxHeight: 280,
    },
    suggestionsTitle: {
      fontSize: 12,
      color: colors.textSecondary,
      paddingHorizontal: 12,
      paddingBottom: 4,
      marginBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    autocompleteLoading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
    },
    autocompleteLoadingText: {
      marginLeft: 8,
      color: colors.textSecondary,
      fontSize: 14,
    },
    autocompleteError: {
      padding: 12,
      color: colors.error,
      textAlign: "center",
    },
  });

export default ActorSearch;
