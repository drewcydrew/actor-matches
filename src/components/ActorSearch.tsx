import React, { useState, useEffect } from "react";
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
import { searchActor } from "../api/tmdbApi";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export interface Actor {
  id: number;
  name: string;
  profile_path?: string;
  known_for_department?: string;
  popularity?: number;
  known_for?: Array<{ title?: string; name?: string }>;
}

interface ActorSearchProps {
  onSelectActor: (actor: Actor) => void;
  selectedActor?: Actor | null;
  defaultQuery?: string; // New prop to set initial search term
  performInitialSearch?: boolean; // Flag to automatically perform search on mount
  defaultActorId?: number; // Optional actor ID to pre-select
}

const ActorSearch = ({
  onSelectActor,
  selectedActor,
  defaultQuery = "",
  performInitialSearch = false,
  defaultActorId,
}: ActorSearchProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState(defaultQuery);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialSearchDone, setInitialSearchDone] = useState(false);

  // Effect to handle initial search if requested
  useEffect(() => {
    if (performInitialSearch && defaultQuery && !initialSearchDone) {
      searchActors();
      setInitialSearchDone(true);
    }
  }, []);

  // Effect to handle pre-selecting an actor by ID
  useEffect(() => {
    const fetchActorById = async () => {
      if (defaultActorId && !selectedActor) {
        try {
          setLoading(true);
          // Use searchActor with the actor's name if available, otherwise use an empty string and filter results
          const searchTerm = defaultQuery || "";
          const personData = await searchActor(searchTerm);

          if (personData.results && personData.results.length > 0) {
            // Find the actor with the matching ID
            const foundActor = personData.results.find(
              (person: Actor) => person.id === defaultActorId
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
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActors([]);
    setError("");
  };

  const searchActors = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter an actor's name");
      return;
    }

    setLoading(true);
    setError("");
    setActors([]);

    try {
      const personData = await searchActor(searchQuery);

      if (personData.results && personData.results.length > 0) {
        // Filter to acting roles and sort by popularity if available
        const actorResults = personData.results
          .filter(
            (person: Actor) =>
              !person.known_for_department ||
              person.known_for_department === "Acting"
          )
          .sort(
            (a: Actor, b: Actor) => (b.popularity || 0) - (a.popularity || 0)
          );

        if (actorResults.length > 0) {
          setActors(actorResults as Actor[]);

          // If we have a defaultActorId and this is the initial search, select that actor
          if (defaultActorId && !initialSearchDone) {
            const defaultActor = actorResults.find(
              (actor) => actor.id === defaultActorId
            );
            if (defaultActor) {
              onSelectActor(defaultActor);
              setInitialSearchDone(true);
            }
          }
        } else {
          setError("No actors found with that name");
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

  const renderActor = ({ item }: { item: Actor }) => (
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
          <View style={styles(colors).collapseButton}>
            <Ionicons name="search" size={24} color={colors.primary} />
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
                    onChangeText={setSearchQuery}
                    autoFocus={true}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles(colors).clearButton}
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
                  onPress={searchActors}
                >
                  <Text style={styles(colors).buttonText}>Search</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles(colors).error}>{error}</Text> : null}

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
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
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
    collapseButton: {
      padding: 4,
      marginLeft: 8,
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
    clearButton: {
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
  });

export default ActorSearch;
