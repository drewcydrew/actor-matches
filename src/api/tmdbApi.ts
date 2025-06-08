import axios from 'axios';

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

export interface ActorCredits {
  cast: Film[];
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
const API_KEY = "eb1219440f00fcf43d3fc4d3fa33928b";

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

export default {
  searchActor,
  getActorMovieCredits,
  searchMovies,
  getMovieCast
};