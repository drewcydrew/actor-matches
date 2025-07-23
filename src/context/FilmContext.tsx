import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Film,
  TVShow,
  MediaItem,
  Person,
  EnhancedMediaItem,
} from "../types/types";
import tmdbApi from "../api/tmdbApi";

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  SELECTED_MEDIA_ITEMS: "actor-matches:selectedMediaItems",
  SELECTED_CAST_MEMBERS: "actor-matches:selectedCastMembers", // Add this new key
  MEDIA_ITEM_1: "actor-matches:selectedMediaItem1", // Keep for migration only
  MEDIA_ITEM_2: "actor-matches:selectedMediaItem2", // Keep for migration only
  CAST_MEMBER_1: "actor-matches:selectedCastMember1", // Keep for migration only
  CAST_MEMBER_2: "actor-matches:selectedCastMember2", // Keep for migration only
};

// Convert external types to our unified MediaItem
export const convertToMediaItem = (
  item: Film | TVShow,
  type: "movie" | "tv"
): MediaItem => {
  if (type === "movie") {
    const film = item as Film;
    return {
      id: film.id,
      name: film.title, // Use title for movies
      title: film.title,
      release_date: film.release_date,
      character: film.character,
      popularity: film.popularity,
      overview: film.overview,
      poster_path: film.poster_path,
      vote_average: film.vote_average,
      media_type: "movie",
    };
  } else {
    const tvShow = item as TVShow;
    return {
      id: tvShow.id,
      name: tvShow.name,
      title: tvShow.name, // Set title to name for consistency in rendering
      first_air_date: tvShow.first_air_date,
      episode_count: tvShow.episode_count,
      character: tvShow.character,
      popularity: tvShow.popularity,
      overview: tvShow.overview,
      poster_path: tvShow.poster_path,
      vote_average: tvShow.vote_average,
      media_type: "tv",
    } as MediaItem; // Type assertion since MediaItem is a union type
  }
};

// Remove default values - we'll start with empty arrays
// const DEFAULT_MEDIA_1: MediaItem = { ... };
// const DEFAULT_MEDIA_2: MediaItem = { ... };
// const DEFAULT_ACTOR_1: Person = { ... };
// const DEFAULT_ACTOR_2: Person = { ... };

// Define interfaces

// Define the shape of our context state
interface FilmContextType {
  // Array-based media selection (primary)
  selectedMediaItems: MediaItem[];
  addMediaItem: (media: MediaItem) => void;
  removeMediaItem: (mediaId: number) => void;
  clearMediaItems: () => void;
  reorderMediaItems: (fromIndex: number, toIndex: number) => void;
  updateMediaItem: (index: number, media: MediaItem) => void;
  getMediaItemAtIndex: (index: number) => MediaItem | null;

  // Array-based cast member selection (only approach now)
  selectedCastMembers: Person[];
  addCastMember: (person: Person) => void;
  removeCastMember: (personId: number) => void;
  clearCastMembers: () => void;
  reorderCastMembers: (fromIndex: number, toIndex: number) => void;
  updateCastMember: (index: number, person: Person) => void;
  getCastMemberAtIndex: (index: number) => Person | null;

  // Cast data
  castMembers: [Person, Person][];
  castLoading: boolean;
  castError: string;
  displayMode: "single" | "comparison";

  // Filmography data for actors
  commonMedia: [EnhancedMediaItem, EnhancedMediaItem][];
  mediaLoading: boolean;
  mediaError: string;

  // Method to manually refresh cast data if needed
  refreshCastData: () => Promise<void>;

  // Method to get filmography for actors
  getActorFilmography: (
    actor1Id?: number,
    actor2Id?: number,
    actor1Name?: string,
    actor2Name?: string
  ) => Promise<void>;

  // API methods
  searchPeople: (query: string) => Promise<{
    results: Person[];
    error: string | null;
  }>;
  getMediaItems: (query: string) => Promise<{
    results: MediaItem[];
    error: string | null;
  }>;
  getCredits: (actorId: number) => Promise<{
    results: MediaItem[];
    error: string | null;
  }>;
  getCast: (
    mediaId: number,
    mediaType: "movie" | "tv"
  ) => Promise<{
    results: Person[];
    error: string | null;
  }>;
}

// Create the context with default values
const FilmContext = createContext<FilmContextType>({
  selectedMediaItems: [],
  addMediaItem: () => {},
  removeMediaItem: () => {},
  clearMediaItems: () => {},
  reorderMediaItems: () => {},
  updateMediaItem: () => {},
  getMediaItemAtIndex: () => null,
  selectedCastMembers: [],
  addCastMember: () => {},
  removeCastMember: () => {},
  clearCastMembers: () => {},
  reorderCastMembers: () => {},
  updateCastMember: () => {},
  getCastMemberAtIndex: () => null,
  castMembers: [],
  castLoading: false,
  castError: "",
  displayMode: "comparison",
  commonMedia: [],
  mediaLoading: false,
  mediaError: "",
  refreshCastData: async () => {},
  getActorFilmography: async () => {},
  searchPeople: async () => ({ results: [], error: null }),
  getMediaItems: async () => ({ results: [], error: null }),
  getCredits: async () => ({ results: [], error: null }),
  getCast: async () => ({ results: [], error: null }),
});

// Custom hook to use the film context
export const useFilmContext = () => useContext(FilmContext);

// Props for the provider component
interface FilmProviderProps {
  children: ReactNode;
}

