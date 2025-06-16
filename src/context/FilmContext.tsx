import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Film,
  CastMember,
  MovieSearchResult,
  TVShow,
  MediaItem,
  Person,
} from "../types/types";
import tmdbApi from "../api/tmdbApi";
import { CommonMediaItem } from "../types/types";
import { CommonCastMember } from "../types/types";
import { Actor } from "../types/types";

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  MEDIA_ITEM_1: "actor-matches:selectedMediaItem1",
  MEDIA_ITEM_2: "actor-matches:selectedMediaItem2",
  CAST_MEMBER_1: "actor-matches:selectedCastMember1",
  CAST_MEMBER_2: "actor-matches:selectedCastMember2",
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

export const convertCommonMediaToMediaItem = (
  commonMedia: CommonMediaItem
): MediaItem => {
  // Base properties for both types
  const baseProperties = {
    id: commonMedia.id,
    name: commonMedia.name || commonMedia.title || "Unknown",
    character: commonMedia.character,
    popularity: commonMedia.popularity || 0,
    overview: commonMedia.overview,
    poster_path: commonMedia.poster_path,
    vote_average: commonMedia.vote_average,
  };

  if (commonMedia.media_type === "movie") {
    // It's a movie, return a Film type
    return {
      ...baseProperties,
      media_type: "movie" as const,
      title: commonMedia.title || commonMedia.name || "Unknown",
      release_date: commonMedia.release_date,
    };
  } else {
    // It's a TV show
    return {
      ...baseProperties,
      media_type: "tv" as const,
      first_air_date: commonMedia.first_air_date,
      episode_count: commonMedia.episode_count,
    };
  }
};

// Update default values to use the MediaItem type
const DEFAULT_MEDIA_1: MediaItem = {
  id: 238,
  title: "The Godfather",
  name: "The Godfather",
  release_date: "1972-03-14",
  popularity: 92.179,
  overview:
    "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps in to take care of the would-be killers, launching a campaign of bloody revenge.",
  poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  vote_average: 8.7,
  media_type: "movie",
};

const DEFAULT_MEDIA_2: MediaItem = {
  id: 242,
  title: "The Godfather Part III",
  name: "The Godfather Part III",
  release_date: "1990-12-25",
  popularity: 45.897,
  overview:
    "In the midst of trying to legitimize his business dealings in 1979 New York and Italy, aging mafia don, Michael Corleone seeks forgiveness for his sins while taking a young protege under his wing.",
  poster_path: "/lm3pQ2QoQ16pextRsmnUbG2onES.jpg",
  vote_average: 7.4,
  media_type: "movie",
};

const DEFAULT_ACTOR_1: Person = {
  id: 31,
  name: "Tom Hanks",
  profile_path: "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg",
  role_type: "cast", // Optional role type for actors
};

const DEFAULT_ACTOR_2: Person = {
  id: 192,
  name: "Morgan Freeman",
  profile_path: "/jPsLqiYGSofU4s6BjrxnefMfabb.jpg",
  role_type: "cast", // Optional role type for actors
};

// Define interfaces

// Define the shape of our context state
interface FilmContextType {
  // Media selection
  selectedMediaItem1: MediaItem | null;
  selectedMediaItem2: MediaItem | null;
  setSelectedMediaItem1: (media: MediaItem | null) => void;
  setSelectedMediaItem2: (media: MediaItem | null) => void;

  // Cast member selection
  selectedCastMember1: Person | null;
  selectedCastMember2: Person | null;
  setSelectedCastMember1: (actor: Person | null) => void;
  setSelectedCastMember2: (actor: Person | null) => void;

  // Cast data
  castMembers: CommonCastMember[];
  castLoading: boolean;
  castError: string;
  displayMode: "single" | "comparison";

