// Base interfaces for movies and TV shows
export interface Film {
  id: number;
  title: string;
  release_date?: string;
  character?: string;
  popularity: number;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  job?: string;
  department?: string;
}

export interface TVShow {
  id: number;
  name: string;
  first_air_date?: string;
  episode_count?: number;
  character?: string;
  popularity: number;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  job?: string;
  department?: string;
}

// Base interface for common media properties
export interface BaseMediaItem {
  id: number;
  name: string;
  popularity: number;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  character?: string;
  job?: string;
  department?: string;
  role_type?: "cast" | "crew";
}

// Movie-specific media item
export interface MovieMediaItem extends BaseMediaItem {
  media_type: "movie";
  title: string;
  release_date?: string;
}

// TV-specific media item
export interface TVMediaItem extends BaseMediaItem {
  media_type: "tv";
  title?: string; // Optional for TV shows, usually use name
  first_air_date?: string;
  episode_count?: number;
}

// Union type for MediaItem
export type MediaItem = MovieMediaItem | TVMediaItem;

// Enhanced MediaItem type for storing individual role information per cast member
export interface EnhancedMediaItem extends BaseMediaItem {
  media_type: "movie" | "tv";
  title?: string;
  release_date?: string;
  first_air_date?: string;
  episode_count?: number;
  castMemberRoles?: {
    [personId: number]: {
      character?: string;
      job?: string;
      department?: string;
    };
  };
  roles?: ("cast" | "crew")[];
}

// Person interface
export interface Person {
  id: number;
  name: string;
  profile_path?: string;
  character?: string;
  known_for_department?: string;
  popularity?: number;
  gender?: number;
  known_for?: Array<{
    id: number;
    title?: string;
    name?: string;
    media_type: string;
  }>;
  roles: ("cast" | "crew")[];
  jobs?: string[];
  departments?: string[];
  // Additional properties for enhanced person data (used in comparison view)
  allMediaCharacters?: string[];
  allMediaJobs?: string[];
  allMediaDepartments?: string[];
}

// API Response Types
export interface ActorSearchResult {
  page: number;
  results: Person[];
  total_pages: number;
  total_results: number;
}

export interface MovieCredits {
  id: number;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path?: string;
    popularity?: number;
    gender?: number;
    order?: number;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path?: string;
    popularity?: number;
    gender?: number;
  }>;
}

export interface ActorCredits {
  id: number;
  cast: Film[];
  crew: Film[];
}

export interface ActorTVCredits {
  id: number;
  cast: TVShow[];
  crew: TVShow[];
}

export interface MovieSearchResult {
  page: number;
  results: Film[];
  total_pages: number;
  total_results: number;
}

export interface TVShowSearchResult {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
}

export interface TVShowCredits {
  id: number;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path?: string;
    popularity?: number;
    gender?: number;
    order?: number;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path?: string;
    popularity?: number;
    gender?: number;
  }>;
}

export interface TVShowAggregateCredits {
  id: number;
  cast: Array<{
    id: number;
    name: string;
    roles?: Array<{
      character: string;
      episode_count: number;
    }>;
    total_episode_count?: number;
    profile_path?: string;
    popularity?: number;
    gender?: number;
    order?: number;
  }>;
  crew: Array<{
    id: number;
    name: string;
    jobs?: Array<{
      job: string;
      episode_count: number;
    }>;
    department: string;
    total_episode_count?: number;
    profile_path?: string;
    popularity?: number;
    gender?: number;
  }>;
}
