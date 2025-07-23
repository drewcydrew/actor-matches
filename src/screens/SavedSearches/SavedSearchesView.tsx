import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
  Platform,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import {
  useSavedSearches,
  SavedSearch,
} from "../../context/SavedSearchesContext";
import { useFilmContext } from "../../context/FilmContext";
import { Ionicons } from "@expo/vector-icons";

// Add navigation callback prop
interface SavedSearchesViewProps {
  onNavigateToTab?: (tab: "compareByFilm" | "compareByActor") => void;
}

const SavedSearchesView = ({ onNavigateToTab }: SavedSearchesViewProps) => {
  const { colors } = useTheme();
  const {
    savedSearches,
    loading,
    error,
    deleteSearch,
    updateSearch,
    clearAllSearches,
    searchSavedSearches,
    getSearchesByType,
    getRecentSearches,
  } = useSavedSearches();

  const {
    // Use array-based cast member selection instead of individual items
    selectedCastMembers,
    clearCastMembers,
    addCastMember,
    // Use array-based media selection instead of individual items
    clearMediaItems,
    addMediaItem,
  } = useFilmContext();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "media" | "person">(
    "all"
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Add confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [searchToDelete, setSearchToDelete] = useState<SavedSearch | null>(
    null
  );
  const [showClearAllConfirmation, setShowClearAllConfirmation] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add local error state for web-specific errors
  const [localError, setLocalError] = useState<string | null>(null);

  // Get filtered searches based on search query and type filter
  const getFilteredSearches = () => {
    let filtered = savedSearches;

    // Apply type filter
    if (filterType !== "all") {
      filtered = getSearchesByType(filterType);
    }

    // Apply search query
    if (searchQuery.trim()) {
      filtered = searchSavedSearches(searchQuery);
      // Re-apply type filter if needed
      if (filterType !== "all") {
        filtered = filtered.filter((search) => search.type === filterType);
      }
    }

    return filtered;
  };

  const filteredSearches = getFilteredSearches();

  // Handle loading a saved search
  const handleLoadSearch = (search: SavedSearch) => {
    if (search.type === "media") {
      // Load media comparison - only update media items, don't touch people
      // Clear current selections first
      clearMediaItems();

      // Add each media item from the array to the current selection
      if (search.mediaItems && search.mediaItems.length > 0) {
        search.mediaItems.forEach((mediaItem) => {
          addMediaItem(mediaItem);
        });
      }
      // Don't clear selected people - let them remain as they are

      // Navigate to compare by media tab
      if (onNavigateToTab) {
        onNavigateToTab("compareByFilm");
      }
    } else {
      // Load person comparison - only update people, don't touch media
      clearCastMembers();

      // Use array format only
      if (search.people && search.people.length > 0) {
        search.people.forEach((person) => {
          addCastMember(person);
        });
      }
      // Don't clear selected media - let them remain as they are

      // Navigate to compare by person tab
      if (onNavigateToTab) {
        onNavigateToTab("compareByActor");
      }
    }

    // Remove the success alert - navigation indicates success
  };

  // Function to load a saved search and apply it to the current context
  const loadSavedSearch = async (search: SavedSearch) => {
    try {
      if (search.type === "media") {
        // Clear current selections first
        clearMediaItems();

        // Add each media item from the array to the current selection
        if (search.mediaItems && search.mediaItems.length > 0) {
          search.mediaItems.forEach((mediaItem) => {
            addMediaItem(mediaItem);
          });
        }
      } else if (search.type === "person") {
        clearCastMembers();

        // Use array format only
        if (search.people && search.people.length > 0) {
          search.people.forEach((person) => {
            addCastMember(person);
          });
        }
      }

      // Show success message
      Alert.alert(
        "Search Loaded",
        `"${search.name}" has been loaded successfully.`
      );
    } catch (error) {
      console.error("Error loading saved search:", error);
      Alert.alert("Error", "Failed to load the saved search.");
    }
  };

  // Handle deleting a search
  const handleDeleteSearch = (search: SavedSearch) => {
    if (Platform.OS === "web") {
      // Use custom modal for web
      setSearchToDelete(search);
      setShowDeleteConfirmation(true);
    } else {
      // Use native Alert for mobile
      Alert.alert(
        "Delete Search",
        `Are you sure you want to delete "${search.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => performDeleteSearch(search),
          },
        ]
      );
    }
  };

  // Perform the actual delete operation
  const performDeleteSearch = async (search: SavedSearch) => {
    setIsDeleting(true);
    setLocalError(null); // Clear any previous local errors

    const success = await deleteSearch(search.id);
    setIsDeleting(false);

    if (!success) {
      if (Platform.OS === "web") {
        // For web, set local error state
        setLocalError("Failed to delete search. Please try again.");
      } else {
        Alert.alert("Error", "Failed to delete search. Please try again.");
      }
    }

    // Close confirmation modal
    setShowDeleteConfirmation(false);
    setSearchToDelete(null);
  };

  // Handle editing a search
  const handleEditSearch = (search: SavedSearch) => {
    setEditingSearch(search);
    setEditName(search.name);
    setEditDescription(search.description || "");
    setShowEditModal(true);
  };

  // Handle saving edits
  const handleSaveEdit = async () => {
    if (!editingSearch || !editName.trim()) {
      Alert.alert("Error", "Please enter a name for the search.");
      return;
    }

    setIsUpdating(true);

    try {
      const success = await updateSearch(editingSearch.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });

      if (success) {
        setShowEditModal(false);
        setEditingSearch(null);
        setEditName("");
        setEditDescription("");
      } else {
        Alert.alert("Error", "Failed to update search. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update search. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle clearing all searches
  const handleClearAll = () => {
    if (savedSearches.length === 0) return;

    if (Platform.OS === "web") {
      // Use custom modal for web
      setShowClearAllConfirmation(true);
    } else {
      // Use native Alert for mobile
      Alert.alert(
        "Clear All Searches",
        "Are you sure you want to delete all saved searches? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear All",
            style: "destructive",
            onPress: performClearAll,
          },
        ]
      );
    }
  };

  // Perform the actual clear all operation
  const performClearAll = async () => {
    setIsDeleting(true);
    setLocalError(null); // Clear any previous local errors

    const success = await clearAllSearches();
    setIsDeleting(false);

    if (!success) {
      if (Platform.OS === "web") {
        setLocalError("Failed to clear searches. Please try again.");
      } else {
        Alert.alert("Error", "Failed to clear searches. Please try again.");
      }
    }

    // Close confirmation modal
    setShowClearAllConfirmation(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Helper function to get media display text - simplified to only use array
  const getMediaDisplayText = (search: SavedSearch): string => {
    if (search.type !== "media") return "";

    if (search.mediaItems && search.mediaItems.length > 0) {
      if (search.mediaItems.length === 1) {
        return search.mediaItems[0].name;
      } else if (search.mediaItems.length === 2) {
        return `${search.mediaItems[0].name} & ${search.mediaItems[1].name}`;
      } else {
        return `${search.mediaItems[0].name} + ${
          search.mediaItems.length - 1
        } more`;
      }
    }

    return "Empty media comparison";
  };

  // Get search preview text - updated to use array format only
  const getSearchPreview = (search: SavedSearch) => {
    if (search.type === "media") {
      if (search.mediaItems && search.mediaItems.length > 0) {
        if (search.mediaItems.length === 1) {
          return search.mediaItems[0].name;
        } else if (search.mediaItems.length === 2) {
          return `${search.mediaItems[0].name} & ${search.mediaItems[1].name}`;
        } else {
          return `${search.mediaItems[0].name} + ${
            search.mediaItems.length - 1
          } more`;
        }
      }
      return "Empty media comparison";
    } else {
      // Use array format only
      if (search.people && search.people.length > 0) {
        const peopleNames = search.people.map((person) => person.name);

        if (peopleNames.length === 1) {
          return peopleNames[0];
        } else if (peopleNames.length === 2) {
          return `${peopleNames[0]} & ${peopleNames[1]}`;
        } else {
          return `${peopleNames[0]} + ${peopleNames.length - 1} more`;
        }
      }
      return "Empty person comparison";
    }
  };

  // Render search item
  const renderSearchItem = ({ item }: { item: SavedSearch }) => (
    <TouchableOpacity
      style={styles(colors).searchItem}
      onPress={() => handleLoadSearch(item)}
      activeOpacity={0.7}
    >
      <View style={styles(colors).searchItemContent}>
        {/* Header with name and type */}
        <View style={styles(colors).searchItemHeader}>
          <Text style={styles(colors).searchName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles(colors).typeBadge,
              {
                backgroundColor:
                  item.type === "media" ? colors.primary : colors.secondary,
              },
            ]}
          >
            <Ionicons
              name={item.type === "media" ? "film" : "people"}
              size={12}
              color="#fff"
            />
            <Text style={styles(colors).typeBadgeText}>
              {item.type === "media" ? "MEDIA" : "PERSON"}
            </Text>
          </View>
        </View>

        {/* Preview */}
        <Text style={styles(colors).searchPreview} numberOfLines={1}>
          {getSearchPreview(item)}
        </Text>

        {/* Description if available */}
        {item.description && (
          <Text style={styles(colors).searchDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Date */}
        <Text style={styles(colors).searchDate}>
          Modified: {formatDate(item.dateModified)}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles(colors).actionButtons}>
        <TouchableOpacity
          style={styles(colors).actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleEditSearch(item);
          }}
        >
          <Ionicons name="pencil" size={16} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles(colors).actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteSearch(item);
          }}
        >
          <Ionicons name="trash" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles(colors).centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles(colors).loadingText}>
          Loading saved searches...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).title}>Saved Searches</Text>
        {savedSearches.length > 0 && (
          <TouchableOpacity
            style={styles(colors).clearAllButton}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles(colors).clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search and filters */}
      {savedSearches.length > 0 && (
        <View style={styles(colors).controlsContainer}>
          {/* Search input */}
          <View style={styles(colors).searchContainer}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles(colors).searchInput}
              placeholder="Search saved searches..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Type filter */}
          <View style={styles(colors).filterContainer}>
            <TouchableOpacity
              style={[
                styles(colors).filterButton,
                filterType === "all" && styles(colors).activeFilterButton,
              ]}
              onPress={() => setFilterType("all")}
            >
              <Text
                style={[
                  styles(colors).filterButtonText,
                  filterType === "all" && styles(colors).activeFilterText,
                ]}
              >
                All ({savedSearches.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles(colors).filterButton,
                filterType === "media" && styles(colors).activeFilterButton,
              ]}
              onPress={() => setFilterType("media")}
            >
              <Text
                style={[
                  styles(colors).filterButtonText,
                  filterType === "media" && styles(colors).activeFilterText,
                ]}
              >
                Media ({getSearchesByType("media").length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles(colors).filterButton,
                filterType === "person" && styles(colors).activeFilterButton,
              ]}
              onPress={() => setFilterType("person")}
            >
              <Text
                style={[
                  styles(colors).filterButtonText,
                  filterType === "person" && styles(colors).activeFilterText,
                ]}
              >
                People ({getSearchesByType("person").length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Error message - show both context error and local error */}
      {(error || localError) && (
        <View style={styles(colors).errorContainer}>
          <Text style={styles(colors).errorText}>{error || localError}</Text>
          {localError && (
            <TouchableOpacity
              style={styles(colors).dismissErrorButton}
              onPress={() => setLocalError(null)}
            >
              <Text style={styles(colors).dismissErrorText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      {filteredSearches.length > 0 ? (
        <FlatList
          data={filteredSearches}
          renderItem={renderSearchItem}
          keyExtractor={(item) => item.id}
          style={styles(colors).list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles(colors).emptyContainer}>
          <Ionicons
            name="bookmark-outline"
            size={64}
            color={colors.textSecondary}
            style={styles(colors).emptyIcon}
          />
          <Text style={styles(colors).emptyTitle}>
            {savedSearches.length === 0
              ? "No Saved Searches"
              : searchQuery.trim()
              ? "No matches found"
              : `No ${filterType} searches`}
          </Text>
          <Text style={styles(colors).emptyDescription}>
            {savedSearches.length === 0
              ? "Save your media or person comparisons to access them quickly later."
              : searchQuery.trim()
              ? "Try adjusting your search terms or filters."
              : "Try selecting a different filter or clearing your search."}
          </Text>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteConfirmation(false);
          setSearchToDelete(null);
        }}
      >
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).confirmationModalContainer}>
            <View style={styles(colors).confirmationModalHeader}>
              <Text style={styles(colors).confirmationModalTitle}>
                Delete Search
              </Text>
            </View>

            <View style={styles(colors).confirmationModalContent}>
              <Text style={styles(colors).confirmationText}>
                Are you sure you want to delete "{searchToDelete?.name}"?
              </Text>
              <Text style={styles(colors).confirmationSubtext}>
                This action cannot be undone.
              </Text>

              <View style={styles(colors).confirmationModalButtons}>
                <TouchableOpacity
                  style={styles(colors).cancelButton}
                  onPress={() => {
                    setShowDeleteConfirmation(false);
                    setSearchToDelete(null);
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles(colors).cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles(colors).deleteButton,
                    isDeleting && styles(colors).disabledButton,
                  ]}
                  onPress={() =>
                    searchToDelete && performDeleteSearch(searchToDelete)
                  }
                  disabled={isDeleting}
                >
                  <Text style={styles(colors).deleteButtonText}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        visible={showClearAllConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClearAllConfirmation(false)}
      >
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).confirmationModalContainer}>
            <View style={styles(colors).confirmationModalHeader}>
              <Text style={styles(colors).confirmationModalTitle}>
                Clear All Searches
              </Text>
            </View>

            <View style={styles(colors).confirmationModalContent}>
              <Text style={styles(colors).confirmationText}>
                Are you sure you want to delete all saved searches?
              </Text>
              <Text style={styles(colors).confirmationSubtext}>
                This action cannot be undone.
              </Text>

              <View style={styles(colors).confirmationModalButtons}>
                <TouchableOpacity
                  style={styles(colors).cancelButton}
                  onPress={() => setShowClearAllConfirmation(false)}
                  disabled={isDeleting}
                >
                  <Text style={styles(colors).cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles(colors).deleteButton,
                    isDeleting && styles(colors).disabledButton,
                  ]}
                  onPress={performClearAll}
                  disabled={isDeleting}
                >
                  <Text style={styles(colors).deleteButtonText}>
                    {isDeleting ? "Clearing..." : "Clear All"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).editModalContainer}>
            <View style={styles(colors).editModalHeader}>
              <Text style={styles(colors).editModalTitle}>Edit Search</Text>
              <TouchableOpacity
                style={styles(colors).closeButton}
                onPress={() => setShowEditModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles(colors).editModalContent}>
              <Text style={styles(colors).inputLabel}>Search Name *</Text>
              <TextInput
                style={styles(colors).textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter search name"
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
              />

              <Text style={styles(colors).inputLabel}>
                Description (Optional)
              </Text>
              <TextInput
                style={[
                  styles(colors).textInput,
                  styles(colors).descriptionInput,
                ]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Add a description"
                placeholderTextColor={colors.textSecondary}
                multiline={true}
                numberOfLines={3}
                maxLength={500}
              />

              <View style={styles(colors).editModalButtons}>
                <TouchableOpacity
                  style={styles(colors).cancelButton}
                  onPress={() => setShowEditModal(false)}
                  disabled={isUpdating}
                >
                  <Text style={styles(colors).cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles(colors).saveButton,
                    isUpdating && styles(colors).disabledButton,
                  ]}
                  onPress={handleSaveEdit}
                  disabled={isUpdating || !editName.trim()}
                >
                  <Text style={styles(colors).saveButtonText}>
                    {isUpdating ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontSize: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    clearAllButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.error,
    },
    clearAllText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: "500",
      marginLeft: 4,
    },
    controlsContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      marginLeft: 8,
      marginRight: 8,
    },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    filterButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginHorizontal: 2,
      backgroundColor: colors.surface,
      alignItems: "center",
    },
    activeFilterButton: {
      backgroundColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    activeFilterText: {
      color: "#fff",
      fontWeight: "600",
    },
    errorContainer: {
      padding: 16,
      backgroundColor: colors.error + "20",
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 8,
    },
    errorText: {
      color: colors.error,
      textAlign: "center",
    },
    list: {
      flex: 1,
    },
    searchItem: {
      flexDirection: "row",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: "center",
    },
    searchItemContent: {
      flex: 1,
    },
    searchItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    searchName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    typeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    typeBadgeText: {
      color: "#fff",
      fontSize: 8,
      fontWeight: "bold",
      marginLeft: 2,
    },
    searchPreview: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    searchDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
      marginBottom: 4,
    },
    searchDate: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionButton: {
      padding: 8,
      marginLeft: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    // Edit Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    editModalContainer: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: colors.background,
      borderRadius: 12,
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    editModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.headerBackground,
    },
    editModalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    editModalContent: {
      padding: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      marginTop: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
      marginBottom: 8,
    },
    descriptionInput: {
      height: 80,
      textAlignVertical: "top",
    },
    editModalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginRight: 8,
      alignItems: "center",
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "500",
    },
    saveButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: colors.primary,
      marginLeft: 8,
      alignItems: "center",
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    disabledButton: {
      opacity: 0.6,
    },

    // Confirmation Modal Styles
    confirmationModalContainer: {
      width: "100%",
      maxWidth: 350,
      backgroundColor: colors.background,
      borderRadius: 12,
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    confirmationModalHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.headerBackground,
    },
    confirmationModalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
    },
    confirmationModalContent: {
      padding: 20,
    },
    confirmationText: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    confirmationSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },
    confirmationModalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    deleteButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: colors.error,
      marginLeft: 8,
      alignItems: "center",
    },
    deleteButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    dismissErrorButton: {
      marginTop: 8,
      alignSelf: "center",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: colors.error + "40",
    },
    dismissErrorText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: "500",
    },
  });

export default SavedSearchesView;
