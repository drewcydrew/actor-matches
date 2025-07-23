export interface Person {
  id: number;
  name: string;
  profile_path?: string;
  gender?: number;
  popularity?: number;
  role_type?: "cast" | "crew"; // Discriminator field to identify type
  known_for_department?: string; // Optional field for known for department
  known_for?: Array<{ title?: string; name?: string }>;

  // Cast-specific properties (optional for crew)
  character?: string;
  //order?: number;

  // Crew-specific properties (optional for cast)
  jobs?: string[];
  departments?: string[];
}

export interface BaseMediaItem {
  id: number;
  name: string;
  character?: string;
  popularity: number;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  media_type: "movie" | "tv";
  job?: string;
  department?: string;
  role_type?: "cast" | "crew"; // Add this property to support the crew/cast badges
}

export interface Film extends BaseMediaItem {
  media_type: "movie";
  title: string;
  release_date?: string;
}

export interface TVShow extends BaseMediaItem {
  media_type: "tv";
  //name: string;
  first_air_date?: string;
  episode_count?: number;
}

export type MediaItem = Film | TVShow;

export interface TVShowCredits {
  id: number;
  cast: CastMember[];
  crew: CrewMember[]; // Add crew property
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
    known_for?: Array<{ title?: string; name?: string }>;
  }[];
}

export interface TVShowSearchResult {
  results: TVShow[];
  total_results: number;
  total_pages: number;
}

export interface ActorCredits {
  cast: Film[];
  crew: Film[];
}

export interface ActorTVCredits {
  cast: TVShow[];
  crew: Film[];
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

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path?: string;
  gender?: number;
  popularity?: number;
}

export interface MovieCredits {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}

// New interface for aggregate TV credits
export interface TVShowAggregateCredits {
  id: number;
  cast: {
    id: number;
    name: string;
    roles: {
      character: string;
      episode_count: number;
    }[];
    total_episode_count: number;
    order: number;
    profile_path?: string;
    gender?: number;
    popularity?: number;
  }[];
}
