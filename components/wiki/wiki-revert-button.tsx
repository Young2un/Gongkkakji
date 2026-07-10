'use client';

import { useTransition } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import { revertWiki } from '@/app/actions/wiki';

export function WikiRevertButton({ revisionId }: { revisionId: string }) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm('이 버전으로 되돌릴까요? 현재 내용은 편집 이력에 남습니다.')) return;
    startTransition(async () => {
      await revertWiki({ revisionId });
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
      되돌리기
    </button>
  );
}
