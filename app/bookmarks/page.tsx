'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/lib/types';
import { useUser } from '@/components/user-context';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';

export default function BookmarksPage() {
  const { user, loading } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!user) { setLoadingPosts(false); return; }
    (async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('post_id, posts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const rows = (data ?? []) as unknown as { post_id: string; posts: Post }[];
      setPosts(rows.map((r) => r.posts).filter(Boolean));
      setLoadingPosts(false);
    })();
  }, [user]);

  if (loading || loadingPosts) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Sign in to see your saved posts.</p>
        <Button asChild className="mt-4 rounded-full bg-gradient-to-r from-primary to-chart-5"><a href="/onboarding">Sign in</a></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-warning" fill="currentColor" /> Saved posts
      </h1>
      {posts.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
            <Bookmark className="h-7 w-7 text-warning" />
          </div>
          <p className="text-muted-foreground text-sm">No saved posts yet.</p>
          <p className="text-muted-foreground text-xs mt-1">Tap the bookmark icon on any post to save it here.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">{posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
      )}
    </div>
  );
}
