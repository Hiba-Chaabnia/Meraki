export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          bio: string;
          location: string;
          pronouns: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string;
          location?: string;
          pronouns?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string;
          location?: string;
          pronouns?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          email_notifications: boolean;
          push_notifications: boolean;
          streak_reminders: boolean;
          challenge_alerts: boolean;
          weekly_digest: boolean;
          public_profile: boolean;
          updated_at: string;
        };
        Insert: {
          id: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          streak_reminders?: boolean;
          challenge_alerts?: boolean;
          weekly_digest?: boolean;
          public_profile?: boolean;
          updated_at?: string;
        };
        Update: {
          email_notifications?: boolean;
          push_notifications?: boolean;
          streak_reminders?: boolean;
          challenge_alerts?: boolean;
          weekly_digest?: boolean;
          public_profile?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      hobby_categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          image_url?: string | null;
        };
        Relationships: [];
      };
      hobbies: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category_id: string | null;
          description: string;
          difficulty_level: "beginner" | "intermediate" | "advanced";
          time_commitment: "quick" | "moderate" | "intensive";
          cost_range: "free" | "low" | "medium" | "high";
          color: string;
          light_color: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category_id?: string | null;
          description?: string;
          difficulty_level?: "beginner" | "intermediate" | "advanced";
          time_commitment?: "quick" | "moderate" | "intensive";
          cost_range?: "free" | "low" | "medium" | "high";
          color?: string;
          light_color?: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          category_id?: string | null;
          description?: string;
          difficulty_level?: "beginner" | "intermediate" | "advanced";
          time_commitment?: "quick" | "moderate" | "intensive";
          cost_range?: "free" | "low" | "medium" | "high";
          color?: string;
          light_color?: string;
          image_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hobbies_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "hobby_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_hobbies: {
        Row: {
          id: string;
          user_id: string;
          hobby_id: string;
          status: "sampling" | "active" | "paused" | "completed";
          started_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hobby_id: string;
          status?: "sampling" | "active" | "paused" | "completed";
          started_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "sampling" | "active" | "paused" | "completed";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_hobbies_hobby_id_fkey";
            columns: ["hobby_id"];
            isOneToOne: false;
            referencedRelation: "hobbies";
            referencedColumns: ["id"];
          },
        ];
      };
      challenges: {
        Row: {
          id: string;
          hobby_id: string;
          title: string;
          description: string;
          why_this_challenge: string;
          skills: string[];
          difficulty: "easy" | "medium" | "hard" | "stretch";
          estimated_time: string;
          tips: string[];
          what_youll_learn: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          hobby_id: string;
          title: string;
          description: string;
          why_this_challenge?: string;
          skills?: string[];
          difficulty?: "easy" | "medium" | "hard" | "stretch";
          estimated_time?: string;
          tips?: string[];
          what_youll_learn?: string[];
          created_at?: string;
        };
        Update: {
          hobby_id?: string;
          title?: string;
          description?: string;
          why_this_challenge?: string;
          skills?: string[];
          difficulty?: "easy" | "medium" | "hard" | "stretch";
          estimated_time?: string;
          tips?: string[];
          what_youll_learn?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "challenges_hobby_id_fkey";
            columns: ["hobby_id"];
            isOneToOne: false;
            referencedRelation: "hobbies";
            referencedColumns: ["id"];
          },
        ];
      };
      user_challenges: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          status: "active" | "upcoming" | "completed" | "skipped";
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          status?: "active" | "upcoming" | "completed" | "skipped";
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          status?: "active" | "upcoming" | "completed" | "skipped";
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_sessions: {
        Row: {
          id: string;
          user_id: string;
          user_hobby_id: string;
          user_challenge_id: string | null;
          session_type: "practice" | "thought";
          duration: number;
          mood: "loved" | "good" | "okay" | "frustrated" | "discouraged" | null;
          notes: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_hobby_id: string;
          user_challenge_id?: string | null;
          session_type?: "practice" | "thought";
          duration?: number;
          mood?: "loved" | "good" | "okay" | "frustrated" | "discouraged" | null;
          notes?: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          user_challenge_id?: string | null;
          session_type?: "practice" | "thought";
          duration?: number;
          mood?: "loved" | "good" | "okay" | "frustrated" | "discouraged" | null;
          notes?: string;
          image_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_hobby_id_fkey";
            columns: ["user_hobby_id"];
            isOneToOne: false;
            referencedRelation: "user_hobbies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_sessions_user_challenge_id_fkey";
            columns: ["user_challenge_id"];
            isOneToOne: false;
            referencedRelation: "user_challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_feedback: {
        Row: {
          id: string;
          session_id: string;
          observations: string[];
          growth: string[];
          suggestions: string[];
          celebration: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          observations?: string[];
          growth?: string[];
          suggestions?: string[];
          celebration?: string;
          created_at?: string;
        };
        Update: {
          observations?: string[];
          growth?: string[];
          suggestions?: string[];
          celebration?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_feedback_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "practice_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      milestones: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          icon: string;
          criteria: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description: string;
          icon: string;
          criteria?: Json;
          created_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          description?: string;
          icon?: string;
          criteria?: Json;
        };
        Relationships: [];
      };
      user_milestones: {
        Row: {
          id: string;
          user_id: string;
          milestone_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          milestone_id: string;
          earned_at?: string;
        };
        Update: {
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_milestones_milestone_id_fkey";
            columns: ["milestone_id"];
            isOneToOne: false;
            referencedRelation: "milestones";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_responses: {
        Row: {
          id: string;
          user_id: string;
          question_id: number;
          answer: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: number;
          answer: Json;
          created_at?: string;
        };
        Update: {
          answer?: Json;
        };
        Relationships: [];
      };
      hobby_matches: {
        Row: {
          id: string;
          user_id: string;
          hobby_id: string;
          match_percentage: number;
          match_tags: string[];
          reasoning: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hobby_id: string;
          match_percentage: number;
          match_tags?: string[];
          reasoning?: string;
          created_at?: string;
        };
        Update: {
          match_percentage?: number;
          match_tags?: string[];
          reasoning?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hobby_matches_hobby_id_fkey";
            columns: ["hobby_id"];
            isOneToOne: false;
            referencedRelation: "hobbies";
            referencedColumns: ["id"];
          },
        ];
      };
      sampling_results: {
        Row: {
          id: string;
          user_id: string;
          hobby_slug: string;
          result: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hobby_slug: string;
          result: Json;
          created_at?: string;
        };
        Update: {
          hobby_slug?: string;
          result?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      local_experience_results: {
        Row: {
          id: string;
          user_id: string;
          hobby_slug: string;
          location: string;
          result: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hobby_slug: string;
          location: string;
          result: Json;
          created_at?: string;
        };
        Update: {
          hobby_slug?: string;
          location?: string;
          result?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_streak: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_user_stats: {
        Args: { p_user_id: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
