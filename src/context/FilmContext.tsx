import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tmdbApi, {
  Film,
  CastMember,
  MovieSearchResult,
  TVShow,
} from "../api/tmdbApi";

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  MEDIA_ITEM_1: "actor-matches:selectedMediaItem1",
  MEDIA_ITEM_2: "actor-matches:selectedMediaItem2",
  CAST_MEMBER_1: "actor-matches:selectedCastMember1",
  CAST_MEMBER_2: "actor-matches:selectedCastMember2",
};

// Define a unified MediaItem type that can be either a Film or a TVShow
export interface MediaItem {
  id: number;
  title: string; // For movies and normalized TV shows
  name?: string; // Original name for TV shows
  release_date?: string; // For movies
  first_air_date?: string; // For TV shows
  character?: string;
  popularity: number;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  media_type: "movie" | "tv"; // Explicitly track the media type
}

// Convert external types to our unified MediaItem
export const convertToMediaItem = (
  item: Film | TVShow,
  type: "movie" | "tv"
): MediaItem => {
  if (type === "movie") {
    const film = item as Film;
    return {
      id: film.id,
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
      title: tvShow.name, // Normalize name to title for consistency
      name: tvShow.name, // Keep original name
      first_air_date: tvShow.first_air_date,
      character: tvShow.character,
      popularity: tvShow.popularity,
      overview: tvShow.overview,
      poster_path: tvShow.poster_path,
      vote_average: tvShow.vote_average,
      media_type: "tv",
    };
  }
};

// Update default values to use the MediaItem type
const DEFAULT_MEDIA_1: MediaItem = {
  id: 238,
  title: "The Godfather",
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
  release_date: "1990-12-25",
  popularity: 45.897,
  overview:
    "In the midst of trying to legitimize his business dealings in 1979 New York and Italy, aging mafia don, Michael Corleone seeks forgiveness for his sins while taking a young protege under his wing.",
  poster_path: "/lm3pQ2QoQ16pextRsmnUbG2onES.jpg",
  vote_average: 7.4,
  media_type: "movie",
};

const DEFAULT_ACTOR_1: SelectedActor = {
  id: 31,
  name: "Tom Hanks",
  profile_path: "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg",
};

const DEFAULT_ACTOR_2: SelectedActor = {
  id: 192,
  name: "Morgan Freeman",
  profile_path: "/jPsLqiYGSofU4s6BjrxnefMfabb.jpg",
};

// Define interfaces
export interface CommonCastMember extends CastMember {
  characterInMedia1?: string;
  characterInMedia2?: string;
}

// Extended MediaItem interface to include character information for actors
export interface CommonMediaItem extends MediaItem {
  characterForActor1?: string;
  characterForActor2?: string;
}

// Actor interface for selection
export interface SelectedActor {
  id: number;
  name: string;
  profile_path?: string;
}

export interface Actor {
  id: number;
  name: string;
  profile_path?: string;
  known_for_department?: string;
  popularity?: number;
  known_for?: Array<{ title?: string; name?: string }>;
}

// Define the shape of our context state
interface FilmContextType {
  // Media selection
  selectedMediaItem1: MediaItem | null;
  selectedMediaItem2: MediaItem | null;
  setSelectedMediaItem1: (media: MediaItem | null) => void;
  setSelectedMediaItem2: (media: MediaItem | null) => void;

  // Cast member selection
  selectedCastMember1: SelectedActor | null;
  selectedCastMember2: SelectedActor | null;
  setSelectedCastMember1: (actor: SelectedActor | null) => void;
  setSelectedCastMember2: (actor: SelectedActor | null) => void;

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

  // Search functionality
  searchFilms: (query: string) => Promise<{
    results: Film[];
    error: string | null;
  }>;

  searchTVShows: (query: string) => Promise<{
    results: TVShow[];
    error: string | null;
  }>;

