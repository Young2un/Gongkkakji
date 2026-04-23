'use client';

import { useState, useTransition } from 'react';
import { Bookmark, Loader2, X } from 'lucide-react';
import { saveStoryAsHighlight } from '@/app/actions/story';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ExistingHighlight {
  id: string;
  title: string;
  cover_url: string | null;
}

interface Props {
  storyId: string;
  existingHighlights: ExistingHighlight[];
  onClose: () => void;
  onSaved: () => void;
}

export function HighlightSaveModal({
  storyId,
  existingHighlights,
  onClose,
  onSaved,
}: Props) {
  const [mode, setMode] = useState<'select' | 'new'>(
    existingHighlights.length > 0 ? 'select' : 'new'
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await saveStoryAsHighlight({
        storyId,
        existingHighlightId: mode === 'select' ? selectedId ?? undefined : undefined,
        title: mode === 'new' ? title : undefined,
      });
      if ('error' in res && res.error) {
        setError(res.error);
      } else {
        onSaved();
      }
    });
  };

  const canSave =
    (mode === 'select' && selectedId) || (mode === 'new' && title.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={() => !isPending && onClose()}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Bookmark className="h-5 w-5" />
            하이라이트에 저장
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md p-1 hover:bg-muted disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {existingHighlights.length > 0 && (
          <div className="flex gap-1 rounded-md border border-border p-1">
            <button
              type="button"
              onClick={() => setMode('select')}
              className={cn(
                'flex-1 rounded px-3 py-1.5 text-sm',
                mode === 'select' ? 'bg-foreground text-background' : 'hover:bg-muted'
              )}
            >
              기존 하이라이트
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={cn(
                'flex-1 rounded px-3 py-1.5 text-sm',
                mode === 'new' ? 'bg-foreground text-background' : 'hover:bg-muted'
              )}
            >
              새로 만들기
            </button>
          </div>
        )}

        {mode === 'select' ? (
          <div className="max-h-60 space-y-1.5 overflow-y-auto">
            {existingHighlights.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedId(h.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors',
                  selectedId === h.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:bg-muted'
                )}
              >
                {h.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.cover_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted" />
                )}
                <span className="text-sm">{h.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="highlight-title">
              하이라이트 제목
            </label>
            <input
              id="highlight-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              placeholder="예: 오버워치 클립"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              autoFocus
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          저장하면 스토리 피드에서 제외되고, 하이라이트 보관함에서만 볼 수 있어요.
        </p>

        {error && (
          <div className="rounded-md border border-live/50 bg-live/10 p-3 text-sm text-live">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
