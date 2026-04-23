import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  basePath: string;
  currentPage: number;
  totalPages: number;
}

export function Pagination({ basePath, currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  // 표시할 페이지 번호 범위 (최대 5개 윈도우)
  const windowSize = 5;
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - windowSize + 1));
  const end = Math.min(totalPages, start + windowSize - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const linkBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-3 text-sm';

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지네이션">
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} className={cn(linkBase, 'hover:bg-muted')}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(linkBase, 'opacity-40')}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={cn(
            linkBase,
            p === currentPage
              ? 'border-foreground bg-foreground text-background'
              : 'hover:bg-muted'
          )}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}

      {currentPage < totalPages ? (
        <Link href={hrefFor(currentPage + 1)} className={cn(linkBase, 'hover:bg-muted')}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(linkBase, 'opacity-40')}>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