  // Filmography data for actors
  commonMedia: CommonMediaItem[];
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
  selectedMediaItem1: null,
  selectedMediaItem2: null,
  setSelectedMediaItem1: () => {},
  setSelectedMediaItem2: () => {},
  selectedCastMember1: null,
  selectedCastMember2: null,
  setSelectedCastMember1: () => {},
  setSelectedCastMember2: () => {},
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
  // Media selection state - initialize with null and load from storage
  const [selectedMediaItem1, setSelectedMediaItem1Internal] =
    useState<MediaItem | null>(null);
  const [selectedMediaItem2, setSelectedMediaItem2Internal] =
    useState<MediaItem | null>(null);

  // Actor selection state - initialize with null and load from storage
  const [selectedCastMember1, setSelectedCastMember1Internal] =
    useState<Person | null>(null);
  const [selectedCastMember2, setSelectedCastMember2Internal] =
    useState<Person | null>(null);

  // Loading state for initial data
  const [isLoading, setIsLoading] = useState(true);

  // Cast data state
  const [castMembers, setCastMembers] = useState<CommonCastMember[]>([]);
  const [castLoading, setCastLoading] = useState<boolean>(false);
  const [castError, setCastError] = useState<string>("");
  const [displayMode, setDisplayMode] = useState<"single" | "comparison">(
    "comparison"
  );

  // Media data state for actors
  const [commonMedia, setCommonMedia] = useState<CommonMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string>("");

  // Load data from AsyncStorage on initial mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Load media items
        const storedMediaItem1String = await AsyncStorage.getItem(
          STORAGE_KEYS.MEDIA_ITEM_1
        );
        const storedMediaItem2String = await AsyncStorage.getItem(
          STORAGE_KEYS.MEDIA_ITEM_2
        );

        // Load cast members
        const storedCastMember1String = await AsyncStorage.getItem(
          STORAGE_KEYS.CAST_MEMBER_1
        );
        const storedCastMember2String = await AsyncStorage.getItem(
          STORAGE_KEYS.CAST_MEMBER_2
        );

        // Parse stored data or use defaults
        const storedMediaItem1 = storedMediaItem1String
          ? JSON.parse(storedMediaItem1String)
          : DEFAULT_MEDIA_1;

        const storedMediaItem2 = storedMediaItem2String
          ? JSON.parse(storedMediaItem2String)
          : DEFAULT_MEDIA_2;

        const storedCastMember1 = storedCastMember1String
          ? JSON.parse(storedCastMember1String)
          : DEFAULT_ACTOR_1;

        const storedCastMember2 = storedCastMember2String
          ? JSON.parse(storedCastMember2String)
          : DEFAULT_ACTOR_2;

