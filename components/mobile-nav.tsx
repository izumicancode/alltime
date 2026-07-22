'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, Bookmark, User as UserIcon } from 'lucide-react';
import { useUser } from '@/components/user-context';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const items = [
    { href: '/', icon: Home, label: 'Feed' },
    { href: '/search', icon: Search, label: 'Explore' },
    { href: '/create', icon: Plus, label: 'Post', primary: true },
    { href: '/bookmarks', icon: Bookmark, label: 'Saved' },
    {
      href: user ? `/profile/${user.id}` : '/onboarding',
      icon: UserIcon,
      label: 'Profile',
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-border/40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[68px] px-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center -mt-7">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center shadow-xl shadow-primary/30 active:scale-95 transition-transform">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
