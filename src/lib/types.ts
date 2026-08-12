export type Visibility = "public" | "private";
export type MemoryStatus = "pending" | "published" | "blocked" | "removed";

export type StoryIconType =
  | "family"
  | "love"
  | "friendship"
  | "nostalgia"
  | "grief"
  | "solitude"
  | "journey"
  | "growth"
  | "heart"
  | "sparkle"
  | "coffee"
  | "leaf"
  | "cloud"
  | "compass"
  | "moon"
  | "flame";

export interface Memory {
  id: string;
  user_id: string | null;
  anonymous_id: string;
  title?: string | undefined;
  content: string;
  latitude: number;
  longitude: number;
  location_name: string;
  visibility: Visibility;
  status: MemoryStatus;
  created_at: string;
  updated_at: string;
  lang?: "bn" | "en" | undefined;
  icon?: StoryIconType | undefined;
}

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
}
