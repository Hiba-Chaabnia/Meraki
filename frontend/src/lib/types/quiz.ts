export interface HobbyMatchRow {
  hobby_id: string;
  match_percentage: number;
  match_tags: string[];
  reasoning: string;
  hobbies: {
    id: string;
    slug: string;
    name: string;
    [key: string]: unknown;
  };
}

export interface MatchCard {
  slug: string;
  name: string;
  tagline: string;
  matchPercent: number;
  color: string;
  lightColor: string;
  tags: string[];
}
