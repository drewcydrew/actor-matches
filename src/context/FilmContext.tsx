import React, { createContext, useState, ReactNode, useContext } from "react";
import { Film } from "../api/tmdbApi";

// Define the shape of our context state
interface FilmContextType {
  selectedFilm1: Film | null;
  selectedFilm2: Film | null;
  setSelectedFilm1: (film: Film | null) => void;
  setSelectedFilm2: (film: Film | null) => void;
}

// Create the context with default values
const FilmContext = createContext<FilmContextType>({
  selectedFilm1: null,
  selectedFilm2: null,
  setSelectedFilm1: () => {},
  setSelectedFilm2: () => {},
});

// Custom hook to use the film context
export const useFilmContext = () => useContext(FilmContext);

// Props for the provider component
interface FilmProviderProps {
  children: ReactNode;
}

// Context provider component
export const FilmProvider = ({ children }: FilmProviderProps) => {
  const [selectedFilm1, setSelectedFilm1] = useState<Film | null>(null);
  const [selectedFilm2, setSelectedFilm2] = useState<Film | null>(null);

  // Value object that will be passed to consumers
  const value = {
    selectedFilm1,
    selectedFilm2,
    setSelectedFilm1,
    setSelectedFilm2,
  };

  return <FilmContext.Provider value={value}>{children}</FilmContext.Provider>;
};
