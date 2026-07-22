'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/lib/types';
import { PostCard } from '@/components/post-card';
import { CATEGORIES } from '@/lib/categories';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CategoryPage() {
  const { name } = useParams<{ name: string }>();
  const catName = CATEGORIES.find((c) => c.name.toLowerCase() === name?.toLowerCase());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!catName) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('category', catName.name)
        .order('created_at', { ascending: false })
        .limit(60);
      setPosts((data ?? []) as Post[]);
      setLoading(false);
    })();
  }, [catName]);

  if (!catName) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Category not found.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full"><Link href="/">Back to feed</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-5 mb-5 flex items-center gap-4 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-20 blur-2xl" style={{ background: catName.color }} />
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 relative" style={{ background: `${catName.color}1a` }}>
          {catName.emoji}
        </div>
        <div className="relative">
          <h1 className="font-display text-2xl font-bold">{catName.name}</h1>
          <p className="text-sm text-muted-foreground">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">No posts in this category yet.</p>
      ) : (
        <div className="space-y-4">{posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
      )}
    </div>
  );
}
