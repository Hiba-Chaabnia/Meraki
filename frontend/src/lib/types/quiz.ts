export interface HobbyMatchRow {
  hobby_slug: string;
  match_percentage: number;
  match_tags: string[];
  reasoning: string;
}

export interface MatchCard {
  slug: string;
  name: string;
  tagline: string;
  matchPercent: number;
  tags: string[];
}
