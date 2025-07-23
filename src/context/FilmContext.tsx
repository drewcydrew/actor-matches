import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Film, TVShow, MediaItem, Person } from "../types/types";
import tmdbApi from "../api/tmdbApi";
//import { Actor } from "../types/types";

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
  castMembers: [Person, Person][];
  castLoading: boolean;
  castError: string;
  displayMode: "single" | "comparison";

  // Filmography data for actors
  commonMedia: [MediaItem, MediaItem][];
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
  const [castMembers, setCastMembers] = useState<[Person, Person][]>([]);
  const [castLoading, setCastLoading] = useState<boolean>(false);
  const [castError, setCastError] = useState<string>("");
  const [displayMode, setDisplayMode] = useState<"single" | "comparison">(
    "comparison"
  );

  // Media data state for actors
  const [commonMedia, setCommonMedia] = useState<[MediaItem, MediaItem][]>([]);
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

        // Check if this is the first time loading (no storage keys exist at all)
        const isFirstLoad =
          storedMediaItem1String === null &&
          storedMediaItem2String === null &&
          storedCastMember1String === null &&
          storedCastMember2String === null;

        // Parse stored data - only use defaults on first load
        const storedMediaItem1 = storedMediaItem1String
          ? JSON.parse(storedMediaItem1String)
          : isFirstLoad
          ? DEFAULT_MEDIA_1
          : null;

        const storedMediaItem2 = storedMediaItem2String
          ? JSON.parse(storedMediaItem2String)
          : isFirstLoad
          ? DEFAULT_MEDIA_2
          : null;

        const storedCastMember1 = storedCastMember1String
          ? JSON.parse(storedCastMember1String)
          : isFirstLoad
          ? DEFAULT_ACTOR_1
          : null;

        const storedCastMember2 = storedCastMember2String
          ? JSON.parse(storedCastMember2String)
          : isFirstLoad
          ? DEFAULT_ACTOR_2
          : null;

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
          // Group crew members by person ID
          const crewByPerson = new Map<
            number,
            {
              person: any;
              jobs: string[];
              departments: Set<string>;
            }
          >();

          movieCastData.crew.forEach((member) => {
            if (!crewByPerson.has(member.id)) {
              crewByPerson.set(member.id, {
                person: member,
                jobs: [],
                departments: new Set(),
              });
            }

            const crewData = crewByPerson.get(member.id)!;
            crewData.jobs.push(member.job || "Unknown job");
            crewData.departments.add(member.department || "Other");
          });

          // Convert grouped crew data to Person objects
          crewMembers = Array.from(crewByPerson.values()).map(
            ({ person, jobs, departments }) => ({
              id: person.id,
              name: person.name,
              profile_path: person.profile_path,
              jobs: jobs,
              departments: Array.from(departments),
              popularity: person.popularity || 0,
              gender: person.gender,
              role_type: "crew" as const,
            })
          );
        }
      } else {
        // For TV shows, get both aggregate credits (cast) and regular credits (crew)
        const [tvAggregateData, tvRegularData] = await Promise.all([
          tmdbApi.getTVShowAggregateCredits(mediaId),
          tmdbApi.getTVShowCast(mediaId),
        ]);

        // Process TV cast members from aggregate credits
        if (tvAggregateData.cast && tvAggregateData.cast.length > 0) {
          castMembers = tvAggregateData.cast.map((member) => {
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

        // Process TV crew members from regular credits
        if (tvRegularData.crew && tvRegularData.crew.length > 0) {
          // Group crew members by person ID (same logic as movies)
          const crewByPerson = new Map<
            number,
            {
              person: any;
              jobs: string[];
              departments: Set<string>;
            }
          >();

          tvRegularData.crew.forEach((member) => {
            if (!crewByPerson.has(member.id)) {
              crewByPerson.set(member.id, {
                person: member,
                jobs: [],
                departments: new Set(),
              });
            }

            const crewData = crewByPerson.get(member.id)!;
            crewData.jobs.push(member.job || "Unknown job");
            crewData.departments.add(member.department || "Other");
          });

          // Convert grouped crew data to Person objects
          crewMembers = Array.from(crewByPerson.values()).map(
            ({ person, jobs, departments }) => ({
              id: person.id,
              name: person.name,
              profile_path: person.profile_path,
              jobs: jobs,
              departments: Array.from(departments),
              popularity: person.popularity || 0,
              gender: person.gender,
              role_type: "crew" as const,
            })
          );
        }
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
        // Get cast data using our new getCast function
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
          // This keeps the 2D structure consistent across different use cases
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

    // Case 3: Both media items selected - find common cast
    setDisplayMode("comparison");

    if (selectedMediaItem1 && selectedMediaItem2) {
      setCastLoading(true);

      try {
        // Get cast for both media items using our getCast function
        const [media1Response, media2Response] = await Promise.all([
          getCast(selectedMediaItem1.id, selectedMediaItem1.media_type),
          getCast(selectedMediaItem2.id, selectedMediaItem2.media_type),
        ]);

        if (media1Response.error) {
          setCastError(`Error with first media: ${media1Response.error}`);
          return;
        }

        if (media2Response.error) {
          setCastError(`Error with second media: ${media2Response.error}`);
          return;
        }

        const cast1 = media1Response.results;
        const cast2 = media2Response.results;

        if (cast1.length === 0 || cast2.length === 0) {
          setCastError("Cast information not available for one or both titles");
          return;
        }

        // Create a map of people from first media for quick lookup
        const cast1Map = new Map<number, Person>();
        cast1.forEach((person) => {
          cast1Map.set(person.id, person);
        });

        // Find matching people and create pairs
        const matchingPairs: [Person, Person][] = [];

        cast2.forEach((person2) => {
          if (cast1Map.has(person2.id)) {
            const person1 = cast1Map.get(person2.id)!;
            matchingPairs.push([person1, person2]);
          }
        });

        if (matchingPairs.length > 0) {
          // Sort by popularity of the first person in each pair
          setCastMembers(
            matchingPairs.sort(
              (a, b) => (b[0].popularity || 0) - (a[0].popularity || 0)
            )
          );
        } else {
          setCastError("No common cast or crew members found");
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
          const mediaPairs: [MediaItem, MediaItem][] = creditResults.map(
            (mediaItem) => [
              mediaItem,
              { ...mediaItem }, // Create a copy for the second position
            ]
          );

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

    // Case 3: Both actors selected - find common media
    if (actor1Id && actor2Id) {
      setMediaLoading(true);

      try {
        // Get credits for both actors using our getCredits function
        const [actor1Response, actor2Response] = await Promise.all([
          getCredits(actor1Id),
          getCredits(actor2Id),
        ]);

        if (actor1Response.error) {
          setMediaError(`Error with first actor: ${actor1Response.error}`);
          return;
        }

        if (actor2Response.error) {
          setMediaError(`Error with second actor: ${actor2Response.error}`);
          return;
        }

        const actor1Media = actor1Response.results;
        const actor2Media = actor2Response.results;

        // Create a map for quick lookup of actor2's media by ID and type
        const actor2MediaMap = new Map<string, MediaItem>();
        actor2Media.forEach((item) => {
          // Use both ID and role type to allow for different roles in same media
          const key = `${item.id}-${item.media_type}-${item.job || "cast"}`;
          actor2MediaMap.set(key, item);
        });

        // Find matches between the two actors
        const matchingPairs: [MediaItem, MediaItem][] = [];

        actor1Media.forEach((item1) => {
          // Generate the same key format for lookup
          const key = `${item1.id}-${item1.media_type}-${item1.job || "cast"}`;

          // Check for exact role match first
          if (actor2MediaMap.has(key)) {
            const item2 = actor2MediaMap.get(key)!;
            matchingPairs.push([item1, item2]);
          } else {
            // Also check for any match with the same media ID
            // This catches cases where actors had different roles in the same project
            const alternateKeys = Array.from(actor2MediaMap.keys()).filter(
              (k) => k.startsWith(`${item1.id}-${item1.media_type}`)
            );

            if (alternateKeys.length > 0) {
              const item2 = actor2MediaMap.get(alternateKeys[0])!;
              matchingPairs.push([item1, item2]);
            }
          }
        });

        if (matchingPairs.length > 0) {
          // Sort by popularity of first media item
          setCommonMedia(
            matchingPairs.sort((a, b) => b[0].popularity - a[0].popularity)
          );
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
    results: Person[];
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
          (a: Person, b: Person) => (b.popularity || 0) - (a.popularity || 0)
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
