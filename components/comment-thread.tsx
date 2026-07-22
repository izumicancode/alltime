'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, CornerDownRight, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/user-context';
import { Avatar } from '@/components/avatar';
import { gradientFor } from '@/lib/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Comment } from '@/lib/types';
import { timeAgo, formatCount } from '@/lib/time';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface CommentThreadProps {
  postId: string;
}

export function CommentThread({ postId }: CommentThreadProps) {
  const { user, ensureGuestUser } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    const flat = (data ?? []) as Comment[];
    const byParent = new Map<string | null, Comment[]>();
    flat.forEach((c) => {
      const key = c.parent_id;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    });
    const build = (parentId: string | null): Comment[] => {
      const kids = byParent.get(parentId) ?? [];
      return kids.map((k) => ({ ...k, children: build(k.id) }));
    };
    setComments(build(null));
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (parentId: string | null, body: string, clear?: () => void) => {
    if (!body.trim()) return;

    let activeUser = user;
    if (!activeUser) {
      const guest = await ensureGuestUser();
      if (!guest) {
        toast.error('Could not start a guest session');
        return;
      }
      activeUser = guest;
    }

    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: activeUser.id,
      username: activeUser.username,
      parent_id: parentId,
      content: body.trim(),
    });
    setSubmitting(false);
    if (error) { toast.error('Could not comment'); return; }
    if (clear) clear();
    await load();
  };

  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className="min-h-[70px] resize-y bg-secondary/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/40 text-sm"
        />
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            disabled={submitting || !text.trim()}
            onClick={() => submit(null, text, () => setText(''))}
            className="rounded-full bg-gradient-to-r from-primary to-chart-5 hover:opacity-90 font-semibold"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1" /> Comment</>}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No comments yet. Start the conversation.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => <CommentItem key={c.id} comment={c} postId={postId} depth={0} onReply={submit} />)}
        </div>
      )}
    </div>
  );
}

interface ItemProps {
  comment: Comment;
  postId: string;
  depth: number;
  onReply: (parentId: string | null, body: string, clear: () => void) => void;
}

function CommentItem({ comment, postId, depth, onReply }: ItemProps) {
  const { user } = useUser();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', comment.id)
        .eq('user_id', user?.id ?? '')
        .maybeSingle();
      setLiked(!!data);
    })();
  }, [comment.id, user?.id]);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      setLiked(false); setLikeCount((c) => Math.max(0, c - 1));
      await supabase.from('comment_likes').delete().eq('comment_id', comment.id).eq('user_id', user.id);
    } else {
      setLiked(true); setLikeCount((c) => c + 1);
      await supabase.from('comment_likes').insert({ comment_id: comment.id, user_id: user.id });
    }
  };

  const maxDepth = 4;
  const canReply = depth < maxDepth;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('flex gap-2.5', depth > 0 && 'ml-3 sm:ml-5 border-l border-border/40 pl-3 sm:pl-4')}
    >
      <Link href={`/profile/${comment.user_id}`} className="transition-transform hover:scale-105 shrink-0">
        <Avatar username={comment.username} from={gradientFor(comment.username).from} to={gradientFor(comment.username).to} size="xs" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="glass rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 mb-0.5">
            <Link href={`/profile/${comment.user_id}`} className="font-semibold text-xs hover:text-primary transition-colors">{comment.username}</Link>
            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
        <div className="flex items-center gap-0.5 mt-1 ml-1">
          <Button variant="ghost" size="sm" onClick={user ? toggleLike : undefined}
            className={cn('h-6 px-2 rounded-full gap-1 text-[11px] hover:bg-secondary/60', liked && 'text-primary')}>
            <ThumbsUp className={cn('h-3 w-3', liked && 'fill-current')} />
            {formatCount(likeCount)}
          </Button>
          {canReply && (
            <Button variant="ghost" size="sm" onClick={() => setReplyOpen((o) => !o)}
              className="h-6 px-2 rounded-full gap-1 text-[11px] text-muted-foreground hover:bg-secondary/60">
              <CornerDownRight className="h-3 w-3" /> Reply
            </Button>
          )}
        </div>

        <AnimatePresence>
          {replyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2"
            >
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.username}…`}
                className="min-h-[60px] bg-secondary/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/40 text-sm"
              />
              <div className="flex justify-end gap-1 mt-1">
                <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)} className="h-7 rounded-full text-xs">Cancel</Button>
                <Button size="sm" disabled={!replyText.trim()}
                  onClick={() => onReply(comment.id, replyText, () => { setReplyText(''); setReplyOpen(false); })}
                  className="h-7 rounded-full bg-primary text-xs font-semibold">
                  <Send className="h-3 w-3 mr-1" /> Reply
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {comment.children && comment.children.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.children.map((child) => (
              <CommentItem key={child.id} comment={child} postId={postId} depth={depth + 1} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
