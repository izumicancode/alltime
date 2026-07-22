'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Hash, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Post, User } from '@/lib/types';
import { PostCard } from '@/components/post-card';
import { Avatar } from '@/components/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function SearchPage() {
  const params = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [q, setQ] = useState(initialQ);
  const [activeQuery, setActiveQuery] = useState(initialQ);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<'posts' | 'users' | 'categories'>('posts');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeQuery.trim()) { setPosts([]); setUsers([]); return; }
    setLoading(true);
    (async () => {
      const [{ data: pData }, { data: uData }] = await Promise.all([
        supabase.rpc('search_posts', { p_query: activeQuery, p_limit: 30 }),
        supabase.from('users').select('*').ilike('username', `%${activeQuery}%`).limit(12),
      ]);
      setPosts((pData ?? []) as Post[]);
      setUsers((uData ?? []) as User[]);
      setLoading(false);
    })();
  }, [activeQuery]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(q.trim());
  };

  const matchedCats = CATEGORIES.filter((c) => !activeQuery.trim() || c.name.toLowerCase().includes(activeQuery.toLowerCase()));
  const counts = { posts: posts.length, users: users.length, categories: matchedCats.length };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <form onSubmit={onSubmit} className="relative mb-4">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts, usernames, categories…"
          className="pl-11 h-12 rounded-xl glass border-border/50 focus-visible:border-primary/50"
          autoFocus
        />
      </form>

      <div className="flex items-center gap-1.5 mb-5">
        {(['posts', 'users', 'categories'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3.5 py-2 rounded-full text-xs font-semibold capitalize transition-all',
              tab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            {t} {counts[t] > 0 && <span className="opacity-70">· {counts[t]}</span>}
          </button>
        ))}
      </div>

      {!activeQuery.trim() ? (
        <div className="text-center py-20">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-5/20 flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Start typing to search across Alltime.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : tab === 'posts' ? (
        posts.length === 0 ? <Empty label="posts" /> : (
          <div className="space-y-4">{posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
        )
      ) : tab === 'users' ? (
        users.length === 0 ? <Empty label="users" /> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {users.map((u) => (
              <Link key={u.id} href={`/profile/${u.id}`}
                className="glass card-lift rounded-xl p-3.5 flex items-center gap-3">
                <Avatar username={u.username} from={u.avatar_gradient_from} to={u.avatar_gradient_to} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{u.username}</p>
                  <p className="text-xs text-muted-foreground">View profile</p>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {matchedCats.map((c) => (
            <Link key={c.name} href={`/category/${c.name.toLowerCase()}`}
              className="glass card-lift rounded-xl p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center text-lg" style={{ background: `${c.color}1a` }}>
                {c.emoji}
              </div>
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">Browse category</p>
              </div>
              <Hash className="h-4 w-4 text-muted-foreground ml-auto" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
      <UserIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
      <p className="text-muted-foreground text-sm">No {label} found.</p>
    </motion.div>
  );
}
