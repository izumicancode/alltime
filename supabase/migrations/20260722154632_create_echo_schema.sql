/*
# Echo - Anonymous Community Platform Schema

Creates the full database for an anonymous social platform (no email/password auth).
Users pick a username, get a generated UUID, and post/comment/like anonymously.

## 1. New Tables
- `users` — anonymous user profiles (uuid id, username, avatar colors, join date)
- `posts` — user posts with text, optional media, category, and denormalized counters
- `comments` — comments on posts, supports nesting via parent_id
- `likes` — post likes (unique per user+post)
- `dislikes` — post dislikes (unique per user+post)
- `bookmarks` — saved posts (unique per user+post)
- `comment_likes` — likes on comments (unique per user+comment)

## 2. Counters & Triggers
- Triggers maintain like_count, dislike_count, comment_count, bookmark_count on posts
- Trigger maintains like_count on comments
- These avoid expensive COUNT queries in the feed

## 3. Feed Ranking
- `get_feed(tab, limit, offset)` RPC supports 6 tabs:
  - trending: Score = likes*3 - dislikes*2 + random boost - age penalty
  - latest: by created_at desc
  - random: by random()
  - top-today / top-week / top-month: by like_count desc within time window

## 4. Storage
- `media` bucket for post images/videos/files (public read, anon write)

## 5. Security (RLS)
- This is a NO-AUTH anonymous app (no Supabase sign-in screen).
- All policies use `TO anon, authenticated` because the frontend operates with the anon key.
- Data is intentionally public/shared — posts, comments, and interactions are visible to everyone.
- `USING (true)` / `WITH CHECK (true)` is correct here because the platform is anonymous and public by design.
*/

-- ============ USERS ============
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  avatar_color text NOT NULL DEFAULT '#3b82f6',
  avatar_gradient_from text NOT NULL DEFAULT '#3b82f6',
  avatar_gradient_to text NOT NULL DEFAULT '#06b6d4',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (lower(username));
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

