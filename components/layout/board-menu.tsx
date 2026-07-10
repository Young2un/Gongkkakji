'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const BOARDS = [
  { href: '/c/notice', label: '공지' },
  { href: '/c/free', label: '자유' },
  { href: '/c/anon', label: '익명' },
];

/**
 * 데스크톱 헤더용 "게시판 ▾" 드롭다운.
 * hover 또는 클릭으로 열리고, 바깥 클릭/포커스 이탈 시 닫힘.
 */
export function BoardMenu() {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = pathname.startsWith('/c/');

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
          active ? 'text-white bg-white/5' : 'text-foreground/70 hover:bg-white/5 hover:text-white'
        )}
      >
        게시판
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 min-w-[9rem] overflow-hidden rounded-lg border border-white/10 bg-background/95 py-1 shadow-xl backdrop-blur-md"
        >
          {BOARDS.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                'block px-4 py-2 text-sm transition-colors hover:bg-white/10',
                pathname.startsWith(b.href) ? 'text-primary font-semibold' : 'text-foreground/80'
              )}
            >
              {b.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
