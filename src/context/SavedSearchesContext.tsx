import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MediaItem, Person } from "../types/types";

// Storage key for AsyncStorage
const SAVED_SEARCHES_STORAGE_KEY = "actor-matches:savedSearches";

// Define the structure of a saved search
export interface SavedSearch {
  id: string;
  name: string; // User-defined name for the search
  type: "media" | "person"; // Type of comparison
  dateCreated: string;
  dateModified: string;

  // Media comparison data - array-based only
  mediaItems?: MediaItem[];

  // Person comparison data
  person1?: Person | null;
  person2?: Person | null;

  // Optional metadata
  description?: string;
  tags?: string[];
}

// Define the context interface
interface SavedSearchesContextType {
  // Saved searches array
  savedSearches: SavedSearch[];

  // Loading states
  loading: boolean;
  error: string | null;

  // Core operations
  saveSearch: (
    search: Omit<SavedSearch, "id" | "dateCreated" | "dateModified">
  ) => Promise<string>;
  loadSearch: (searchId: string) => SavedSearch | null;
  deleteSearch: (searchId: string) => Promise<boolean>;
  updateSearch: (
    searchId: string,
    updates: Partial<SavedSearch>
  ) => Promise<boolean>;

  // Utility functions
  clearAllSearches: () => Promise<boolean>;
  exportSearches: () => string;
  importSearches: (jsonData: string) => Promise<boolean>;

  // Search and filter functions
  searchSavedSearches: (query: string) => SavedSearch[];
  getSearchesByType: (type: "media" | "person") => SavedSearch[];
  getRecentSearches: (limit?: number) => SavedSearch[];

  // Quick save current state functions
  saveCurrentMediaComparison: (
    name: string,
    mediaItems: MediaItem[],
    description?: string
  ) => Promise<string>;
  saveCurrentPersonComparison: (
    name: string,
    person1?: Person | null,
    person2?: Person | null,
    description?: string
  ) => Promise<string>;
}

// Create context with default values
const SavedSearchesContext = createContext<SavedSearchesContextType>({
  savedSearches: [],
  loading: false,
  error: null,
  saveSearch: async () => "",
  loadSearch: () => null,
  deleteSearch: async () => false,
  updateSearch: async () => false,
  clearAllSearches: async () => false,
  exportSearches: () => "",
  importSearches: async () => false,
  searchSavedSearches: () => [],
  getSearchesByType: () => [],
  getRecentSearches: () => [],
  saveCurrentMediaComparison: async () => "",
  saveCurrentPersonComparison: async () => "",
});

// Custom hook to use the saved searches context
export const useSavedSearches = () => useContext(SavedSearchesContext);

// Props for the provider component
interface SavedSearchesProviderProps {
  children: ReactNode;
}

