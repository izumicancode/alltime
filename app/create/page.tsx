'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ImagePlus, X, Loader2, Send, Upload } from 'lucide-react';
import { useUser } from '@/components/user-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES, getCategoryMeta } from '@/lib/categories';
import { supabase } from '@/lib/supabase';
import { uploadMedia, detectMediaKind } from '@/lib/storage';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CreatePage() {
  const { user, loading, ensureGuestUser } = useUser();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    if (!f) return;
    const kind = detectMediaKind(f);
    if (kind !== 'image' && kind !== 'gif') {
      toast.error('Only images and GIFs are supported right now');
      return;
    }
    const maxBytes = 20 * 1024 * 1024;
    if (f.size > maxBytes) {
      toast.error('Image/GIF max 20MB');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }, []);

  const submit = async () => {
    if (!content.trim() && !file) { toast.error('Add text or media'); return; }

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
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;
    let fileName: string | null = null;
    if (file) {
      const up = await uploadMedia(file, activeUser.id);
      if (!up) { toast.error('Upload failed'); setSubmitting(false); return; }
      mediaUrl = up.url; mediaType = up.kind; fileName = up.fileName;
    }
    const { data, error } = await supabase.from('posts').insert({
      user_id: activeUser.id,
      username: activeUser.username,
      content: content.trim(),
      category,
      media_url: mediaUrl,
      media_type: mediaType,
      file_name: fileName,
    }).select('id').single();
    setSubmitting(false);
    if (error || !data) { toast.error('Could not post'); return; }
    toast.success('Posted');
    router.push(`/post/${data.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground">
        Preparing your guest profile…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-5 sm:p-6"
      >
        <h1 className="font-display text-xl font-bold mb-5">New post</h1>

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category</p>
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border',
              !category ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            None
          </button>
          {CATEGORIES.map((c) => {
            const active = category === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setCategory(active ? null : c.name)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border',
                  active ? 'border-transparent text-white shadow-sm' : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
                style={active ? { background: c.color } : undefined}
              >
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are you thinking about right now?"
          className="min-h-[150px] resize-y rounded-xl bg-secondary/40 border-border/50 focus-visible:border-primary/50 transition-colors text-[15px]"
          maxLength={4000}
        />
        <div className="text-xs text-muted-foreground text-right mt-1.5">{content.length}/4000</div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'mt-4 rounded-xl border-2 border-dashed transition-all',
            dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-border/80'
          )}
        >
          {preview ? (
            <div className="relative p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="rounded-lg max-h-72 w-full object-cover" />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-5 right-5 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-xs text-muted-foreground mt-2 text-center truncate">{file?.name}</p>
            </div>
          ) : (
            <div className="py-9 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-secondary/60 flex items-center justify-center mb-3">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground/80">Add an image or GIF</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">A simple post with one visual is enough.</p>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => inputRef.current?.click()}>
                <ImagePlus className="h-4 w-4 mr-1.5" /> Upload image
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.gif"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-[11px] text-muted-foreground mt-3">Images/GIFs only · up to 20MB</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-5 pt-1">
          <p className="text-xs text-muted-foreground">
            {category ? <>Category: <span className="font-medium" style={{ color: getCategoryMeta(category).color }}>{category}</span></> : 'No category'}
          </p>
          <Button
            onClick={submit}
            disabled={submitting || (!content.trim() && !file)}
            className="rounded-full bg-primary px-6 font-semibold shadow-sm active:scale-95 transition-all"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" /> Post</>}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
