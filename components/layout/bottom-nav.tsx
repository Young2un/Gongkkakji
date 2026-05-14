'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  MessageCircle,
  Newspaper,
  User,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
}

const BASE_ITEMS: NavItem[] = [
  { href: '/', label: '홈', icon: Home, match: (p) => p === '/' },
  { href: '/calendar', label: '일정', icon: Calendar, match: (p) => p.startsWith('/calendar') },
  { href: '/bubble', label: '공은talk', icon: MessageCircle, match: (p) => p.startsWith('/bubble') },
  { href: '/c/free', label: '게시판', icon: Newspaper, match: (p) => p.startsWith('/c/') },
  { href: '/profile', label: '프로필', icon: User, match: (p) => p.startsWith('/profile') || p.startsWith('/u/') },
];

const ROULETTE_ITEM: NavItem = {
  href: '/admin/roulette',
  label: '룰렛',
  icon: CircleDot,
  match: (p) =>
    p.startsWith('/admin/roulette') ||
    p.startsWith('/control/') ||
    p.startsWith('/overlay/'),
};

interface Props {
  isStreamer?: boolean;
}

export function BottomNav({ isStreamer = false }: Props) {
  const pathname = usePathname() ?? '/';

  const items = isStreamer ? [...BASE_ITEMS, ROULETTE_ITEM] : BASE_ITEMS;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-background/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="모바일 메인 네비게이션"
    >
      <ul className="mx-auto flex max-w-5xl items-stretch justify-around">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          const isAccent = item.href === ROULETTE_ITEM.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors min-h-[56px]',
                  active
                    ? isAccent
                      ? 'text-accent'
                      : 'text-primary'
                    : 'text-muted-foreground hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    active && !isAccent && 'fill-primary/15',
                    active && isAccent && 'fill-accent/15'
                  )}
                  aria-hidden
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