  searchActors: (query: string) => Promise<{
    results: Actor[];
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
  searchFilms: async () => ({ results: [], error: null }),
  searchTVShows: async () => ({ results: [], error: null }),
  searchActors: async () => ({ results: [], error: null }),
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
    useState<SelectedActor | null>(null);
  const [selectedCastMember2, setSelectedCastMember2Internal] =
    useState<SelectedActor | null>(null);

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

  const setSelectedCastMember1 = async (actor: SelectedActor | null) => {
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

  const setSelectedCastMember2 = async (actor: SelectedActor | null) => {
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

        // Fetch the appropriate cast data
        const castData = isTV
          ? await tmdbApi.getTVShowCast(activeMedia.id)
          : await tmdbApi.getMovieCast(activeMedia.id);

        if (castData.cast && castData.cast.length > 0) {
          setCastMembers(
            castData.cast.sort(
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
        const cast1Data = isMedia1TV
          ? await tmdbApi.getTVShowCast(selectedMediaItem1.id)
          : await tmdbApi.getMovieCast(selectedMediaItem1.id);

        const cast2Data = isMedia2TV
          ? await tmdbApi.getTVShowCast(selectedMediaItem2.id)
          : await tmdbApi.getMovieCast(selectedMediaItem2.id);

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
              const actorInMedia1 = cast1Map.get(actor.id);
              return {
                ...actor,
                characterInMedia1: actorInMedia1.character || "Unknown role",
                characterInMedia2: actor.character || "Unknown role",
              };
            });

          if (matchingActors.length > 0) {
            setCastMembers(
              matchingActors.sort(
                (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
              )
            );
          } else {
            setCastError("No common cast members found");
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

        // Process movie credits
        const movieItems: CommonMediaItem[] =
          movieCredits.cast && movieCredits.cast.length > 0
            ? movieCredits.cast
                .filter((film) => film.release_date)
                .map((film) => ({
                  ...convertToMediaItem(film, "movie"),
                  characterForActor1: actor1Id ? film.character : undefined,
                  characterForActor2: actor2Id ? film.character : undefined,
                }))
            : [];

        // Process TV credits
        const tvItems: CommonMediaItem[] =
          tvCredits.cast && tvCredits.cast.length > 0
            ? tvCredits.cast
                .filter((show) => show.first_air_date)
                .map((show) => ({
                  ...convertToMediaItem(show, "tv"),
                  characterForActor1: actor1Id ? show.character : undefined,
                  characterForActor2: actor2Id ? show.character : undefined,
                }))
            : [];

        // Combine and sort by popularity
        const combinedMedia = [...movieItems, ...tvItems].sort(
          (a, b) => b.popularity - a.popularity
        );

        if (combinedMedia.length > 0) {
          setCommonMedia(combinedMedia);
        } else {
          setMediaError(`No media found for ${selectedActorName}`);
        }
      } catch (err) {
        setMediaError("Error fetching actor's filmography");
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
        const actor1MediaItems: Map<number, CommonMediaItem> = new Map();

        // Add movies from actor 1
        if (actor1MovieCredits.cast && actor1MovieCredits.cast.length > 0) {
          actor1MovieCredits.cast.forEach((film) => {
            if (film.release_date) {
              actor1MediaItems.set(film.id, {
                ...convertToMediaItem(film, "movie"),
                characterForActor1: film.character || "Unknown role",
              });
            }
          });
        }

        // Add TV shows from actor 1
        if (actor1TVCredits.cast && actor1TVCredits.cast.length > 0) {
          actor1TVCredits.cast.forEach((show) => {
            if (show.first_air_date) {
              actor1MediaItems.set(show.id, {
                ...convertToMediaItem(show, "tv"),
                characterForActor1: show.character || "Unknown role",
              });
            }
          });
        }

        // Find matching movies from actor 2
        const matchingMovies: CommonMediaItem[] = [];
        if (actor2MovieCredits.cast && actor2MovieCredits.cast.length > 0) {
          actor2MovieCredits.cast.forEach((film) => {
            if (film.release_date && actor1MediaItems.has(film.id)) {
              const mediaItem = actor1MediaItems.get(film.id)!;
              matchingMovies.push({
                ...mediaItem,
                characterForActor2: film.character || "Unknown role",
              });
            }
          });
        }

        // Find matching TV shows from actor 2
        const matchingTVShows: CommonMediaItem[] = [];
        if (actor2TVCredits.cast && actor2TVCredits.cast.length > 0) {
          actor2TVCredits.cast.forEach((show) => {
            if (show.first_air_date && actor1MediaItems.has(show.id)) {
              const mediaItem = actor1MediaItems.get(show.id)!;
              matchingTVShows.push({
                ...mediaItem,
                characterForActor2: show.character || "Unknown role",
              });
            }
          });
        }

        // Combine all matching media and sort by popularity
        const allMatchingMedia = [...matchingMovies, ...matchingTVShows];

        // Deduplicate based on id and media_type
        const uniqueMedia = Array.from(
          new Map(
            allMatchingMedia.map((item) => [
              `${item.media_type}-${item.id}`,
              item,
            ])
          ).values()
        );

        // Sort by popularity
        const sortedMedia = uniqueMedia.sort(
          (a, b) => b.popularity - a.popularity
        );

        if (sortedMedia.length > 0) {
          setCommonMedia(sortedMedia);
        } else {
          setMediaError(
            `${actor1Name} and ${actor2Name} haven't appeared in any movies or TV shows together`
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
  const searchActors = async (
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
    searchFilms,
    searchTVShows,
    searchActors,
  };

  // Show a loading state if we're still initializing from AsyncStorage
  if (isLoading) {
    return null; // Or a loading indicator if you prefer
  }

  return <FilmContext.Provider value={value}>{children}</FilmContext.Provider>;
};
