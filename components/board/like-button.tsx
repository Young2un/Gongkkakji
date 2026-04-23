'use client';

import { useOptimistic, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleLike } from '@/app/actions/board';

interface LikeButtonProps {
  targetType: 'post' | 'comment';
  targetId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  revalidate?: string;
}

export function LikeButton({
  targetType,
  targetId,
  initialLiked,
  initialCount,
  isLoggedIn,
  revalidate,
}: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(
    { liked: initialLiked, count: initialCount },
    (prev, next: 'toggle' | 'revert') => {
      if (next === 'revert') return prev;
      return {
        liked: !prev.liked,
        count: prev.liked ? prev.count - 1 : prev.count + 1,
      };
    }
  );

  const handleClick = () => {
    if (!isLoggedIn) {
      alert('로그인 후 이용해주세요');
      return;
    }
    startTransition(async () => {
      setOptimistic('toggle');
      const res = await toggleLike({ targetType, targetId, revalidate });
      if ('error' in res && res.error) {
        setOptimistic('revert');
        alert(res.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted',
        state.liked && 'border-accent/60 bg-accent/10 text-accent'
      )}
      aria-pressed={state.liked}
    >
      <Heart
        className={cn('h-4 w-4', state.liked && 'fill-current')}
        aria-hidden
      />
      <span>{state.count}</span>
    </button>
  );
}
