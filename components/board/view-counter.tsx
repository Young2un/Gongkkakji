'use client';

import { useEffect, useRef } from 'react';
import { incrementView } from '@/app/actions/board';

export function ViewCounter({ postId }: { postId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    incrementView(postId).catch(() => {});
  }, [postId]);

  return null;
}
