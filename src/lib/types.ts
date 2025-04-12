export interface Podcast {
  id: string;
  title: string;
  abstract: string;
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
}

export interface Profile {
  id: string;
  name: string | null;
  affiliation: string | null;
  research_interests: string | null;
  avatar_url: string | null;
  updated_at: string;
}