-- ============ POSTS ============
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username text NOT NULL,
  content text NOT NULL,
  category text,
  media_url text,
  media_type text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  like_count integer NOT NULL DEFAULT 0,
  dislike_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  bookmark_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts (like_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING gin (to_tsvector('english', content));

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_posts" ON posts;
CREATE POLICY "anon_select_posts" ON posts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_posts" ON posts;
CREATE POLICY "anon_insert_posts" ON posts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_posts" ON posts;
CREATE POLICY "anon_update_posts" ON posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_posts" ON posts;
CREATE POLICY "anon_delete_posts" ON posts FOR DELETE TO anon, authenticated USING (true);

-- ============ COMMENTS ============
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  like_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_comments" ON comments;
CREATE POLICY "anon_select_comments" ON comments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
CREATE POLICY "anon_insert_comments" ON comments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_comments" ON comments;
CREATE POLICY "anon_update_comments" ON comments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "anon_delete_comments" ON comments FOR DELETE TO anon, authenticated USING (true);

-- ============ LIKES ============
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_likes" ON likes;
CREATE POLICY "anon_select_likes" ON likes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_likes" ON likes;
CREATE POLICY "anon_insert_likes" ON likes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_likes" ON likes;
CREATE POLICY "anon_delete_likes" ON likes FOR DELETE TO anon, authenticated USING (true);

-- ============ DISLIKES ============
CREATE TABLE IF NOT EXISTS dislikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dislikes_post_id ON dislikes (post_id);
CREATE INDEX IF NOT EXISTS idx_dislikes_user_id ON dislikes (user_id);

ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_dislikes" ON dislikes;
CREATE POLICY "anon_select_dislikes" ON dislikes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dislikes" ON dislikes;
CREATE POLICY "anon_insert_dislikes" ON dislikes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dislikes" ON dislikes;
CREATE POLICY "anon_delete_dislikes" ON dislikes FOR DELETE TO anon, authenticated USING (true);

-- ============ BOOKMARKS ============
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks (post_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bookmarks" ON bookmarks;
CREATE POLICY "anon_select_bookmarks" ON bookmarks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bookmarks" ON bookmarks;
CREATE POLICY "anon_insert_bookmarks" ON bookmarks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bookmarks" ON bookmarks;
CREATE POLICY "anon_delete_bookmarks" ON bookmarks FOR DELETE TO anon, authenticated USING (true);

-- ============ COMMENT LIKES ============
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes (user_id);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_comment_likes" ON comment_likes;
CREATE POLICY "anon_select_comment_likes" ON comment_likes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_comment_likes" ON comment_likes;
CREATE POLICY "anon_insert_comment_likes" ON comment_likes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_comment_likes" ON comment_likes;
CREATE POLICY "anon_delete_comment_likes" ON comment_likes FOR DELETE TO anon, authenticated USING (true);

-- ============ COUNTER TRIGGERS ============

CREATE OR REPLACE FUNCTION update_post_like_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_likes_count ON likes;
CREATE TRIGGER trg_likes_count AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

CREATE OR REPLACE FUNCTION update_post_dislike_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET dislike_count = dislike_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dislikes_count ON dislikes;
CREATE TRIGGER trg_dislikes_count AFTER INSERT OR DELETE ON dislikes
FOR EACH ROW EXECUTE FUNCTION update_post_dislike_count();

CREATE OR REPLACE FUNCTION update_post_comment_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_count ON comments;
CREATE TRIGGER trg_comments_count AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

CREATE OR REPLACE FUNCTION update_post_bookmark_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookmarks_count ON bookmarks;
CREATE TRIGGER trg_bookmarks_count AFTER INSERT OR DELETE ON bookmarks
FOR EACH ROW EXECUTE FUNCTION update_post_bookmark_count();

CREATE OR REPLACE FUNCTION update_comment_like_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_likes_count ON comment_likes;
CREATE TRIGGER trg_comment_likes_count AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- ============ FEED RANKING RPC ============

CREATE OR REPLACE FUNCTION get_feed(p_tab text, p_limit int DEFAULT 20, p_offset int DEFAULT 0)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  content text,
  category text,
  media_url text,
  media_type text,
  file_name text,
  created_at timestamptz,
  like_count integer,
  dislike_count integer,
  comment_count integer,
  bookmark_count integer,
  score double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_tab = 'latest' THEN
    RETURN QUERY
    SELECT p.id, p.user_id, p.username, p.content, p.category,
           p.media_url, p.media_type, p.file_name, p.created_at,
           p.like_count, p.dislike_count, p.comment_count, p.bookmark_count,
           0.0::double precision
    FROM posts p
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF p_tab = 'trending' THEN
    RETURN QUERY
    SELECT p.id, p.user_id, p.username, p.content, p.category,
           p.media_url, p.media_type, p.file_name, p.created_at,
           p.like_count, p.dislike_count, p.comment_count, p.bookmark_count,
           (p.like_count * 3.0 - p.dislike_count * 2.0 + random() * 15.0
            - EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600.0)::double precision AS sc
    FROM posts p
    ORDER BY sc DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF p_tab = 'random' THEN
    RETURN QUERY
    SELECT p.id, p.user_id, p.username, p.content, p.category,
           p.media_url, p.media_type, p.file_name, p.created_at,
           p.like_count, p.dislike_count, p.comment_count, p.bookmark_count,
           random()::double precision AS sc
    FROM posts p
    ORDER BY sc DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF p_tab = 'top-today' THEN
    RETURN QUERY
    SELECT p.id, p.user_id, p.username, p.content, p.category,
           p.media_url, p.media_type, p.file_name, p.created_at,
           p.like_count, p.dislike_count, p.comment_count, p.bookmark_count,
           p.like_count::double precision AS sc
    FROM posts p
    WHERE p.created_at >= now() - interval '24 hours'
    ORDER BY p.like_count DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF p_tab = 'top-week' THEN
    RETURN QUERY
    SELECT p.id, p.user_id, p.username, p.content, p.category,
           p.media_url, p.media_type, p.file_name, p.created_at,
           p.like_count, p.dislike_count, p.comment_count, p.bookmark_count,
           p.like_count::double precision AS sc
    FROM posts p
    WHERE p.created_at >= now() - interval '7 days'
    ORDER BY p.like_count DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF p_tab = 'top-month' THEN
    RETURN QUERY
    SELECT p.id, p.user_id, p.username, p.content, p.category,
           p.media_url, p.media_type, p.file_name, p.created_at,
           p.like_count, p.dislike_count, p.comment_count, p.bookmark_count,
           p.like_count::double precision AS sc
    FROM posts p
    WHERE p.created_at >= now() - interval '30 days'
    ORDER BY p.like_count DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSE
    RETURN QUERY
    SELECT p.id, p.user_id, p.username, p.content, p.category,
           p.media_url, p.media_type, p.file_name, p.created_at,
           p.like_count, p.dislike_count, p.comment_count, p.bookmark_count,
           0.0::double precision
    FROM posts p
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$;

-- ============ SEARCH RPC ============

CREATE OR REPLACE FUNCTION search_posts(p_query text, p_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  content text,
  category text,
  media_url text,
  media_type text,
  file_name text,
  created_at timestamptz,
  like_count integer,
  dislike_count integer,
  comment_count integer,
  bookmark_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.user_id, p.username, p.content, p.category,
         p.media_url, p.media_type, p.file_name, p.created_at,
         p.like_count, p.dislike_count, p.comment_count, p.bookmark_count
  FROM posts p
  WHERE p.content ILIKE '%' || p_query || '%' OR p.username ILIKE '%' || p_query || '%' OR p.category ILIKE '%' || p_query || '%'
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_upload_media" ON storage.objects;
CREATE POLICY "anon_upload_media" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "anon_read_media" ON storage.objects;
CREATE POLICY "anon_read_media" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'media');

DROP POLICY IF EXISTS "anon_delete_media" ON storage.objects;
CREATE POLICY "anon_delete_media" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'media');
