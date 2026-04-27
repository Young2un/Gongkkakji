'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MoreVertical, Edit2, Trash2, Loader2 } from 'lucide-react';
import { deletePost } from '@/app/actions/board';

interface PostActionsProps {
  postId: string;
  categorySlug: string;
}

export function PostActions({ postId, categorySlug }: PostActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleDelete = () => {
    if (!window.confirm('정말 이 글을 삭제하시겠습니까?')) return;
    setOpen(false);

    startTransition(async () => {
      const res = await deletePost({ postId, categorySlug });
      if (res && 'error' in res && res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="게시글 메뉴"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-background p-1 shadow-lg z-50">
          <Link
            href={`/c/${categorySlug}/${postId}/edit`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            수정
          </Link>
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-live hover:bg-live/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
