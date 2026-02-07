// Meraki TypeScript Types

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  time_available: 'minimal' | 'moderate' | 'abundant';
  budget: 'free' | 'low' | 'medium' | 'high';
  learning_style: 'visual' | 'hands-on' | 'reading' | 'video';
}

export interface Hobby {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  time_commitment: 'quick' | 'moderate' | 'intensive';
  cost_range: 'free' | 'low' | 'medium' | 'high';
  image_url: string;
}

export interface UserHobby {
  id: string;
  user_id: string;
  hobby_id: string;
  status: 'sampling' | 'active' | 'paused' | 'completed';
  started_at: Date;
  current_streak: number;
  total_sessions: number;
}

export interface PracticeSession {
  id: string;
  user_hobby_id: string;
  created_at: Date;
  image_url?: string;
  ai_feedback?: string;
  emotional_rating: EmotionalRating;
  challenge_id?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hobby_id: string;
  skills_targeted: string[];
  estimated_time: number; // in minutes
}

export type EmotionalRating = 'loved_it' | 'satisfying' | 'okay' | 'frustrated' | 'discouraged';

export interface HobbyCategory {
  id: string;
  name: string;
  description: string;
  hobbies: string[];
  image_url: string;
}