// Helper function to generate unique IDs
const generateId = (): string => {
  return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to validate saved search structure - updated
const isValidSavedSearch = (search: any): search is SavedSearch => {
  return (
    search &&
    typeof search === "object" &&
    typeof search.id === "string" &&
    typeof search.name === "string" &&
    (search.type === "media" || search.type === "person") &&
    typeof search.dateCreated === "string" &&
    typeof search.dateModified === "string"
  );
};

// Context provider component
export const SavedSearchesProvider = ({
  children,
}: SavedSearchesProviderProps) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved searches from AsyncStorage on mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  // Load searches from storage - updated to handle migration from legacy format
  const loadSavedSearches = async () => {
    try {
      setLoading(true);
      setError(null);

      const storedSearches = await AsyncStorage.getItem(
        SAVED_SEARCHES_STORAGE_KEY
      );

      if (storedSearches) {
        const parsedSearches = JSON.parse(storedSearches);

        // Validate and migrate the structure
        const validSearches = parsedSearches
          .filter(isValidSavedSearch)
          .map((search: any) => {
            // Migration: convert legacy format to array format
            if (
              search.type === "media" &&
              !search.mediaItems &&
              (search.mediaItem1 || search.mediaItem2)
            ) {
              const migratedMediaItems: MediaItem[] = [];
              if (search.mediaItem1) migratedMediaItems.push(search.mediaItem1);
              if (search.mediaItem2) migratedMediaItems.push(search.mediaItem2);

              // Return migrated search without legacy properties
              return {
                id: search.id,
                name: search.name,
                type: search.type,
                dateCreated: search.dateCreated,
                dateModified: search.dateModified,
                mediaItems: migratedMediaItems,
                description: search.description,
                tags: search.tags,
              } as SavedSearch;
            }

            // For searches that already have mediaItems, ensure legacy properties are removed
            if (search.type === "media") {
              return {
                id: search.id,
                name: search.name,
                type: search.type,
                dateCreated: search.dateCreated,
                dateModified: search.dateModified,
                mediaItems: search.mediaItems || [],
                description: search.description,
                tags: search.tags,
              } as SavedSearch;
            }

            return search;
          });

        // Sort by date modified (most recent first)
        validSearches.sort(
          (a: SavedSearch, b: SavedSearch) =>
            new Date(b.dateModified).getTime() -
            new Date(a.dateModified).getTime()
        );

        setSavedSearches(validSearches);

        // Always save back to ensure legacy properties are cleaned up
        await saveSavedSearches(validSearches);
      }
    } catch (err) {
      console.error("Error loading saved searches:", err);
      setError("Failed to load saved searches");
    } finally {
      setLoading(false);
    }
  };

  // Save searches to storage
  const saveSavedSearches = async (
    searches: SavedSearch[]
  ): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(
        SAVED_SEARCHES_STORAGE_KEY,
        JSON.stringify(searches)
      );
      return true;
    } catch (err) {
      console.error("Error saving searches:", err);
      setError("Failed to save searches");
      return false;
    }
  };

  // Save a new search
  const saveSearch = async (
    searchData: Omit<SavedSearch, "id" | "dateCreated" | "dateModified">
  ): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const newSearch: SavedSearch = {
        ...searchData,
        id: generateId(),
        dateCreated: now,
        dateModified: now,
      };

      const updatedSearches = [newSearch, ...savedSearches];

      if (await saveSavedSearches(updatedSearches)) {
        setSavedSearches(updatedSearches);
        setError(null);
        return newSearch.id;
      } else {
        throw new Error("Failed to save search");
      }
    } catch (err) {
      console.error("Error saving search:", err);
      setError("Failed to save search");
      throw err;
    }
  };

  // Load a specific search by ID
  const loadSearch = (searchId: string): SavedSearch | null => {
    return savedSearches.find((search) => search.id === searchId) || null;
  };

  // Delete a search
  const deleteSearch = async (searchId: string): Promise<boolean> => {
    try {
      const updatedSearches = savedSearches.filter(
        (search) => search.id !== searchId
      );

      if (await saveSavedSearches(updatedSearches)) {
        setSavedSearches(updatedSearches);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting search:", err);
      setError("Failed to delete search");
      return false;
    }
  };

  // Update an existing search
  const updateSearch = async (
    searchId: string,
    updates: Partial<SavedSearch>
  ): Promise<boolean> => {
    try {
      const updatedSearches = savedSearches.map((search) => {
        if (search.id === searchId) {
          return {
            ...search,
            ...updates,
            dateModified: new Date().toISOString(),
          };
        }
        return search;
      });

      if (await saveSavedSearches(updatedSearches)) {
        setSavedSearches(updatedSearches);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error updating search:", err);
      setError("Failed to update search");
      return false;
    }
  };

  // Clear all searches
  const clearAllSearches = async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(SAVED_SEARCHES_STORAGE_KEY);
      setSavedSearches([]);
      setError(null);
      return true;
    } catch (err) {
      console.error("Error clearing searches:", err);
      setError("Failed to clear searches");
      return false;
    }
  };

  // Export searches as JSON string
  const exportSearches = (): string => {
    return JSON.stringify(savedSearches, null, 2);
  };

  // Import searches from JSON string
  const importSearches = async (jsonData: string): Promise<boolean> => {
    try {
      const importedSearches = JSON.parse(jsonData);

      if (!Array.isArray(importedSearches)) {
        throw new Error("Invalid data format");
      }

      // Validate imported searches
      const validSearches = importedSearches.filter(isValidSavedSearch);

      if (validSearches.length === 0) {
        throw new Error("No valid searches found in imported data");
      }

      // Merge with existing searches, avoiding duplicates
      const existingIds = new Set(savedSearches.map((search) => search.id));
      const newSearches = validSearches.filter(
        (search: SavedSearch) => !existingIds.has(search.id)
      );

      const mergedSearches = [...savedSearches, ...newSearches];
      mergedSearches.sort(
        (a: SavedSearch, b: SavedSearch) =>
          new Date(b.dateModified).getTime() -
          new Date(a.dateModified).getTime()
      );

      if (await saveSavedSearches(mergedSearches)) {
        setSavedSearches(mergedSearches);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error importing searches:", err);
      setError("Failed to import searches");
      return false;
    }
  };

  // Search saved searches by name or description
  const searchSavedSearches = (query: string): SavedSearch[] => {
    if (!query.trim()) return savedSearches;

    const lowercaseQuery = query.toLowerCase();
    return savedSearches.filter(
      (search) =>
        search.name.toLowerCase().includes(lowercaseQuery) ||
        search.description?.toLowerCase().includes(lowercaseQuery) ||
        search.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Get searches by type
  const getSearchesByType = (type: "media" | "person"): SavedSearch[] => {
    return savedSearches.filter((search) => search.type === type);
  };

  // Get recent searches
  const getRecentSearches = (limit: number = 10): SavedSearch[] => {
    return savedSearches.slice(0, limit);
  };

  // Quick save current media comparison - simplified to only use array
  const saveCurrentMediaComparison = async (
    name: string,
    mediaItems: MediaItem[],
    description?: string
  ): Promise<string> => {
    return await saveSearch({
      name,
      type: "media",
      mediaItems: mediaItems,
      description,
    });
  };

  // Quick save current person comparison
  const saveCurrentPersonComparison = async (
    name: string,
    person1?: Person | null,
    person2?: Person | null,
    description?: string
  ): Promise<string> => {
    return await saveSearch({
      name,
      type: "person",
      person1: person1,
      person2: person2,
      description,
    });
  };

  // Value object for context provider
  const value: SavedSearchesContextType = {
    savedSearches,
    loading,
    error,
    saveSearch,
    loadSearch,
    deleteSearch,
    updateSearch,
    clearAllSearches,
    exportSearches,
    importSearches,
    searchSavedSearches,
    getSearchesByType,
    getRecentSearches,
    saveCurrentMediaComparison,
    saveCurrentPersonComparison,
  };

  return (
    <SavedSearchesContext.Provider value={value}>
      {children}
    </SavedSearchesContext.Provider>
  );
};

export default SavedSearchesContext;
