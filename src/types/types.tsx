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
  order?: number;

  // Crew-specific properties (optional for cast)
  job?: string;
  department?: string;
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

export interface CommonCastMember extends CastMember {
  characterInMedia1?: string;
  characterInMedia2?: string;
  role_type?: "cast" | "crew"; // Optional role type for crew members
  department?: string; // For crew members, to specify their department
}

// Extended MediaItem interface to include character information for actors
export interface CommonMediaItem {
  // Base MediaItem properties we need
  id: number;
  title?: string; // Make title optional since TV shows use name
  name?: string; // Keep name optional for movies
  media_type: "movie" | "tv";
  popularity: number;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  character?: string;
  release_date?: string;
  first_air_date?: string;
  episode_count?: number;

  // Additional properties for character/role information
  characterForActor1?: string;
  characterForActor2?: string;
  roleType?: "cast" | "crew";
  role1Type?: "cast" | "crew";
  role2Type?: "cast" | "crew";
  department?: string;
  department1?: string;
  department2?: string;
  job?: string;
  job1?: string;
  job2?: string;
}

export interface Actor {
  id: number;
  name: string;
  profile_path?: string;
  known_for_department?: string;
  popularity?: number;
  known_for?: Array<{ title?: string; name?: string }>;
  role_type?: "cast" | "crew"; // Optional role type for actors
}
