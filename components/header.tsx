'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Moon, Sun, Plus, Bookmark, User as UserIcon, LogOut, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useUser } from '@/components/user-context';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function Header() {
  const { theme, toggle } = useTheme();
  const { user, setUsername, signOut, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const navItems = [
    { href: '/', label: 'Feed' },
    { href: '/search', label: 'Explore' },
    { href: '/bookmarks', label: 'Saved' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-strong border-b border-border/40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-2 sm:gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight hidden sm:block">Alltime</span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 ml-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                pathname === item.href
                  ? 'text-foreground bg-secondary/70'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="flex-1 max-w-xs ml-auto hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Alltime…"
              className="pl-9 h-9 rounded-full bg-secondary/50 border-border/40 focus-visible:bg-secondary/70 focus-visible:border-primary/40 transition-all"
            />
          </div>
        </form>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="shrink-0 rounded-full hover:bg-secondary/60"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>

        {user && (
          <Button asChild size="sm" className="shrink-0 rounded-full bg-gradient-to-r from-primary to-chart-5 hover:opacity-90 font-semibold shadow-md shadow-primary/20">
            <Link href="/create">
              <Plus className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Post</span>
            </Link>
          </Button>
        )}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-transform hover:scale-105">
                <Avatar username={user.username} from={user.avatar_gradient_from} to={user.avatar_gradient_to} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong w-56 rounded-xl p-1.5">
              <div className="px-2.5 py-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Guest profile</p>
                <p className="font-semibold truncate mt-0.5">{user.username}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/profile/${user.id}`)} className="rounded-lg cursor-pointer">
                <UserIcon className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/bookmarks')} className="rounded-lg cursor-pointer">
                <Bookmark className="h-4 w-4 mr-2" /> Saved
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Reset guest
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          !loading && (
            <div className="h-9 w-9 rounded-full border border-border/50 bg-secondary/40" />
          )
        )}
      </div>

    </header>
  );
}
