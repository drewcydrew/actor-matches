import axios from 'axios';
import { TMDB_API_KEY } from '@env';


// Define interfaces for type safety
export interface Film {
  id: number;
  title: string;
  release_date?: string;
  character?: string;
  popularity: number;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
}

export interface TVShow {
  id: number;
  name: string;          // TV shows use "name" instead of "title"
  first_air_date?: string; // TV shows use "first_air_date" instead of "release_date"
  character?: string;
  popularity: number;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  episode_count?: number; // Specific to TV shows
}

export interface TVShowCredits {
  id: number;
  cast: CastMember[];
}

export type MediaItem = (Film | TVShow) & { media_type: 'movie' | 'tv' };

export interface MovieSearchResult {
  results: Film[];
  total_results: number;
  total_pages: number;
}

export interface ActorSearchResult {
  results: {
    id: number;
    name: string;
    profile_path?: string;
    known_for_department?: string;
    popularity?: number;
    known_for?: Array<{title?: string; name?: string}>;
  }[];
}

export interface TVShowSearchResult {
  results: TVShow[];
  total_results: number;
  total_pages: number;
}

export interface ActorCredits {
  cast: Film[];
}

export interface ActorTVCredits {
  cast: TVShow[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string;
  order: number;
  gender?: number;
  popularity?: number;
}

export interface MovieCredits {
  id: number;
  cast: CastMember[];
}

// API Key configuration
const API_KEY = TMDB_API_KEY || ""; 

// Create axios instance with common configuration
const tmdbApi = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: API_KEY
  }
});

// API methods
export const searchActor = async (name: string): Promise<ActorSearchResult> => {
  try {
    const response = await tmdbApi.get('/search/person', {
      params: { query: name }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching for actor:', error);
    throw error;
  }
};

export const getMovieCast = async (movieId: number): Promise<MovieCredits> => {
  try {
    const response = await tmdbApi.get(`/movie/${movieId}/credits`);
    return response.data;
  } catch (error) {
    console.error('Error fetching movie cast:', error);
    throw error;
  }
};

export const getActorMovieCredits = async (actorId: number): Promise<ActorCredits> => {
  try {
    const response = await tmdbApi.get(`/person/${actorId}/movie_credits`);
    return response.data;
  } catch (error) {
    console.error('Error fetching actor credits:', error);
    throw error;
  }
};

// New method to get actor's TV credits
export const getActorTVCredits = async (actorId: number): Promise<ActorTVCredits> => {
  try {
    const response = await tmdbApi.get(`/person/${actorId}/tv_credits`);
    return response.data;
  } catch (error) {
    console.error('Error fetching actor TV credits:', error);
    throw error;
  }
};

// New method to search movies by title
export const searchMovies = async (title: string): Promise<MovieSearchResult> => {
  try {
    const response = await tmdbApi.get('/search/movie', {
      params: { query: title }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching for movies:', error);
    throw error;
  }
};

export const searchTVShows = async (title: string): Promise<TVShowSearchResult> => {
  try {
    const response = await tmdbApi.get('/search/tv', {
      params: { query: title }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching for TV shows:', error);
    throw error;
  }
};

export const getTVShowCast = async (tvId: number): Promise<TVShowCredits> => {
  try {
    const response = await tmdbApi.get(`/tv/${tvId}/credits`);
    return response.data;
  } catch (error) {
    console.error('Error fetching TV show cast:', error);
    throw error;
  }
};

export default {
  searchActor,
  getActorMovieCredits,
  getActorTVCredits,
  searchMovies,
  getMovieCast,
  searchTVShows,
  getTVShowCast
};