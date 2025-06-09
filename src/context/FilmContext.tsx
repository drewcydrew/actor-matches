import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import tmdbApi, { Film, CastMember, MovieSearchResult } from "../api/tmdbApi";

const DEFAULT_FILM_1: Film = {
  id: 238,
  title: "The Godfather",
  release_date: "1972-03-14",
  popularity: 92.179,
  overview:
    "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps in to take care of the would-be killers, launching a campaign of bloody revenge.",
  poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  vote_average: 8.7,
};

const DEFAULT_FILM_2: Film = {
  id: 242,
  title: "The Godfather Part III",
  release_date: "1990-12-25",
  popularity: 45.897,
  overview:
    "In the midst of trying to legitimize his business dealings in 1979 New York and Italy, aging mafia don, Michael Corleone seeks forgiveness for his sins while taking a young protege under his wing.",
  poster_path: "/lm3pQ2QoQ16pextRsmnUbG2onES.jpg",
  vote_average: 7.4,
};

const DEFAULT_ACTOR_1: SelectedActor = {
  id: 31,
  name: "Tom Hanks",
  profile_path: "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg",
};

const DEFAULT_ACTOR_2: SelectedActor = {
  id: 192,
  name: "Morgan Freeman",
  profile_path: "/oIciQWrRRqsQGWD3MKjcLCQTdAP.jpg",
};

// Define interfaces
export interface CommonCastMember extends CastMember {
  characterInFilm1?: string;
  characterInFilm2?: string;
}

// Extended Film interface to include character information for actors
export interface CommonFilm extends Film {
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
  // Film selection
  selectedFilm1: Film | null;
  selectedFilm2: Film | null;
  setSelectedFilm1: (film: Film | null) => void;
  setSelectedFilm2: (film: Film | null) => void;

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
  commonFilms: CommonFilm[];
  filmsLoading: boolean;
  filmsError: string;

  // Method to manually refresh cast data if needed
  refreshCastData: () => Promise<void>;

  // Method to get filmography for actors
  getActorFilmography: (
    actor1Id?: number,
    actor2Id?: number,
    actor1Name?: string,
    actor2Name?: string
  ) => Promise<void>;

  // Film search functionality
  searchFilms: (query: string) => Promise<{
    results: Film[];
    error: string | null;
  }>;

  // Actor search functionality
  searchActors: (query: string) => Promise<{
    results: Actor[];
    error: string | null;
  }>;
}

