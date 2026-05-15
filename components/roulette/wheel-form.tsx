'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Trash2 } from 'lucide-react';
import { createWheel, updateWheel, deleteWheel } from '@/app/actions/roulette';
import { Button } from '@/components/ui/button';

interface Props {
  onClose: () => void;
  initial?: {
    id: string;
    slug: string;
    title: string;
    spin_duration_ms: number;
    show_result_ms: number;
  } | null;
}

export function WheelForm({ onClose, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [spinDurationMs, setSpinDurationMs] = useState(
    initial?.spin_duration_ms ?? 5000
  );
  const [showResultMs, setShowResultMs] = useState(
    initial?.show_result_ms ?? 4000
  );

  const isEdit = !!initial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !title.trim()) {
      alert('URL 이름과 룰렛 이름을 모두 입력해주세요.');
      return;
    }

    startTransition(async () => {
      const payload = {
        slug: slug.trim(),
        title: title.trim(),
        spinDurationMs,
        showResultMs,
      };

      const res = isEdit
        ? await updateWheel({ id: initial!.id, ...payload })
        : await createWheel(payload);

      if ('error' in res && res.error) {
        alert(res.error);
        return;
      }

      router.refresh();
      onClose();

      const created = (res as { wheel?: { slug: string } }).wheel;
      if (!isEdit && created) {
        router.push(`/admin/roulette/${created.slug}/edit`);
      }
    });
  };

  const handleDelete = () => {
    if (!initial) return;
    if (!confirm(`"${initial.title}" 룰렛을 삭제할까요? 항목과 기록도 같이 삭제돼요.`))
      return;
    startTransition(async () => {
      const res = await deleteWheel(initial.id);
      if ('error' in res && res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-white/10 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0">
          <h2 className="text-base font-bold text-white">
            {isEdit ? '룰렛 수정' : '새 룰렛'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 -mr-1 text-muted-foreground hover:bg-white/10 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 overflow-y-auto flex-1">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              룰렛 이름
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="예: 시참룰렛"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base sm:text-sm text-white placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none min-h-[44px]"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              URL 이름 (영문 소문자/숫자/하이픈)
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              maxLength={40}
              placeholder="예: siecham"
              pattern="[a-z0-9_-]+"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base sm:text-sm text-white placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none min-h-[44px] font-mono"
              required
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              OBS 브라우저 소스 URL: <span className="text-white/80">/overlay/{slug || 'siecham'}</span>
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                회전 시간 (ms)
              </span>
              <input
                type="number"
                min={1000}
                max={20000}
                step={500}
                value={spinDurationMs}
                onChange={(e) => setSpinDurationMs(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base sm:text-sm text-white focus:border-primary/50 focus:outline-none min-h-[44px] [color-scheme:dark]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                결과 표시 (ms)
              </span>
              <input
                type="number"
                min={0}
                max={30000}
                step={500}
                value={showResultMs}
                onChange={(e) => setShowResultMs(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base sm:text-sm text-white focus:border-primary/50 focus:outline-none min-h-[44px] [color-scheme:dark]"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={isPending}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                취소
              </Button>
              <Button type="submit" variant="accent" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? '저장' : '만들기'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
