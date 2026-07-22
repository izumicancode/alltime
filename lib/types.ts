export interface User {
  id: string;
  username: string;
  avatar_color: string;
  avatar_gradient_from: string;
  avatar_gradient_to: string;
  avatar_url?: string | null;
  created_at: string;
}

export type Category =
  | 'Memes' | 'Questions' | 'Programming' | 'Gaming'
  | 'Art' | 'Music' | 'Stories' | 'Random';

export interface Post {
  id: string;
  user_id: string;
  username: string;
  content: string;
  category: string | null;
  media_url: string | null;
  media_type: string | null;
  file_name: string | null;
  created_at: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  bookmark_count: number;
}

export interface FeedPost extends Post {
  score: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  like_count: number;
  children?: Comment[];
}

export type FeedTab =
  | 'trending' | 'latest' | 'random'
  | 'top-today' | 'top-week' | 'top-month';