// Create the context with default values
const FilmContext = createContext<FilmContextType>({
  selectedFilm1: null,
  selectedFilm2: null,
  setSelectedFilm1: () => {},
  setSelectedFilm2: () => {},
  selectedCastMember1: null,
  selectedCastMember2: null,
  setSelectedCastMember1: () => {},
  setSelectedCastMember2: () => {},
  castMembers: [],
  castLoading: false,
  castError: "",
  displayMode: "comparison",
  commonFilms: [],
  filmsLoading: false,
  filmsError: "",
  refreshCastData: async () => {},
  getActorFilmography: async () => {},
  searchFilms: async () => ({ results: [], error: null }),
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
  // Film selection state
  const [selectedFilm1, setSelectedFilm1] = useState<Film | null>(
    DEFAULT_FILM_1
  );
  const [selectedFilm2, setSelectedFilm2] = useState<Film | null>(
    DEFAULT_FILM_2
  );

  // Actor selection state
  const [selectedCastMember1, setSelectedCastMember1] =
    useState<SelectedActor | null>(DEFAULT_ACTOR_1);
  const [selectedCastMember2, setSelectedCastMember2] =
    useState<SelectedActor | null>(DEFAULT_ACTOR_2);

  // Cast data state
  const [castMembers, setCastMembers] = useState<CommonCastMember[]>([]);
  const [castLoading, setCastLoading] = useState<boolean>(false);
  const [castError, setCastError] = useState<string>("");
  const [displayMode, setDisplayMode] = useState<"single" | "comparison">(
    "comparison"
  );

  // Filmography data state
  const [commonFilms, setCommonFilms] = useState<CommonFilm[]>([]);
  const [filmsLoading, setFilmsLoading] = useState<boolean>(false);
  const [filmsError, setFilmsError] = useState<string>("");

  // Fetch cast data whenever selected films change
  useEffect(() => {
    fetchCastData();
  }, [selectedFilm1, selectedFilm2]);

  // Fetch actor filmography whenever selected actors change
  useEffect(() => {
    if (selectedCastMember1 || selectedCastMember2) {
      getActorFilmography(
        selectedCastMember1?.id,
        selectedCastMember2?.id,
        selectedCastMember1?.name,
        selectedCastMember2?.name
      );
    }
  }, [selectedCastMember1, selectedCastMember2]);

  // Function to get actor filmography
  const getActorFilmography = async (
    actor1Id?: number,
    actor2Id?: number,
    actor1Name: string = "First actor",
    actor2Name: string = "Second actor"
  ) => {
    // Reset state
    setCommonFilms([]);
    setFilmsError("");

    // Case 1: No actors selected
    if (!actor1Id && !actor2Id) {
      return;
    }

    // Case 2: Only one actor selected - show their films
    if ((actor1Id && !actor2Id) || (!actor1Id && actor2Id)) {
      const selectedActorId = actor1Id || actor2Id;
      const selectedActorName = actor1Id ? actor1Name : actor2Name;

      if (!selectedActorId) return; // TypeScript safety

      setFilmsLoading(true);

      try {
        const creditsData = await tmdbApi.getActorMovieCredits(selectedActorId);

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
          setFilmsError(`No films found for ${selectedActorName}`);
        }
      } catch (err) {
        setFilmsError("Error fetching actor's filmography");
        console.error(err);
      } finally {
        setFilmsLoading(false);
      }
      return;
    }

    // Case 3: Both actors selected - find common films
    if (actor1Id && actor2Id) {
      setFilmsLoading(true);

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
            setFilmsError(
              `${actor1Name} and ${actor2Name} haven't appeared in any films together`
            );
          }
        } else {
          setFilmsError("Filmography not available for one or both actors");
        }
      } catch (err) {
        setFilmsError("Error fetching filmography information");
        console.error(err);
      } finally {
        setFilmsLoading(false);
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

  // Function to fetch cast data based on selected films
  const fetchCastData = async () => {
    // Reset state
    setCastMembers([]);
    setCastError("");

    // Case 1: No films selected
    if (!selectedFilm1 && !selectedFilm2) {
      setDisplayMode("comparison");
      return;
    }

    // Case 2: Only one film selected
    if (
      (selectedFilm1 && !selectedFilm2) ||
      (!selectedFilm1 && selectedFilm2)
    ) {
      setDisplayMode("single");
      const activeFilm = selectedFilm1 || selectedFilm2;

      if (!activeFilm) return; // TypeScript safety

      setCastLoading(true);

      try {
        const castData = await tmdbApi.getMovieCast(activeFilm.id);

        if (castData.cast && castData.cast.length > 0) {
          setCastMembers(
            castData.cast.sort(
              (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
            )
          );
        } else {
          setCastError("No cast information available for this film");
        }
      } catch (err) {
        setCastError("Error fetching cast information");
        console.error(err);
      } finally {
        setCastLoading(false);
      }
      return;
    }

    // Case 3: Both films selected - find common cast
    setDisplayMode("comparison");

    if (selectedFilm1 && selectedFilm2) {
      setCastLoading(true);

      try {
        // Fetch cast for both films
        const cast1Data = await tmdbApi.getMovieCast(selectedFilm1.id);
        const cast2Data = await tmdbApi.getMovieCast(selectedFilm2.id);

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
              const actorInFilm1 = cast1Map.get(actor.id);
              return {
                ...actor,
                characterInFilm1: actorInFilm1.character || "Unknown role",
                characterInFilm2: actor.character || "Unknown role",
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
          setCastError("Cast information not available for one or both films");
        }
      } catch (err) {
        setCastError("Error fetching cast information");
        console.error(err);
      } finally {
        setCastLoading(false);
      }
    }
  };

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
    selectedFilm1,
    selectedFilm2,
    setSelectedFilm1,
    setSelectedFilm2,
    selectedCastMember1,
    selectedCastMember2,
    setSelectedCastMember1,
    setSelectedCastMember2,
    castMembers,
    castLoading,
    castError,
    displayMode,
    commonFilms,
    filmsLoading,
    filmsError,
    refreshCastData: fetchCastData,
    getActorFilmography,
    searchFilms,
    searchActors,
  };

  return <FilmContext.Provider value={value}>{children}</FilmContext.Provider>;
};
