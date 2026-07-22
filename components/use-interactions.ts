'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/user-context';

export function useInteractions(postId: string) {
  const { user, ensureGuestUser } = useUser();
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: l }, { data: d }, { data: b }, { data: post }] = await Promise.all([
        supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user?.id ?? '').maybeSingle(),
        supabase.from('dislikes').select('id').eq('post_id', postId).eq('user_id', user?.id ?? '').maybeSingle(),
        supabase.from('bookmarks').select('id').eq('post_id', postId).eq('user_id', user?.id ?? '').maybeSingle(),
        supabase.from('posts').select('like_count, dislike_count, bookmark_count').eq('id', postId).maybeSingle(),
      ]);
      if (cancelled) return;
      setLiked(!!l);
      setDisliked(!!d);
      setBookmarked(!!b);
      if (post) {
        setLikeCount(post.like_count);
        setDislikeCount(post.dislike_count);
        setBookmarkCount(post.bookmark_count);
      }
    })();
    return () => { cancelled = true; };
  }, [postId, user?.id]);

  const toggleLike = useCallback(async () => {
    let activeUser = user;
    if (!activeUser) {
      activeUser = await ensureGuestUser();
    }
    if (!activeUser) return;
    if (liked) {
      setLiked(false); setLikeCount((c) => Math.max(0, c - 1));
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', activeUser.id);
    } else {
      setLiked(true); setLikeCount((c) => c + 1);
      await supabase.from('likes').insert({ post_id: postId, user_id: activeUser.id });
      if (disliked) { setDisliked(false); setDislikeCount((c) => Math.max(0, c - 1));
        await supabase.from('dislikes').delete().eq('post_id', postId).eq('user_id', activeUser.id);
      }
    }
  }, [user, ensureGuestUser, liked, disliked, postId]);

  const toggleDislike = useCallback(async () => {
    let activeUser = user;
    if (!activeUser) {
      activeUser = await ensureGuestUser();
    }
    if (!activeUser) return;
    if (disliked) {
      setDisliked(false); setDislikeCount((c) => Math.max(0, c - 1));
      await supabase.from('dislikes').delete().eq('post_id', postId).eq('user_id', activeUser.id);
    } else {
      setDisliked(true); setDislikeCount((c) => c + 1);
      await supabase.from('dislikes').insert({ post_id: postId, user_id: activeUser.id });
      if (liked) { setLiked(false); setLikeCount((c) => Math.max(0, c - 1));
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', activeUser.id);
      }
    }
  }, [user, ensureGuestUser, liked, disliked, postId]);

  const toggleBookmark = useCallback(async () => {
    let activeUser = user;
    if (!activeUser) {
      activeUser = await ensureGuestUser();
    }
    if (!activeUser) return;
    if (bookmarked) {
      setBookmarked(false); setBookmarkCount((c) => Math.max(0, c - 1));
      await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', activeUser.id);
    } else {
      setBookmarked(true); setBookmarkCount((c) => c + 1);
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: activeUser.id });
    }
  }, [user, ensureGuestUser, bookmarked, postId]);

  return { liked, disliked, bookmarked, likeCount, dislikeCount, bookmarkCount, toggleLike, toggleDislike, toggleBookmark };
}
