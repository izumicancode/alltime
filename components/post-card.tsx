'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ThumbsUp, ThumbsDown, MessageCircle, Share2, Bookmark,
  FileText, Download, Check,
} from 'lucide-react';
import { Avatar } from '@/components/avatar';
import { gradientFor } from '@/lib/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInteractions } from '@/components/use-interactions';
import { useUser } from '@/components/user-context';
import { getCategoryMeta } from '@/lib/categories';
import { formatCount, timeAgo } from '@/lib/time';
import { renderMarkdown } from '@/lib/markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Post } from '@/lib/types';

interface PostCardProps {
  post: Post;
  index?: number;
  compact?: boolean;
}

export function PostCard({ post, index = 0, compact = false }: PostCardProps) {
  const cat = getCategoryMeta(post.category);
  const { user } = useUser();
  const ix = useInteractions(post.id);
  const [copied, setCopied] = useState(false);
  const grad = gradientFor(post.username);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${post.id}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy');
    }
  };

  const onShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Alltime post by ${post.username}`, url: shareUrl }); } catch {}
    } else { copyLink(); }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="glass card-lift rounded-2xl overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/profile/${post.user_id}`} className="transition-transform hover:scale-105">
            <Avatar username={post.username} from={grad.from} to={grad.to} size="sm" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${post.user_id}`} className="font-semibold text-sm hover:text-primary transition-colors truncate">
                {post.username}
              </Link>
              {post.category && (
                <Link href={`/category/${post.category.toLowerCase()}`}>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 rounded-full hover:bg-secondary transition-colors" style={{ color: cat.color }}>
                    {cat.emoji} {post.category}
                  </Badge>
                </Link>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)} ago</p>
          </div>
        </div>

        {!compact && post.content && (
          <div
            className="md-body text-[15px] text-foreground/90 mb-3 line-clamp-[12]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />
        )}
        {compact && post.content && (
          <p className="text-sm text-foreground/80 mb-3 line-clamp-3">{post.content}</p>
        )}

        {post.media_url && post.media_type === 'image' && (
          <Link href={`/post/${post.id}`} className="block overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.media_url}
              alt="post media"
              loading="lazy"
              className="max-h-[540px] w-full object-cover hover:scale-[1.02] transition-transform duration-500"
            />
          </Link>
        )}
        {post.media_url && post.media_type === 'gif' && (
          <Link href={`/post/${post.id}`} className="block overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.media_url}
              alt="gif"
              loading="lazy"
              className="max-h-[440px] w-full object-cover hover:scale-[1.02] transition-transform duration-500"
            />
          </Link>
        )}
        {post.media_url && post.media_type === 'video' && (
          <video
            src={post.media_url}
            controls
            preload="metadata"
            className="rounded-xl max-h-[540px] w-full object-cover"
          />
        )}
        {post.media_url && post.media_type === 'file' && (
          <a
            href={post.media_url}
            download={post.file_name ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3.5 hover:bg-secondary transition-colors group"
          >
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{post.file_name ?? 'attachment'}</p>
              <p className="text-xs text-muted-foreground">Click to download</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>
        )}
      </div>

      <div className="px-3 sm:px-4 pb-3 pt-1 flex items-center gap-0.5 flex-wrap">
        <ActionButton
          onClick={user ? ix.toggleLike : undefined}
          active={ix.liked}
          activeClass="text-primary"
          icon={<ThumbsUp className={cn('h-4 w-4', ix.liked && 'fill-current')} />}
          count={ix.likeCount}
          label="Like"
        />
        <ActionButton
          onClick={user ? ix.toggleDislike : undefined}
          active={ix.disliked}
          activeClass="text-destructive"
          icon={<ThumbsDown className={cn('h-4 w-4', ix.disliked && 'fill-current')} />}
          count={ix.dislikeCount}
          label="Dislike"
        />
        <Button asChild variant="ghost" size="sm" className="rounded-full h-8 gap-1.5 px-2.5 hover:bg-secondary/60">
          <Link href={`/post/${post.id}`}>
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{formatCount(post.comment_count)}</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={user ? ix.toggleBookmark : undefined}
          className={cn('rounded-full h-8 px-2.5 hover:bg-secondary/60', ix.bookmarked && 'text-warning')}
          aria-label="Bookmark"
        >
          <Bookmark className={cn('h-4 w-4', ix.bookmarked && 'fill-current')} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onShare} className="rounded-full h-8 gap-1.5 px-2.5 ml-auto hover:bg-secondary/60" aria-label="Share">
          {copied ? <Check className="h-4 w-4 text-success" /> : <Share2 className="h-4 w-4" />}
          <span className="text-xs hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
        </Button>
      </div>
    </motion.article>
  );
}

function ActionButton({
  onClick, active, activeClass, icon, count, label,
}: {
  onClick?: () => void; active: boolean; activeClass: string; icon: React.ReactNode; count: number; label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('rounded-full h-8 gap-1.5 px-2.5 hover:bg-secondary/60 transition-colors', active && activeClass)}
      aria-label={label}
    >
      {icon}
      <span className="text-xs">{formatCount(count)}</span>
    </Button>
  );
}
