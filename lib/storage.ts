import { supabase, MEDIA_BUCKET } from './supabase';

export type MediaKind = 'image' | 'video' | 'file' | 'gif';

export function detectMediaKind(file: File): MediaKind {
  const t = file.type.toLowerCase();
  if (t.startsWith('image/gif')) return 'gif';
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  return 'file';
}

export async function uploadMedia(file: File, userId: string): Promise<{ url: string; kind: MediaKind; fileName: string } | null> {
  const kind = detectMediaKind(file);
  const ext = file.name.split('.').pop() || 'bin';
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });

  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, kind, fileName: file.name };
}