// Context provider component
export const FilmProvider = ({ children }: FilmProviderProps) => {
  // Array-based media selection state (primary)
  const [selectedMediaItems, setSelectedMediaItems] = useState<MediaItem[]>([]);

  // Actor selection state - initialize with null and load from storage
  const [selectedCastMembers, setSelectedCastMembersInternal] = useState<
    Person[]
  >([]);

  // Loading state for initial data
  const [isLoading, setIsLoading] = useState(true);

  // Cast data state
  const [castMembers, setCastMembers] = useState<[Person, Person][]>([]);
  const [castLoading, setCastLoading] = useState<boolean>(false);
  const [castError, setCastError] = useState<string>("");
  const [displayMode, setDisplayMode] = useState<"single" | "comparison">(
    "comparison"
  );

  // Media data state for actors
  const [commonMedia, setCommonMedia] = useState<
    [EnhancedMediaItem, EnhancedMediaItem][]
  >([]);
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string>("");

  // Load data from AsyncStorage on initial mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Load media items array first (primary method)
        const storedMediaItemsString = await AsyncStorage.getItem(
          STORAGE_KEYS.SELECTED_MEDIA_ITEMS
        );

        // Load legacy individual items for migration only
        const storedMediaItem1String = await AsyncStorage.getItem(
          STORAGE_KEYS.MEDIA_ITEM_1
        );
        const storedMediaItem2String = await AsyncStorage.getItem(
          STORAGE_KEYS.MEDIA_ITEM_2
        );

        // Load cast members array first (primary method)
        const storedCastMembersString = await AsyncStorage.getItem(
          STORAGE_KEYS.SELECTED_CAST_MEMBERS
        );

        // Load legacy individual cast members for migration only
        const storedCastMember1String = await AsyncStorage.getItem(
          STORAGE_KEYS.CAST_MEMBER_1
        );
        const storedCastMember2String = await AsyncStorage.getItem(
          STORAGE_KEYS.CAST_MEMBER_2
        );

        let mediaItemsArray: MediaItem[] = [];

        if (storedMediaItemsString) {
          // Primary method: Load from array storage
          try {
            mediaItemsArray = JSON.parse(storedMediaItemsString);
          } catch (parseError) {
            console.error(
              "Error parsing stored media items array:",
              parseError
            );
            mediaItemsArray = [];
          }
        } else if (storedMediaItem1String || storedMediaItem2String) {
          // Migration: Load from legacy individual storage and convert to array
          const legacyMedia1 = storedMediaItem1String
            ? JSON.parse(storedMediaItem1String)
            : null;
          const legacyMedia2 = storedMediaItem2String
            ? JSON.parse(storedMediaItem2String)
            : null;

          if (legacyMedia1) mediaItemsArray.push(legacyMedia1);
          if (legacyMedia2) mediaItemsArray.push(legacyMedia2);

          // Save the migrated array and clean up legacy storage
          if (mediaItemsArray.length > 0) {
            await AsyncStorage.setItem(
              STORAGE_KEYS.SELECTED_MEDIA_ITEMS,
              JSON.stringify(mediaItemsArray)
            );
            // Clean up legacy storage
            await AsyncStorage.removeItem(STORAGE_KEYS.MEDIA_ITEM_1);
            await AsyncStorage.removeItem(STORAGE_KEYS.MEDIA_ITEM_2);
          }
        }

        // Set the media items array (will be empty if no stored data)
        setSelectedMediaItems(mediaItemsArray);

        // Handle cast members array loading
        let castMembersArray: Person[] = [];

        if (storedCastMembersString) {
          // Primary method: Load from array storage
          try {
            const parsedCastMembers = JSON.parse(storedCastMembersString);
            // Ensure it's an array and validate each item
            if (Array.isArray(parsedCastMembers)) {
              castMembersArray = parsedCastMembers.filter(
                (member) =>
                  member &&
                  typeof member === "object" &&
                  typeof member.id === "number" &&
                  typeof member.name === "string"
              );
            }
          } catch (parseError) {
            console.error(
              "Error parsing stored cast members array:",
              parseError
            );
            castMembersArray = [];
          }
        } else if (storedCastMember1String || storedCastMember2String) {
          // Migration: Load from legacy individual storage and convert to array
          try {
            const legacyCast1 = storedCastMember1String
              ? JSON.parse(storedCastMember1String)
              : null;
            const legacyCast2 = storedCastMember2String
              ? JSON.parse(storedCastMember2String)
              : null;

            if (legacyCast1 && legacyCast1.id && legacyCast1.name) {
              // Ensure roles array exists for legacy data
              legacyCast1.roles = legacyCast1.roles || ["cast"];
              castMembersArray.push(legacyCast1);
            }
            if (legacyCast2 && legacyCast2.id && legacyCast2.name) {
              // Ensure roles array exists for legacy data
              legacyCast2.roles = legacyCast2.roles || ["cast"];
              castMembersArray.push(legacyCast2);
            }

            // Save the migrated array and clean up legacy storage
            if (castMembersArray.length > 0) {
              await AsyncStorage.setItem(
                STORAGE_KEYS.SELECTED_CAST_MEMBERS,
                JSON.stringify(castMembersArray)
              );
              // Clean up legacy storage
              await AsyncStorage.removeItem(STORAGE_KEYS.CAST_MEMBER_1);
              await AsyncStorage.removeItem(STORAGE_KEYS.CAST_MEMBER_2);
            }
          } catch (parseError) {
            console.error("Error parsing legacy cast members:", parseError);
            castMembersArray = [];
          }
        }

        // Set the cast members array (will be empty if no stored data)
        setSelectedCastMembersInternal(castMembersArray);
      } catch (error) {
        console.error("Error loading stored selections:", error);
        // Fall back to empty arrays in case of error
        setSelectedMediaItems([]);
        setSelectedCastMembersInternal([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  // Helper function to save media items to storage
  const saveMediaItemsToStorage = async (mediaItems: MediaItem[]) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_MEDIA_ITEMS,
        JSON.stringify(mediaItems)
      );
    } catch (error) {
      console.error("Error storing selectedMediaItems:", error);
    }
  };

  // Helper function to save cast members to storage - Updated to use array storage
  const saveCastMembersToStorage = async (castMembers: Person[]) => {
    try {
      // Validate the data before saving
      const validCastMembers = castMembers.filter(
        (member) =>
          member &&
          typeof member === "object" &&
          typeof member.id === "number" &&
          typeof member.name === "string"
      );

      // Primary method: Save the full array
      await AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_CAST_MEMBERS,
        JSON.stringify(validCastMembers)
      );

      // For backward compatibility during migration, also store the first two cast members individually
      if (validCastMembers.length > 0) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CAST_MEMBER_1,
          JSON.stringify(validCastMembers[0])
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CAST_MEMBER_1);
      }

      if (validCastMembers.length > 1) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CAST_MEMBER_2,
          JSON.stringify(validCastMembers[1])
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CAST_MEMBER_2);
      }
    } catch (error) {
      console.error("Error storing selectedCastMembers:", error);
    }
  };

  // Set selected cast members
  const setSelectedCastMembers = async (actors: Person[]) => {
    setSelectedCastMembersInternal(actors);
    await saveCastMembersToStorage(actors);
  };

  // Updated getCast function with proper type handling
  const getCast = async (
    mediaId: number,
    mediaType: "movie" | "tv"
  ): Promise<{
    results: Person[];
    error: string | null;
  }> => {
    if (!mediaId) {
      return { results: [], error: "Invalid media ID" };
    }

    try {
      // Map to aggregate all roles for each person
      const personMap = new Map<
        number,
        {
          id: number;
          name: string;
          profile_path?: string;
          gender?: number;
          popularity?: number;
          roles: ("cast" | "crew")[];
          character?: string;
          jobs: string[];
          departments: Set<string>;
          known_for_department?: string;
        }
      >();

      // Handle movie and TV show credits separately to address type issues
      if (mediaType === "movie") {
        // For movies, use getMovieCast
        const movieCastData = await tmdbApi.getMovieCast(mediaId);

        // Process movie cast members
        if (movieCastData.cast && movieCastData.cast.length > 0) {
          movieCastData.cast.forEach((member) => {
            if (!personMap.has(member.id)) {
              personMap.set(member.id, {
                id: member.id,
                name: member.name,
                profile_path: member.profile_path,
                gender: member.gender,
                popularity: member.popularity || 0,
                roles: [],
                jobs: [],
                departments: new Set(),
              });
            }

            const person = personMap.get(member.id)!;
            if (!person.roles.includes("cast")) {
              person.roles.push("cast");
            }
            person.character = member.character || "Unknown role";
          });
        }

        // Process movie crew members
        if (movieCastData.crew && movieCastData.crew.length > 0) {
          movieCastData.crew.forEach((member) => {
            if (!personMap.has(member.id)) {
              personMap.set(member.id, {
                id: member.id,
                name: member.name,
                profile_path: member.profile_path,
                gender: member.gender,
                popularity: member.popularity || 0,
                roles: [],
                jobs: [],
                departments: new Set(),
              });
            }

            const person = personMap.get(member.id)!;
            if (!person.roles.includes("crew")) {
              person.roles.push("crew");
            }
            person.jobs.push(member.job || "Unknown job");
            person.departments.add(member.department || "Other");
          });
        }
      } else {
        // For TV shows, get both aggregate credits (cast) and regular credits (crew)
        const [tvAggregateData, tvRegularData] = await Promise.all([
          tmdbApi.getTVShowAggregateCredits(mediaId),
          tmdbApi.getTVShowCast(mediaId),
        ]);

        // Process TV cast members from aggregate credits
        if (tvAggregateData.cast && tvAggregateData.cast.length > 0) {
          tvAggregateData.cast.forEach((member) => {
            const tvMember = member as {
              id: number;
              name: string;
              roles?: { character: string; episode_count: number }[];
              total_episode_count?: number;
              profile_path?: string;
              popularity?: number;
              gender?: number;
              order?: number;
            };

            if (!personMap.has(tvMember.id)) {
              personMap.set(tvMember.id, {
                id: tvMember.id,
                name: tvMember.name,
                profile_path: tvMember.profile_path,
                gender: tvMember.gender,
                popularity: tvMember.popularity || 0,
                roles: [],
                jobs: [],
                departments: new Set(),
              });
            }

            const person = personMap.get(tvMember.id)!;
            if (!person.roles.includes("cast")) {
              person.roles.push("cast");
            }

            // Extract character from roles array or set default
            const character =
              tvMember.roles && tvMember.roles.length > 0
                ? tvMember.roles
                    .map((role: { character: string }) => role.character)
                    .join(", ")
                : "Unknown role";
            person.character = character;
          });
        }

        // Process TV crew members from regular credits
        if (tvRegularData.crew && tvRegularData.crew.length > 0) {
          tvRegularData.crew.forEach((member) => {
            if (!personMap.has(member.id)) {
              personMap.set(member.id, {
                id: member.id,
                name: member.name,
                profile_path: member.profile_path,
                gender: member.gender,
                popularity: member.popularity || 0,
                roles: [],
                jobs: [],
                departments: new Set(),
              });
            }

            const person = personMap.get(member.id)!;
            if (!person.roles.includes("crew")) {
              person.roles.push("crew");
            }
            person.jobs.push(member.job || "Unknown job");
            person.departments.add(member.department || "Other");
          });
        }
      }

      // Convert aggregated data to Person objects
      const combinedResults: Person[] = Array.from(personMap.values()).map(
        (personData) => ({
          id: personData.id,
          name: personData.name,
          profile_path: personData.profile_path,
          gender: personData.gender,
          popularity: personData.popularity,
          roles: personData.roles,
          character: personData.character,
          jobs: personData.jobs.length > 0 ? personData.jobs : undefined,
          departments:
            personData.departments.size > 0
              ? Array.from(personData.departments)
              : undefined,
        })
      );

      // Sort by popularity
      combinedResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      if (combinedResults.length === 0) {
        return {
          results: [],
          error: `No cast or crew found for this ${
            mediaType === "movie" ? "movie" : "TV show"
          }`,
        };
      }

      return {
        results: combinedResults,
        error: null,
      };
    } catch (err) {
      console.error(`Error fetching ${mediaType} cast:`, err);
      return {
        results: [],
        error: `Failed to load cast for this ${
          mediaType === "movie" ? "movie" : "TV show"
        }`,
      };
    }
  };

  // Fetch cast data whenever selected media changes - only after loading complete
  useEffect(() => {
    if (!isLoading) {
      fetchCastData();
    }
  }, [selectedMediaItems.length, isLoading]); // Only depend on length, not the entire array

  // Fetch actor filmography whenever selected actors change - only after loading complete
  useEffect(() => {
    if (!isLoading && selectedCastMembers.length > 0) {
      const [actor1, actor2] = selectedCastMembers;
      getActorFilmography(actor1?.id, actor2?.id, actor1?.name, actor2?.name);
    }
  }, [selectedCastMembers, isLoading]); // Only depend on IDs

  const getCredits = async (
    actorId: number
  ): Promise<{
    results: MediaItem[];
    error: string | null;
  }> => {
    if (!actorId) {
      return { results: [], error: "Invalid actor ID" };
    }

    try {
      // Fetch both movie and TV credits concurrently
      const [movieCreditsResponse, tvCreditsResponse] = await Promise.all([
        tmdbApi.getActorMovieCredits(actorId),
        tmdbApi.getActorTVCredits(actorId),
      ]);

      // Map to aggregate all roles for each media item
      const mediaMap = new Map<
        string,
        {
          mediaItem: MediaItem;
          roles: ("cast" | "crew")[];
          characters: string[];
          jobs: string[];
          departments: Set<string>;
        }
      >();

      // Process movie cast credits
      if (movieCreditsResponse.cast && movieCreditsResponse.cast.length > 0) {
        movieCreditsResponse.cast
          .filter((item) => item.release_date)
          .forEach((item) => {
            const key = `${item.id}-movie`;

            if (!mediaMap.has(key)) {
              mediaMap.set(key, {
                mediaItem: convertToMediaItem(item, "movie"),
                roles: [],
                characters: [],
                jobs: [],
                departments: new Set(),
              });
            }

            const mediaData = mediaMap.get(key)!;
            if (!mediaData.roles.includes("cast")) {
              mediaData.roles.push("cast");
            }
            if (
              item.character &&
              !mediaData.characters.includes(item.character)
            ) {
              mediaData.characters.push(item.character);
            }
          });
      }

      // Process movie crew credits
      if (movieCreditsResponse.crew && movieCreditsResponse.crew.length > 0) {
        movieCreditsResponse.crew
          .filter((item) => item.release_date)
          .forEach((item) => {
            const key = `${item.id}-movie`;

            if (!mediaMap.has(key)) {
              mediaMap.set(key, {
                mediaItem: convertToMediaItem(item, "movie"),
                roles: [],
                characters: [],
                jobs: [],
                departments: new Set(),
              });
            }

            const mediaData = mediaMap.get(key)!;
            if (!mediaData.roles.includes("crew")) {
              mediaData.roles.push("crew");
            }
            if (item.job && !mediaData.jobs.includes(item.job)) {
              mediaData.jobs.push(item.job);
            }
            if (item.department) {
              mediaData.departments.add(item.department);
            }
          });
      }

      // Process TV cast credits
      if (tvCreditsResponse.cast && tvCreditsResponse.cast.length > 0) {
        tvCreditsResponse.cast
          .filter((item: any) => item.first_air_date)
          .forEach((item: any) => {
            const key = `${item.id}-tv`;

            if (!mediaMap.has(key)) {
              mediaMap.set(key, {
                mediaItem: convertToMediaItem(item, "tv"),
                roles: [],
                characters: [],
                jobs: [],
                departments: new Set(),
              });
            }

            const mediaData = mediaMap.get(key)!;
            if (!mediaData.roles.includes("cast")) {
              mediaData.roles.push("cast");
            }
            if (
              item.character &&
              !mediaData.characters.includes(item.character)
            ) {
              mediaData.characters.push(item.character);
            }
          });
      }

      // Process TV crew credits
      if (tvCreditsResponse.crew && tvCreditsResponse.crew.length > 0) {
        tvCreditsResponse.crew
          .filter((item: any) => item.first_air_date)
          .forEach((item: any) => {
            const key = `${item.id}-tv`;

            if (!mediaMap.has(key)) {
              mediaMap.set(key, {
                mediaItem: convertToMediaItem(
                  {
                    ...item,
                    name: item.name || item.title || "Unknown",
                    media_type: "tv",
                  },
                  "tv"
                ),
                roles: [],
                characters: [],
                jobs: [],
                departments: new Set(),
              });
            }

            const mediaData = mediaMap.get(key)!;
            if (!mediaData.roles.includes("crew")) {
              mediaData.roles.push("crew");
            }
            if (item.job && !mediaData.jobs.includes(item.job)) {
              mediaData.jobs.push(item.job);
            }
            if (item.department) {
              mediaData.departments.add(item.department);
            }
          });
      }

      // Convert aggregated data to MediaItem objects
      const combinedResults: MediaItem[] = Array.from(mediaMap.values()).map(
        ({ mediaItem, roles, characters, jobs, departments }) =>
          ({
            ...mediaItem,
            // Combine character information
            character:
              characters.length > 0 ? characters.join(", ") : undefined,
            // Add job information for crew roles
            job: jobs.length > 0 ? jobs.join(", ") : undefined,
            department:
              departments.size > 0
                ? Array.from(departments).join(", ")
                : undefined,
            // Set role_type based on aggregated roles
            role_type:
              roles.includes("cast") && roles.includes("crew")
                ? "cast" // Prioritize cast when both exist
                : roles.includes("crew")
                ? "crew"
                : "cast",
            // Add roles array for consistent badge logic
            roles: roles,
          } as MediaItem & { roles: ("cast" | "crew")[] })
      );

      // Sort all results by popularity (descending)
      const sortedResults = combinedResults.sort(
        (a, b) => b.popularity - a.popularity
      );

      if (sortedResults.length === 0) {
        return { results: [], error: "No credits found for this actor" };
      }

      return {
        results: sortedResults,
        error: null,
      };
    } catch (err) {
      console.error("Error fetching actor credits:", err);
      return {
        results: [],
        error: "Failed to load actor credits",
      };
    }
  };

  const getMediaItems = async (
    query: string
  ): Promise<{
    results: MediaItem[];
    error: string | null;
  }> => {
    if (!query.trim()) {
      return { results: [], error: "Please enter a title to search" };
    }

    try {
      // Search for both movies and TV shows concurrently
      const [moviesResponse, tvShowsResponse] = await Promise.all([
        searchFilms(query),
        searchTVShows(query),
      ]);

      // Convert movies to MediaItem format
      const movieItems = moviesResponse.results.map((film) =>
        convertToMediaItem(film, "movie")
      );

      // Convert TV shows to MediaItem format
      const tvItems = tvShowsResponse.results.map((show) =>
        convertToMediaItem(show, "tv")
      );

      // Combine and sort results by popularity
      const combinedResults = [...movieItems, ...tvItems].sort(
        (a, b) => b.popularity - a.popularity
      );

      if (combinedResults.length === 0) {
        return { results: [], error: "No movies or TV shows found" };
      }

      return {
        results: combinedResults,
        error: null,
      };
    } catch (err) {
      console.error("Error searching for media:", err);
      return {
        results: [],
        error: "An error occurred while searching for movies and TV shows",
      };
    }
  };

  // Function to fetch cast data based on selected media
  const fetchCastData = async () => {
    // Reset state
    setCastMembers([]);
    setCastError("");

    // Case 1: No media selected
    if (selectedMediaItems.length === 0) {
      setDisplayMode("comparison");
      return;
    }

    // Case 2: Only one media item selected
    if (selectedMediaItems.length === 1) {
      setDisplayMode("single");
      const activeMedia = selectedMediaItems[0];

      setCastLoading(true);

      try {
        // Get cast data using our getCast function
        const { results: castResults, error: castError } = await getCast(
          activeMedia.id,
          activeMedia.media_type
        );

        if (castError) {
          setCastError(castError);
          return;
        }

        if (castResults.length > 0) {
          // For single media, create pairs where both entries are the same person
          const personPairs: [Person, Person][] = castResults.map((person) => [
            person,
            { ...person }, // Create a copy for the second position
          ]);

          setCastMembers(personPairs);
        } else {
          setCastError(
            `No cast information available for this ${
              activeMedia.media_type === "tv" ? "TV show" : "film"
            }`
          );
        }
      } catch (err) {
        setCastError("Error fetching cast information");
        console.error(err);
      } finally {
        setCastLoading(false);
      }
      return;
    }

    // Case 3: Multiple media items selected - find common cast across ALL items
    setDisplayMode("comparison");
    setCastLoading(true);

    try {
      // Get cast for all media items
      const castResponses = await Promise.all(
        selectedMediaItems.map((media) => getCast(media.id, media.media_type))
      );

      // Check for errors
      const errorResponse = castResponses.find((response) => response.error);
      if (errorResponse) {
        setCastError(`Error fetching cast: ${errorResponse.error}`);
        return;
      }

      const allCastArrays = castResponses.map((response) => response.results);

      // Check if any cast arrays are empty
      if (allCastArrays.some((cast) => cast.length === 0)) {
        setCastError("Cast information not available for one or more titles");
        return;
      }

      // Find people who appear in ALL media items
      const firstCast = allCastArrays[0];
      const commonPeople: [Person, Person][] = [];

      firstCast.forEach((person1) => {
        // Check if this person appears in ALL other media items
        const appearsInAll = allCastArrays
          .slice(1)
          .every((otherCast) =>
            otherCast.some((otherPerson) => otherPerson.id === person1.id)
          );

        if (appearsInAll) {
          // Create an enhanced person object that contains info from all media items
          const enhancedPerson1 = { ...person1 };
          const enhancedPerson2 = { ...person1 }; // Start with person1 as base

          // Collect all character and job information across all media items
          const allCharacters: string[] = [];
          const allJobs: string[] = [];
          const allDepartments: Set<string> = new Set();

          // Go through each media item and collect this person's info
          allCastArrays.forEach((castArray, mediaIndex) => {
            const personInThisMedia = castArray.find(
              (p) => p.id === person1.id
            );
            if (personInThisMedia) {
              if (personInThisMedia.character) {
                allCharacters.push(
                  `${selectedMediaItems[mediaIndex].name}: ${personInThisMedia.character}`
                );
              }
              if (personInThisMedia.jobs && personInThisMedia.jobs.length > 0) {
                personInThisMedia.jobs.forEach((job) => {
                  allJobs.push(
                    `${selectedMediaItems[mediaIndex].name}: ${job}`
                  );
                });
              }
              if (personInThisMedia.departments) {
                personInThisMedia.departments.forEach((dept) =>
                  allDepartments.add(dept)
                );
              }
            }
          });

          // Store all the detailed information in the enhanced person objects
          enhancedPerson1.allMediaCharacters = allCharacters;
          enhancedPerson1.allMediaJobs = allJobs;
          enhancedPerson1.allMediaDepartments = Array.from(allDepartments);

          enhancedPerson2.allMediaCharacters = allCharacters;
          enhancedPerson2.allMediaJobs = allJobs;
          enhancedPerson2.allMediaDepartments = Array.from(allDepartments);

          commonPeople.push([enhancedPerson1, enhancedPerson2]);
        }
      });

      if (commonPeople.length > 0) {
        // Sort by popularity of the first person in each pair
        setCastMembers(
          commonPeople.sort(
            (a, b) => (b[0].popularity || 0) - (a[0].popularity || 0)
          )
        );
      } else {
        setCastError(
          selectedMediaItems.length === 2
            ? "No common cast or crew members found"
            : `No cast or crew members found across all ${selectedMediaItems.length} titles`
        );
      }
    } catch (err) {
      setCastError("Error fetching cast information");
      console.error(err);
    } finally {
      setCastLoading(false);
    }
  };

  // Function to get actor filmography (both movies and TV shows)
  const getActorFilmography = async (
    actor1Id?: number,
    actor2Id?: number,
    actor1Name: string = "First actor",
    actor2Name: string = "Second actor"
  ) => {
    // Reset state
    setCommonMedia([]);
    setMediaError("");

    // Case 1: No actors selected
    if (!actor1Id && !actor2Id) {
      return;
    }

    // Case 2: Only one actor selected - show their media
    if ((actor1Id && !actor2Id) || (!actor1Id && actor2Id)) {
      const selectedActorId = actor1Id || actor2Id;
      const selectedActorName = actor1Id ? actor1Name : actor2Name;

      if (!selectedActorId) return; // TypeScript safety

      setMediaLoading(true);

      try {
        // Get both movie and TV credits using our getCredits function
        const { results: creditResults, error: creditError } = await getCredits(
          selectedActorId
        );

        if (creditError) {
          setMediaError(creditError);
          return;
        }

        if (creditResults.length > 0) {
          // For single actor case, create pairs of the same MediaItem
          const mediaPairs: [EnhancedMediaItem, EnhancedMediaItem][] =
            creditResults.map((mediaItem) => [
              mediaItem as EnhancedMediaItem,
              { ...mediaItem } as EnhancedMediaItem, // Create a copy for the second position
            ]);

          // Sort by popularity
          mediaPairs.sort((a, b) => b[0].popularity - a[0].popularity);

          setCommonMedia(mediaPairs);
        } else {
          setMediaError(`No media found for ${selectedActorName}`);
        }
      } catch (err) {
        setMediaError("Error fetching person's filmography");
        console.error(err);
      } finally {
        setMediaLoading(false);
      }
      return;
    }

    // Case 3: Multiple actors selected - find common media with individual role data
    if (selectedCastMembers.length >= 2) {
      setMediaLoading(true);

      try {
        // Get credits for all selected cast members
        const creditsResponses = await Promise.all(
          selectedCastMembers.map((castMember) => getCredits(castMember.id))
        );

        // Check for errors
        const errorResponse = creditsResponses.find(
          (response) => response.error
        );
        if (errorResponse) {
          setMediaError(`Error fetching credits: ${errorResponse.error}`);
          return;
        }

        const allCreditsArrays = creditsResponses.map(
          (response) => response.results
        );

        // Check if any credits arrays are empty
        if (allCreditsArrays.some((credits) => credits.length === 0)) {
          setMediaError("Credits not available for one or more people");
          return;
        }

        // Find media items that appear in ALL cast members' credits
        const firstPersonCredits = allCreditsArrays[0];
        const commonMediaPairs: [EnhancedMediaItem, EnhancedMediaItem][] = [];

        firstPersonCredits.forEach((mediaItem1) => {
          // Check if this media item appears in ALL other cast members' credits
          const appearsInAll = allCreditsArrays
            .slice(1)
            .every((otherCredits) =>
              otherCredits.some(
                (otherMedia) =>
                  otherMedia.id === mediaItem1.id &&
                  otherMedia.media_type === mediaItem1.media_type
              )
            );

          if (appearsInAll) {
            // Create enhanced media items with role information for each person
            const enhancedMedia1: EnhancedMediaItem = { ...mediaItem1 };
            const enhancedMedia2: EnhancedMediaItem = { ...mediaItem1 };

            // Collect role information for each cast member in this media item
            const roleInfoByPerson: {
              [personId: number]: {
                character?: string;
                job?: string;
                department?: string;
              };
            } = {};

            allCreditsArrays.forEach((creditsArray, personIndex) => {
              const personId = selectedCastMembers[personIndex].id;
              const personMediaItem = creditsArray.find(
                (media) =>
                  media.id === mediaItem1.id &&
                  media.media_type === mediaItem1.media_type
              );

              if (personMediaItem) {
                roleInfoByPerson[personId] = {
                  character: personMediaItem.character,
                  job: personMediaItem.job,
                  department: personMediaItem.department,
                };
              }
            });

            // Store the role information in the enhanced media items
            enhancedMedia1.castMemberRoles = roleInfoByPerson;
            enhancedMedia2.castMemberRoles = roleInfoByPerson;

            commonMediaPairs.push([enhancedMedia1, enhancedMedia2]);
          }
        });

        if (commonMediaPairs.length > 0) {
          // Sort by popularity of first media item
          setCommonMedia(
            commonMediaPairs.sort((a, b) => b[0].popularity - a[0].popularity)
          );
        } else {
          const castMemberNames = selectedCastMembers
            .map((member) => member.name)
            .join(", ");
          setMediaError(
            selectedCastMembers.length === 2
              ? `${selectedCastMembers[0].name} and ${selectedCastMembers[1].name} haven't worked together in any movies or TV shows`
              : `No shared projects found among: ${castMemberNames}`
          );
        }
      } catch (err) {
        setMediaError("Error fetching filmography information");
        console.error(err);
      } finally {
        setMediaLoading(false);
      }
    }
  };

  // Function to search for films
  const searchFilms = async (
    query: string
  ): Promise<{
    results: Film[];
    error: string | null;
  }> => {
    if (!query.trim()) {
      return { results: [], error: "Please enter a film title" };
    }

    try {
      const movieData = await tmdbApi.searchMovies(query);

      if (movieData.results && movieData.results.length > 0) {
        const sortedResults = movieData.results.sort(
          (a: Film, b: Film) => b.popularity - a.popularity
        );
        return { results: sortedResults, error: null };
      } else {
        return { results: [], error: "No films found" };
      }
    } catch (err) {
      console.error("Error searching for films:", err);
      return { results: [], error: "An error occurred while searching" };
    }
  };

  // Function to search for TV shows
  const searchTVShows = async (
    query: string
  ): Promise<{
    results: TVShow[];
    error: string | null;
  }> => {
    if (!query.trim()) {
      return { results: [], error: "Please enter a TV show title" };
    }

    try {
      const tvData = await tmdbApi.searchTVShows(query);

      if (tvData.results && tvData.results.length > 0) {
        const sortedResults = tvData.results.sort(
          (a: TVShow, b: TVShow) => b.popularity - a.popularity
        );
        return { results: sortedResults, error: null };
      } else {
        return { results: [], error: "No TV shows found" };
      }
    } catch (err) {
      console.error("Error searching for TV shows:", err);
      return {
        results: [],
        error: "An error occurred while searching for TV shows",
      };
    }
  };

  // Function to search for actors
  const searchPeople = async (
    query: string
  ): Promise<{
    results: Person[];
    error: string | null;
  }> => {
    if (!query.trim()) {
      return { results: [], error: "Please enter an actor's name" };
    }

    try {
      const personData = await tmdbApi.searchActor(query);

      if (personData.results && personData.results.length > 0) {
        // Convert API results to Person format with roles array
        const actorResults: Person[] = personData.results
          .map((apiPerson) => ({
            id: apiPerson.id,
            name: apiPerson.name,
            profile_path: apiPerson.profile_path,
            known_for_department: apiPerson.known_for_department,
            popularity: apiPerson.popularity,
            known_for: apiPerson.known_for,
            roles: ["cast"] as ("cast" | "crew")[], // Default to cast role for search results
          }))
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        if (actorResults.length > 0) {
          return { results: actorResults, error: null };
        } else {
          return { results: [], error: "No actors found with that name" };
        }
      } else {
        return { results: [], error: "No actors found" };
      }
    } catch (err) {
      console.error("Error searching for actors:", err);
      return { results: [], error: "An error occurred while searching" };
    }
  };

  // Array management functions - now the primary interface
  const addMediaItem = useCallback((media: MediaItem) => {
    setSelectedMediaItems((prev) => {
      // Check if media already exists in array
      const existingIndex = prev.findIndex(
        (item) => item.id === media.id && item.media_type === media.media_type
      );

      let newArray: MediaItem[];

      if (existingIndex !== -1) {
        // Replace existing item
        newArray = [...prev];
        newArray[existingIndex] = media;
      } else {
        // Add new item
        newArray = [...prev, media];
      }

      // Save to storage
      saveMediaItemsToStorage(newArray);

      return newArray;
    });
  }, []);

  const removeMediaItem = useCallback((mediaId: number) => {
    setSelectedMediaItems((prev) => {
      const newArray = prev.filter((item) => item.id !== mediaId);

      // Save to storage
      saveMediaItemsToStorage(newArray);

      return newArray;
    });
  }, []);

  const clearMediaItems = useCallback(() => {
    const emptyArray: MediaItem[] = [];

    setSelectedMediaItems(emptyArray);

    // Save to storage
    saveMediaItemsToStorage(emptyArray);
  }, []);

  const reorderMediaItems = useCallback(
    (fromIndex: number, toIndex: number) => {
      setSelectedMediaItems((prev) => {
        if (
          fromIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex < 0 ||
          toIndex >= prev.length
        ) {
          return prev; // Invalid indices
        }

        const newArray = [...prev];
        const [movedItem] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, movedItem);

        // Save to storage
        saveMediaItemsToStorage(newArray);

        return newArray;
      });
    },
    []
  );

  const updateMediaItem = useCallback((index: number, media: MediaItem) => {
    setSelectedMediaItems((prev) => {
      if (index < 0 || index >= prev.length) {
        return prev; // Invalid index
      }

      const newArray = [...prev];
      newArray[index] = media;

      // Save to storage
      saveMediaItemsToStorage(newArray);

      return newArray;
    });
  }, []);

  const getMediaItemAtIndex = useCallback(
    (index: number): MediaItem | null => {
      return selectedMediaItems[index] || null;
    },
    [selectedMediaItems]
  );

  // Array management functions for cast members
  const addCastMember = useCallback((person: Person) => {
    setSelectedCastMembersInternal((prev) => {
      // Check if person already exists in array
      const existingIndex = prev.findIndex((p) => p.id === person.id);

      let newArray: Person[];

      if (existingIndex !== -1) {
        // Replace existing person
        newArray = [...prev];
        newArray[existingIndex] = {
          ...person,
          roles: person.roles || ["cast"], // Ensure roles array exists
        };
      } else {
        // Add new person
        newArray = [
          ...prev,
          {
            ...person,
            roles: person.roles || ["cast"], // Ensure roles array exists
          },
        ];
      }

      // Save to storage
      saveCastMembersToStorage(newArray);

      return newArray;
    });
  }, []);

  const removeCastMember = useCallback((personId: number) => {
    setSelectedCastMembersInternal((prev) => {
      const newArray = prev.filter((person) => person.id !== personId);

      // Save to storage
      saveCastMembersToStorage(newArray);

      return newArray;
    });
  }, []);

  const clearCastMembers = useCallback(async () => {
    setSelectedCastMembersInternal([]);

    // Clear both array and legacy storage
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_CAST_MEMBERS);
      await AsyncStorage.removeItem(STORAGE_KEYS.CAST_MEMBER_1);
      await AsyncStorage.removeItem(STORAGE_KEYS.CAST_MEMBER_2);
    } catch (error) {
      console.error("Error clearing cast members from storage:", error);
    }
  }, []);

  const reorderCastMembers = useCallback(
    (fromIndex: number, toIndex: number) => {
      setSelectedCastMembersInternal((prev) => {
        if (
          fromIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex < 0 ||
          toIndex >= prev.length
        ) {
          return prev; // Invalid indices
        }

        const newArray = [...prev];
        const [movedItem] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, movedItem);

        // Save to storage
        saveCastMembersToStorage(newArray);

        return newArray;
      });
    },
    []
  );

  const updateCastMember = useCallback((index: number, person: Person) => {
    setSelectedCastMembersInternal((prev) => {
      if (index < 0 || index >= prev.length) {
        return prev; // Invalid index
      }

      const newArray = [...prev];
      newArray[index] = {
        ...person,
        roles: person.roles || ["cast"], // Ensure roles array exists
      };

      // Save to storage
      saveCastMembersToStorage(newArray);

      return newArray;
    });
  }, []);

  const getCastMemberAtIndex = useCallback(
    (index: number): Person | null => {
      return selectedCastMembers[index] || null;
    },
    [selectedCastMembers]
  );

  // Value object that will be passed to consumers
  const value: FilmContextType = {
    // Array-based media selection (primary)
    selectedMediaItems,
    addMediaItem,
    removeMediaItem,
    clearMediaItems,
    reorderMediaItems,
    updateMediaItem,
    getMediaItemAtIndex,

    // Array-based cast member selection (only approach now)
    selectedCastMembers,
    addCastMember,
    removeCastMember,
    clearCastMembers,
    reorderCastMembers,
    updateCastMember,
    getCastMemberAtIndex,

    // Remove legacy properties from value object
    castMembers,
    castLoading,
    castError,
    displayMode,
    commonMedia,
    mediaLoading,
    mediaError,
    refreshCastData: fetchCastData,
    getActorFilmography,
    searchPeople,
    getMediaItems,
    getCredits,
    getCast,
  };

  // Show a loading state if we're still initializing from AsyncStorage
  if (isLoading) {
    return null; // Or a loading indicator if you prefer
  }

  return <FilmContext.Provider value={value}>{children}</FilmContext.Provider>;
};
