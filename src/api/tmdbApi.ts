import axios from 'axios';
//import { TMDB_API_KEY } from '@env';

import { ActorSearchResult } from '../types/types';
import { MovieCredits, ActorCredits, ActorTVCredits, MovieSearchResult, TVShowSearchResult, TVShowCredits, TVShowAggregateCredits, Person } from '../types/types';



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

// New method to get comprehensive TV show cast using aggregate credits
export const getTVShowAggregateCredits = async (tvId: number): Promise<TVShowAggregateCredits> => {
  try {
    const response = await tmdbApi.get(`/tv/${tvId}/aggregate_credits`);
    return response.data;
  } catch (error) {
    console.error('Error fetching TV show aggregate credits:', error);
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
  getTVShowCast,
  getTVShowAggregateCredits // Add the new function to the exports
};