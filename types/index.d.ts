// Type for game data to insert/update in Supabase
export interface GameDbData {
  id?: number; // Optional since Supabase auto-generates this
  igdb_id: number;
  name: string;
  storyline?: string;
  summary?: string;
  slug?: string;
  first_release_date?: string | null;
  igdb_update_date?: string | null;
  total_rating?: number;
  total_rating_count?: number;
  genres?: string[] | null;
  platforms?: string[] | null;
  game_engines?: string[] | null;
  game_modes?: string[] | null;
  cover_url?: string | null;
  screenshots?: string[] | null;
  artworks?: string[] | null;
  videos?: string[] | null;
  updated_at?: string;
  publishers?: string[] | null;
  developers?: string[] | null;
  featured_comment_tags?: string[] | null;
  banner_url?: string | null;
  steam_app_id?: number | null;
  steam_all_review?: string | null;
  steam_recent_review?: string | null;
  igdb_user_rating?: number | null;
  steam_popular_tags?: string[] | null;
}

// External Game Reviews Interface
export interface ExternalGameReview {
  id?: number;
  review_id: string;
  game_id: number;
  source: string; // 'steam', 'metacritic', etc.
  content: string;
  original_published_at: string;
  created_at?: string;
  updated_at?: string;
}

// Type for IGDB game data from API
export interface IgdbGameData {
  id: number; // IGDB id
  name: string;
  storyline?: string;
  summary?: string;
  slug: string;
  first_release_date?: number;
  updated_at?: number;
  total_rating?: number;
  total_rating_count?: number;
  genres?: Array<{ name: string }>;
  platforms?: Array<{ name: string }>;
  game_engines?: Array<{ name: string }>;
  game_modes?: Array<{ name: string }>;
  cover?: { url: string };
  screenshots?: Array<{ url: string }>;
  artworks?: Array<{ url: string }>;
  videos?: Array<{ video_id: string }>;
  involved_companies?: Array<{
    publisher?: boolean;
    developer?: boolean;
    company?: { name: string };
  }>;
  rating?: number;
  steam_popular_tags?: Array<{ name: string }>;
}

// Type for IGDB OAuth token response
export interface IgdbToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Type for IGDB game response (simplified)
export interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  cover?:
    | number
    | {
        url: string;
      };
  screenshots?: { url: string }[];
  artworks?: { url: string }[];
  rating?: number;
  first_release_date?: number; // Unix timestamp
  involved_companies?: Array<{
    company: {
      name: string;
    };
    developer?: boolean;
    publisher?: boolean;
  }>;
}

// Type for average game ratings
export interface GameRating {
  story: number;
  music: number;
  graphics: number;
  gameplay: number;
  longevity: number;
}

// Search-related types
import { RecentSearchItem } from '@/utils/recent-searches';

export interface HybridSearchResult {
  supabaseGames: GameDbData[];
  igdbGames: IgdbGame[];
  totalResults: number;
}

export interface SearchState {
  inputValue: string;
  supabaseGames: GameDbData[];
  igdbGames: IgdbGame[];
  recentSearches: RecentSearchItem[];
  isLoading: boolean;
  isAddingGame: boolean;
  showSuggestions: boolean;
  isInputActive: boolean;
}

export type SuggestionItem =
  | { text: string; tag?: string }
  | GameDbData
  | RecentSearchItem
  | IgdbGame;
