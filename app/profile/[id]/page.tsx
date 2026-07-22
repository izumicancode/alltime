'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CalendarDays, MessageSquare, ThumbsUp, Hash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Post, User } from '@/lib/types';
import { Avatar } from '@/components/avatar';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { formatDate, formatCount } from '@/lib/time';
import { CATEGORIES } from '@/lib/categories';
import { useUser } from '@/components/user-context';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [catCounts, setCatCounts] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: u }, { data: p }] = await Promise.all([
        supabase.from('users').select('*').eq('id', id).maybeSingle(),
        supabase.from('posts').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
      ]);
      setProfile(u as User | null);
      const userPosts = (p ?? []) as Post[];
      setPosts(userPosts);
      setTotalLikes(userPosts.reduce((s, x) => s + x.like_count, 0));
      const cc = new Map<string, number>();
      userPosts.forEach((x) => { if (x.category) cc.set(x.category, (cc.get(x.category) ?? 0) + 1); });
      setCatCounts(Array.from(cc.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count));
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">User not found.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full"><a href="/">Back to feed</a></Button>
      </div>
    );
  }

  const topCat = catCounts[0];
  const topCatMeta = topCat ? CATEGORIES.find((c) => c.name === topCat.category) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-6 mb-6 relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 blur-2xl"
          style={{ background: profile.avatar_gradient_from }} />
        <div className="flex items-center gap-4 relative">
          <div className="flex flex-col items-start gap-3">
            <Avatar username={profile.username} from={profile.avatar_gradient_from} to={profile.avatar_gradient_to} size="xl" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold truncate">{profile.username}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <CalendarDays className="h-4 w-4" /> Joined {formatDate(profile.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat icon={<MessageSquare className="h-4 w-4" />} label="Posts" value={formatCount(posts.length)} />
          <Stat icon={<ThumbsUp className="h-4 w-4" />} label="Likes" value={formatCount(totalLikes)} />
          <Stat icon={<Hash className="h-4 w-4" />} label="Top tag" value={topCatMeta ? `${topCatMeta.emoji} ${topCatMeta.name}` : '—'} />
        </div>

        {catCounts.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Categories used</p>
            <div className="flex flex-wrap gap-1.5">
              {catCounts.map(({ category, count }) => {
                const meta = CATEGORIES.find((c) => c.name === category);
                return (
                  <span key={category} className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 flex items-center gap-1">
                    {meta?.emoji} {category} <span className="text-muted-foreground">· {count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      <h2 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">Recent posts</h2>
      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">No posts yet.</p>
      ) : (
        <div className="space-y-4">{posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3.5 text-center">
      <div className="flex items-center justify-center text-primary mb-1.5">{icon}</div>
      <p className="font-bold text-lg">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
    </div>
  );
}
