'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useUser } from '@/components/user-context';

export default function LaunchScreen() {
  const { user, loading, ensureGuestUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/');
      return;
    }

    ensureGuestUser().then(() => router.replace('/'));
  }, [loading, user, ensureGuestUser, router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-[28px] border border-border/70 bg-card/80 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Welcome</p>
            <h1 className="font-display text-2xl font-semibold text-foreground">Alltime</h1>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border/70 bg-background/55 px-4 py-4 text-sm text-muted-foreground">
          Creating your guest profile and opening the feed…
        </div>
      </motion.div>
    </div>
  );
}
