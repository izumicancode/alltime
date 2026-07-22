'use client';

import { Feed } from '@/components/feed';
import { useUser } from '@/components/user-context';

export default function HomePage() {
  const { loading } = useUser();

  if (loading) return null;
  return <Feed />;
}
