export interface Podcast {
  id: string;
  title: string;
  description: string;
  abstract: string;
  summary: string | null;
  authors: string;
  publishing_year: number;
  field_of_research: string;
  doi: string | null;
  keywords: string;
  cover_image_url: string;
  audio_url: string;
  script: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  paper_link?: string | null;
  listen_count: number;
  citation_count: number;
  likes: number;
  duration: number;
  research_fields: string[];
  likes_count: number;
  plays_count: number;
  bookmarks_count: number;
}

export type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  status: string | null;
  affiliation: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  research_gate: string | null;
  research_interests: string | null;
  banner_background: string | null;
  custom_banner_url: string | null;
  created_at: string;
  updated_at: string;
};