        // Update state with stored values
        setSelectedMediaItem1Internal(storedMediaItem1);
        setSelectedMediaItem2Internal(storedMediaItem2);
        setSelectedCastMember1Internal(storedCastMember1);
        setSelectedCastMember2Internal(storedCastMember2);
      } catch (error) {
        console.error("Error loading stored selections:", error);
        // Fall back to defaults in case of error
        setSelectedMediaItem1Internal(DEFAULT_MEDIA_1);
        setSelectedMediaItem2Internal(DEFAULT_MEDIA_2);
        setSelectedCastMember1Internal(DEFAULT_ACTOR_1);
        setSelectedCastMember2Internal(DEFAULT_ACTOR_2);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  // Wrapper methods to persist data to AsyncStorage
  const setSelectedMediaItem1 = async (media: MediaItem | null) => {
    setSelectedMediaItem1Internal(media);
    try {
      if (media) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.MEDIA_ITEM_1,
          JSON.stringify(media)
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.MEDIA_ITEM_1);
      }
    } catch (error) {
      console.error("Error storing selectedMediaItem1:", error);
    }
  };

  const setSelectedMediaItem2 = async (media: MediaItem | null) => {
    setSelectedMediaItem2Internal(media);
    try {
      if (media) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.MEDIA_ITEM_2,
          JSON.stringify(media)
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.MEDIA_ITEM_2);
      }
    } catch (error) {
      console.error("Error storing selectedMediaItem2:", error);
    }
  };

  const setSelectedCastMember1 = async (actor: Person | null) => {
    setSelectedCastMember1Internal(actor);
    try {
      if (actor) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CAST_MEMBER_1,
          JSON.stringify(actor)
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CAST_MEMBER_1);
      }
    } catch (error) {
      console.error("Error storing selectedCastMember1:", error);
    }
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
      let castMembers: Person[] = [];
      let crewMembers: Person[] = [];

      // Handle movie and TV show credits separately to address type issues
      if (mediaType === "movie") {
        // For movies, use getMovieCast
        const movieCastData = await tmdbApi.getMovieCast(mediaId);

        // Process movie cast members
        if (movieCastData.cast && movieCastData.cast.length > 0) {
          castMembers = movieCastData.cast.map((member) => ({
            id: member.id,
            name: member.name,
            profile_path: member.profile_path,
            character: member.character || "Unknown role",
            popularity: member.popularity || 0,
            gender: member.gender,
            role_type: "cast" as const,
          }));
        }

        // Process movie crew members
        if (movieCastData.crew && movieCastData.crew.length > 0) {
          crewMembers = movieCastData.crew.map((member) => ({
            id: member.id,
            name: member.name,
            profile_path: member.profile_path,
            job: member.job || "Unknown job",
            department: member.department || "Other",
            popularity: member.popularity || 0,
            gender: member.gender,
            role_type: "crew" as const,
          }));
        }
      } else {
        // For TV shows, use getTVShowAggregateCredits
        const tvCastData = await tmdbApi.getTVShowAggregateCredits(mediaId);

        // Process TV cast members - handle the different structure
        if (tvCastData.cast && tvCastData.cast.length > 0) {
          castMembers = tvCastData.cast.map((member) => {
            // Use type assertion to tell TypeScript about the expected structure
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

            // Extract character from roles array or set default
            const character =
              tvMember.roles && tvMember.roles.length > 0
                ? tvMember.roles
                    .map((role: { character: string }) => role.character)
                    .join(", ")
                : "Unknown role";

            return {
              id: tvMember.id,
              name: tvMember.name,
              profile_path: tvMember.profile_path,
              character,
              popularity: tvMember.popularity || 0,
              gender: tvMember.gender,
              role_type: "cast" as const,
              // Add TV-specific fields
              ...(tvMember.total_episode_count
                ? { total_episode_count: tvMember.total_episode_count }
                : {}),
            };
          });
        }

        // TV shows' aggregate credits might not have crew in the same way
        // If you need crew for TV shows, you may need to use a different API call
      }

      // Combine cast and crew and sort by popularity
      const combinedResults = [...castMembers, ...crewMembers].sort(
        (a, b) => (b.popularity || 0) - (a.popularity || 0)
      );

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
  const setSelectedCastMember2 = async (actor: Person | null) => {
    setSelectedCastMember2Internal(actor);
    try {
      if (actor) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CAST_MEMBER_2,
          JSON.stringify(actor)
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CAST_MEMBER_2);
      }
    } catch (error) {
      console.error("Error storing selectedCastMember2:", error);
    }
  };

  // Fetch cast data whenever selected media changes - only after loading complete
  useEffect(() => {
    if (!isLoading) {
      fetchCastData();
    }
  }, [selectedMediaItem1, selectedMediaItem2, isLoading]);

  // Fetch actor filmography whenever selected actors change - only after loading complete
  useEffect(() => {
    if (!isLoading && (selectedCastMember1 || selectedCastMember2)) {
      getActorFilmography(
        selectedCastMember1?.id,
        selectedCastMember2?.id,
        selectedCastMember1?.name,
        selectedCastMember2?.name
      );
    }
  }, [selectedCastMember1, selectedCastMember2, isLoading]);

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

      let combinedResults: MediaItem[] = [];

      // Process movie cast credits
      if (movieCreditsResponse.cast && movieCreditsResponse.cast.length > 0) {
        const movieCastItems = movieCreditsResponse.cast
          .filter((item) => item.release_date)
          .map((item) => ({
            ...convertToMediaItem(item, "movie"),
            role_type: "cast" as const,
          }));
        combinedResults = [...combinedResults, ...movieCastItems];
      }

      // Process movie crew credits
      if (movieCreditsResponse.crew && movieCreditsResponse.crew.length > 0) {
        const movieCrewItems = movieCreditsResponse.crew
          .filter((item) => item.release_date)
          .map((item) => ({
            ...convertToMediaItem(item, "movie"),
            role_type: "crew" as const,
            character: item.job,
            department: item.department,
          }));
        combinedResults = [...combinedResults, ...movieCrewItems];
      }

      // Process TV cast credits - fix type issues
      if (tvCreditsResponse.cast && tvCreditsResponse.cast.length > 0) {
        const tvCastItems = tvCreditsResponse.cast
          // Type assertion to tell TypeScript these are TVShow objects
          .filter((item: any) => item.first_air_date)
          .map((item: any) => ({
            ...convertToMediaItem(item, "tv"),
            role_type: "cast" as const,
          }));
        combinedResults = [...combinedResults, ...tvCastItems];
      }

      // Process TV crew credits - fix type issues
      if (tvCreditsResponse.crew && tvCreditsResponse.crew.length > 0) {
        const tvCrewItems = tvCreditsResponse.crew
          // Type assertion to tell TypeScript these are TVShow-like objects
          .filter((item: any) => item.first_air_date)
          .map((item: any) => ({
            ...convertToMediaItem(
              {
                ...item,
                name: item.name || item.title || "Unknown", // Ensure name exists for TV shows
                media_type: "tv",
              },
              "tv"
            ),
            role_type: "crew" as const,
            character: item.job,
            department: item.department,
          }));
        combinedResults = [...combinedResults, ...tvCrewItems];
      }

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
    if (!selectedMediaItem1 && !selectedMediaItem2) {
      setDisplayMode("comparison");
      return;
    }

    // Case 2: Only one media item selected
    if (
      (selectedMediaItem1 && !selectedMediaItem2) ||
      (!selectedMediaItem1 && selectedMediaItem2)
    ) {
      setDisplayMode("single");
      const activeMedia = selectedMediaItem1 || selectedMediaItem2;

      if (!activeMedia) return; // TypeScript safety

      setCastLoading(true);

      try {
        // Check if this is a TV show or a movie
        const isTV = activeMedia.media_type === "tv";

        let castData;

        // Fetch the appropriate cast data
        if (isTV) {
          // Use aggregate credits for TV shows to get a more comprehensive cast list
          const aggregateCredits = await tmdbApi.getTVShowAggregateCredits(
            activeMedia.id
          );

          // Transform aggregate credits format to match our CastMember interface
          castData = {
            cast: aggregateCredits.cast.map((actor) => ({
              id: actor.id,
              name: actor.name,
              // Use the first character role or combine multiple roles
              character:
                actor.roles && actor.roles.length > 0
                  ? actor.roles.map((role) => role.character).join(", ")
                  : "Unknown role",
              profile_path: actor.profile_path,
              order: actor.order,
              gender: actor.gender,
              popularity: actor.popularity,
              total_episode_count: actor.total_episode_count,
            })),
          };
        } else {
          castData = await tmdbApi.getMovieCast(activeMedia.id);
        }

        if (castData.cast && castData.cast.length > 0) {
          // Combine cast and crew into a single array
          const allCastAndCrew = [
            ...castData.cast.map((member) => ({
              ...member,
              role_type: "cast" as const, // Explicitly set role_type for cast members
            })),
            ...(castData.crew
              ? castData.crew.map((member) => ({
                  id: member.id,
                  name: member.name,
                  character: member.job, // Use job as the "character" for crew
                  profile_path: member.profile_path,
                  department: member.department,
                  role_type: "crew" as const,
                  popularity: member.popularity,
                  order:
                    1000 +
                    (member.popularity ? Math.floor(member.popularity) : 0), // Add order property
                }))
              : []),
          ];

          setCastMembers(
            allCastAndCrew.sort(
              (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
            )
          );
        } else {
          setCastError(
            `No cast information available for this ${
              isTV ? "TV show" : "film"
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

    // Case 3: Both media items selected - find common cast
    setDisplayMode("comparison");

    if (selectedMediaItem1 && selectedMediaItem2) {
      setCastLoading(true);

      try {
        // Determine if each media item is a TV show or movie
        const isMedia1TV = selectedMediaItem1.media_type === "tv";
        const isMedia2TV = selectedMediaItem2.media_type === "tv";

        // Fetch appropriate cast for each media item
        let cast1Data, cast2Data;

        if (isMedia1TV) {
          const aggregateCredits = await tmdbApi.getTVShowAggregateCredits(
            selectedMediaItem1.id
          );
          cast1Data = {
            cast: aggregateCredits.cast.map((actor) => ({
              id: actor.id,
              name: actor.name,
              character:
                actor.roles && actor.roles.length > 0
                  ? actor.roles.map((role) => role.character).join(", ")
                  : "Unknown role",
              profile_path: actor.profile_path,
              order: actor.order,
              gender: actor.gender,
              popularity: actor.popularity,
            })),
          };
        } else {
          cast1Data = await tmdbApi.getMovieCast(selectedMediaItem1.id);
        }

        if (isMedia2TV) {
          const aggregateCredits = await tmdbApi.getTVShowAggregateCredits(
            selectedMediaItem2.id
          );
          cast2Data = {
            cast: aggregateCredits.cast.map((actor) => ({
              id: actor.id,
              name: actor.name,
              character:
                actor.roles && actor.roles.length > 0
                  ? actor.roles.map((role) => role.character).join(", ")
                  : "Unknown role",
              profile_path: actor.profile_path,
              order: actor.order,
              gender: actor.gender,
              popularity: actor.popularity,
            })),
          };
        } else {
          cast2Data = await tmdbApi.getMovieCast(selectedMediaItem2.id);
        }

        if (
          cast1Data.cast &&
          cast2Data.cast &&
          cast1Data.cast.length > 0 &&
          cast2Data.cast.length > 0
        ) {
          // Create maps for both cast and crew from the first media item
          const cast1Map = new Map();
          cast1Data.cast.forEach((person) => {
            cast1Map.set(person.id, { ...person, role_type: "cast" as const });
          });

          // Add crew members if available
          if (cast1Data.crew) {
            cast1Data.crew.forEach((person) => {
              // Use compound key to handle cases where someone is both cast and crew
              cast1Map.set(`crew-${person.id}-${person.job}`, {
                ...person,
                role_type: "crew" as const,
              });
            });
          }

          // Find matching people in the second media item
          const matchingCast = cast2Data.cast
            .filter((person) => cast1Map.has(person.id))
            .map((person) => {
              const personInMedia1 = cast1Map.get(person.id);
              return {
                ...person,
                role_type: "cast" as const,
                characterInMedia1: personInMedia1.character || "Unknown role",
                characterInMedia2: person.character || "Unknown role",
              };
            });

          // Find matching crew if available
          const matchingCrew = cast2Data.crew
            ? cast2Data.crew
                .filter((person) =>
                  cast1Map.has(`crew-${person.id}-${person.job}`)
                )
                .map((person) => {
                  const personInMedia1 = cast1Map.get(
                    `crew-${person.id}-${person.job}`
                  );
                  return {
                    ...person,
                    character: person.job, // Add this line to set character to job
                    role_type: "crew" as const,
                    department: person.department || "Other",
                    order:
                      1000 +
                      (person.popularity ? Math.floor(person.popularity) : 0),
                    characterInMedia1: personInMedia1.job || "Unknown role",
                    characterInMedia2: person.job || "Unknown role",
                  };
                })
            : [];

          // Combine matching cast and crew and sort by popularity
          const allMatchingPeople = [...matchingCast, ...matchingCrew];

          if (allMatchingPeople.length > 0) {
            setCastMembers(
              allMatchingPeople.sort(
                (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
              )
            );
          } else {
            setCastError("No common cast or crew members found");
          }
        } else {
          setCastError("Cast information not available for one or both titles");
        }
      } catch (err) {
        setCastError("Error fetching cast information");
        console.error(err);
      } finally {
        setCastLoading(false);
      }
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
        // Get both movie and TV credits
        const movieCredits = await tmdbApi.getActorMovieCredits(
          selectedActorId
        );
        const tvCredits = await tmdbApi.getActorTVCredits(selectedActorId);

        // Process movie CAST credits
        const movieCastItems: CommonMediaItem[] =
          movieCredits.cast && movieCredits.cast.length > 0
            ? movieCredits.cast
                .filter((film) => film.release_date)
                .map((film) => ({
                  ...convertToMediaItem(film, "movie"),
                  characterForActor1: actor1Id ? film.character : undefined,
                  characterForActor2: actor2Id ? film.character : undefined,
                  roleType: "cast" as const,
                }))
            : [];

        // Process movie CREW credits
        const movieCrewItems: CommonMediaItem[] =
          movieCredits.crew && movieCredits.crew.length > 0
            ? movieCredits.crew
                .filter((film) => film.release_date)
                .map((film) => ({
                  ...convertToMediaItem(film, "movie"),
                  character: film.job, // Use job as character
                  characterForActor1: actor1Id ? film.job : undefined,
                  characterForActor2: actor2Id ? film.job : undefined,
                  roleType: "crew" as const,
                  department: film.department,
                  job: film.job,
                }))
            : [];

        // Process TV CAST credits
        const tvCastItems: CommonMediaItem[] =
          tvCredits.cast && tvCredits.cast.length > 0
            ? tvCredits.cast
                .filter((show) => show.first_air_date)
                .map((show) => ({
                  ...convertToMediaItem(show, "tv"),
                  characterForActor1: actor1Id ? show.character : undefined,
                  characterForActor2: actor2Id ? show.character : undefined,
                  roleType: "cast" as const,
                }))
            : [];

        // Process TV CREW credits
        const tvCrewItems: CommonMediaItem[] =
          tvCredits.crew && tvCredits.crew.length > 0
            ? tvCredits.crew
                //.filter((show) => show.first_air_date)
                .map((show) => ({
                  ...convertToMediaItem(show, "tv"),
                  character: show.job, // Use job as character
                  characterForActor1: actor1Id ? show.job : undefined,
                  characterForActor2: actor2Id ? show.job : undefined,
                  roleType: "crew" as const,
                  department: show.department,
                  job: show.job,
                }))
            : [];

        // Combine all types of credits and sort by popularity
        const combinedMedia = [
          ...movieCastItems,
          ...movieCrewItems,
          ...tvCastItems,
          ...tvCrewItems,
        ].sort((a, b) => b.popularity - a.popularity);

        if (combinedMedia.length > 0) {
          setCommonMedia(combinedMedia);
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

    // Case 3: Both actors selected - find common media
    if (actor1Id && actor2Id) {
      setMediaLoading(true);

      try {
        // Fetch movie credits for both actors
        const actor1MovieCredits = await tmdbApi.getActorMovieCredits(actor1Id);
        const actor2MovieCredits = await tmdbApi.getActorMovieCredits(actor2Id);

        // Fetch TV credits for both actors
        const actor1TVCredits = await tmdbApi.getActorTVCredits(actor1Id);
        const actor2TVCredits = await tmdbApi.getActorTVCredits(actor2Id);

        // Process all credits to MediaItem format
        const actor1MediaItems: Map<string, CommonMediaItem> = new Map();

        // Add CAST movies from actor 1
        if (actor1MovieCredits.cast && actor1MovieCredits.cast.length > 0) {
          actor1MovieCredits.cast.forEach((film) => {
            if (film.release_date) {
              actor1MediaItems.set(`movie-${film.id}-cast`, {
                ...convertToMediaItem(film, "movie"),
                characterForActor1: film.character || "Unknown role",
                role1Type: "cast" as const,
              });
            }
          });
        }

        // Add CREW movies from actor 1
        if (actor1MovieCredits.crew && actor1MovieCredits.crew.length > 0) {
          actor1MovieCredits.crew.forEach((film) => {
            if (film.release_date) {
              // Create a unique key that includes the department and job
              const key = `movie-${film.id}-crew-${film.department}-${film.job}`;
              actor1MediaItems.set(key, {
                ...convertToMediaItem(film, "movie"),
                characterForActor1: film.job || "Unknown role",
                role1Type: "crew" as const,
                department1: film.department,
                job1: film.job,
              });
            }
          });
        }

        // Add CAST TV shows from actor 1
        if (actor1TVCredits.cast && actor1TVCredits.cast.length > 0) {
          actor1TVCredits.cast.forEach((show) => {
            if (show.first_air_date) {
              actor1MediaItems.set(`tv-${show.id}-cast`, {
                ...convertToMediaItem(show, "tv"),
                characterForActor1: show.character || "Unknown role",
                role1Type: "cast" as const,
              });
            }
          });
        }

        // Add CREW TV shows from actor 1
        if (actor1TVCredits.crew && actor1TVCredits.crew.length > 0) {
          actor1TVCredits.crew.forEach((show) => {
            if (true) {
              // Create a unique key that includes the department and job
              const key = `tv-${show.id}-crew-${show.department}-${show.job}`;
              actor1MediaItems.set(key, {
                ...convertToMediaItem(show, "tv"),
                characterForActor1: show.job || "Unknown role",
                role1Type: "crew" as const,
                department1: show.department,
                job1: show.job,
              });
            }
          });
        }

        // Find matching movies (CAST) from actor 2
        const matchingMoviesCast: CommonMediaItem[] = [];
        if (actor2MovieCredits.cast && actor2MovieCredits.cast.length > 0) {
          actor2MovieCredits.cast.forEach((film) => {
            // Check both cast and crew keys
            const castKey = `movie-${film.id}-cast`;

            if (film.release_date && actor1MediaItems.has(castKey)) {
              const mediaItem = actor1MediaItems.get(castKey)!;
              matchingMoviesCast.push({
                ...mediaItem,
                characterForActor2: film.character || "Unknown role",
                role2Type: "cast" as const,
              });
            }

            // Also check if actor 1 was crew on this same movie
            // Loop through possible crew combinations
            if (actor1MovieCredits.crew) {
              actor1MovieCredits.crew.forEach((crewRole) => {
                if (crewRole.id === film.id) {
                  const crewKey = `movie-${film.id}-crew-${crewRole.department}-${crewRole.job}`;
                  if (actor1MediaItems.has(crewKey)) {
                    const mediaItem = actor1MediaItems.get(crewKey)!;
                    matchingMoviesCast.push({
                      ...mediaItem,
                      characterForActor2: film.character || "Unknown role",
                      role2Type: "cast" as const,
                    });
                  }
                }
              });
            }
          });
        }

        // Find matching movies (CREW) from actor 2
        const matchingMoviesCrew: CommonMediaItem[] = [];
        if (actor2MovieCredits.crew && actor2MovieCredits.crew.length > 0) {
          actor2MovieCredits.crew.forEach((film) => {
            // Check if actor 1 was cast in this movie
            const castKey = `movie-${film.id}-cast`;

            if (film.release_date && actor1MediaItems.has(castKey)) {
              const mediaItem = actor1MediaItems.get(castKey)!;
              matchingMoviesCrew.push({
                ...mediaItem,
                characterForActor2: film.job || "Unknown role",
                role2Type: "crew" as const,
                department2: film.department,
                job2: film.job,
              });
            }

            // Check if actor 1 was also crew on this movie (might be different departments)
            // We'll create a base key without the department/job
            const baseKey = `movie-${film.id}-crew`;

            // Find any keys that start with this base key
            for (const [key, mediaItem] of actor1MediaItems.entries()) {
              if (key.startsWith(baseKey)) {
                matchingMoviesCrew.push({
                  ...mediaItem,
                  characterForActor2: film.job || "Unknown role",
                  role2Type: "crew" as const,
                  department2: film.department,
                  job2: film.job,
                });
                // We found a match, no need to check other keys
                break;
              }
            }
          });
        }

        // Apply similar logic for TV shows
        const matchingTVShowsCast: CommonMediaItem[] = [];
        if (actor2TVCredits.cast && actor2TVCredits.cast.length > 0) {
          actor2TVCredits.cast.forEach((show) => {
            const castKey = `tv-${show.id}-cast`;

            if (show.first_air_date && actor1MediaItems.has(castKey)) {
              const mediaItem = actor1MediaItems.get(castKey)!;
              matchingTVShowsCast.push({
                ...mediaItem,
                characterForActor2: show.character || "Unknown role",
                role2Type: "cast" as const,
              });
            }

            // Also check if actor 1 was crew on this same TV show
            if (actor1TVCredits.crew) {
              actor1TVCredits.crew.forEach((crewRole) => {
                if (crewRole.id === show.id) {
                  const crewKey = `tv-${show.id}-crew-${crewRole.department}-${crewRole.job}`;
                  if (actor1MediaItems.has(crewKey)) {
                    const mediaItem = actor1MediaItems.get(crewKey)!;
                    matchingTVShowsCast.push({
                      ...mediaItem,
                      characterForActor2: show.character || "Unknown role",
                      role2Type: "cast" as const,
                    });
                  }
                }
              });
            }
          });
        }

        const matchingTVShowsCrew: CommonMediaItem[] = [];
        if (actor2TVCredits.crew && actor2TVCredits.crew.length > 0) {
          actor2TVCredits.crew.forEach((show) => {
            const castKey = `tv-${show.id}-cast`;

            if (true && actor1MediaItems.has(castKey)) {
              const mediaItem = actor1MediaItems.get(castKey)!;
              matchingTVShowsCrew.push({
                ...mediaItem,
                characterForActor2: show.job || "Unknown role",
                role2Type: "crew" as const,
                department2: show.department,
                job2: show.job,
              });
            }

            // Check if actor 1 was also crew on this TV show
            const baseKey = `tv-${show.id}-crew`;

            for (const [key, mediaItem] of actor1MediaItems.entries()) {
              if (key.startsWith(baseKey)) {
                matchingTVShowsCrew.push({
                  ...mediaItem,
                  characterForActor2: show.job || "Unknown role",
                  role2Type: "crew" as const,
                  department2: show.department,
                  job2: show.job,
                });
                break;
              }
            }
          });
        }

        // Combine all matching media
        const allMatchingMedia = [
          ...matchingMoviesCast,
          ...matchingMoviesCrew,
          ...matchingTVShowsCast,
          ...matchingTVShowsCrew,
        ];

        // Create a more robust deduplication approach that considers roles
        const seen = new Set();
        const uniqueMedia = allMatchingMedia.filter((item) => {
          const key = `${item.media_type}-${item.id}-${item.role1Type}-${item.role2Type}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort by popularity
        const sortedMedia = uniqueMedia.sort(
          (a, b) => b.popularity - a.popularity
        );

        if (sortedMedia.length > 0) {
          setCommonMedia(sortedMedia);
        } else {
          setMediaError(
            `${actor1Name} and ${actor2Name} haven't worked together in any movies or TV shows`
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
    results: Actor[];
    error: string | null;
  }> => {
    if (!query.trim()) {
      return { results: [], error: "Please enter an actor's name" };
    }

    try {
      const personData = await tmdbApi.searchActor(query);

      if (personData.results && personData.results.length > 0) {
        // Filter to acting roles and sort by popularity if available
        const actorResults = personData.results.sort(
          (a: Actor, b: Actor) => (b.popularity || 0) - (a.popularity || 0)
        );

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

  // Value object that will be passed to consumers
  const value = {
    selectedMediaItem1,
    selectedMediaItem2,
    setSelectedMediaItem1,
    setSelectedMediaItem2,
    selectedCastMember1,
    selectedCastMember2,
    setSelectedCastMember1,
    setSelectedCastMember2,
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
