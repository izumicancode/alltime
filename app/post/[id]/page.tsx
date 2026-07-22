'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Post } from '@/lib/types';
import { PostCard } from '@/components/post-card';
import { CommentThread } from '@/components/comment-thread';
import { Button } from '@/components/ui/button';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setPost(data as Post | null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Post not found.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full"><Link href="/">Back to feed</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <Button asChild variant="ghost" size="sm" className="mb-3 rounded-full text-muted-foreground hover:bg-secondary/60">
        <Link href="/"><ArrowLeft className="h-4 w-4 mr-1" /> Feed</Link>
      </Button>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <PostCard post={post} />
      </motion.div>
      <div className="mt-6">
        <h2 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">Comments</h2>
        <CommentThread postId={post.id} />
      </div>
    </div>
  );
}
