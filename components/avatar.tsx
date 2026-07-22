'use client';

import { initials } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface AvatarProps {
  username: string;
  from?: string;
  to?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  imageUrl?: string | null;
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ username, from = '#3b82f6', to = '#06b6d4', size = 'md', className, imageUrl }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={username}
        className={cn('rounded-full object-cover shrink-0', SIZES[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white shrink-0 shadow-sm',
        SIZES[size],
        className
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initials(username)}
    </div>
  );
}
