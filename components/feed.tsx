'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Shuffle, TrendingUp, Calendar, CalendarDays, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/post-card';
import { FeedSkeleton } from '@/components/feed-skeleton';
import { Button } from '@/components/ui/button';
import { FeedPost, FeedTab } from '@/lib/types';
import { cn } from '@/lib/utils';

const TABS: { id: FeedTab; label: string; icon: typeof Flame; short: string }[] = [
  { id: 'trending', label: 'Trending', icon: Flame, short: 'Trending' },
  { id: 'latest', label: 'Latest', icon: Clock, short: 'New' },
  { id: 'random', label: 'Random', icon: Shuffle, short: 'Random' },
  { id: 'top-today', label: 'Top Today', icon: TrendingUp, short: 'Today' },
  { id: 'top-week', label: 'Top Week', icon: Calendar, short: 'Week' },
  { id: 'top-month', label: 'Top Month', icon: CalendarDays, short: 'Month' },
];

const PAGE_SIZE = 10;

export function Feed() {
  const [tab, setTab] = useState<FeedTab>('trending');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (reset: boolean) => {
    if (reset) {
      setLoading(true);
      offsetRef.current = 0;
      setPosts([]);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    const offset = offsetRef.current;
    const { data, error } = await supabase.rpc('get_feed', {
      p_tab: tab, p_limit: PAGE_SIZE, p_offset: offset,
    });
    if (error) console.error('feed error', error);
    const rows = (data ?? []) as FeedPost[];
    if (reset) setPosts(rows);
    else setPosts((prev) => [...prev, ...rows]);
    offsetRef.current = offset + rows.length;
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, [tab]);

  useEffect(() => { loadPage(true); }, [loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && !loading) loadPage(false);
      },
      { rootMargin: '600px' }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [loadPage, loadingMore, hasMore, loading]);

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="sticky top-16 z-30 -mx-4 px-4 pt-3 pb-2.5 mb-4 glass-strong border-b border-border/40">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <FeedSkeleton count={4} />
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">You&apos;ve reached the end.</p>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border border-border/70 bg-card/70 px-6 py-10 text-center shadow-sm"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Flame className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">The feed is quiet right now</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
        Be the first to share something thoughtful, visual, or personal.
      </p>
    </motion.div>
  );
}
