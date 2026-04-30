'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Trash2 } from 'lucide-react';
import { createEvent, updateEvent, deleteEvent } from '@/app/actions/events';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EventType } from '@/lib/events';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: {
    id: string;
    type: EventType;
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string | null;
    all_day: boolean;
    recurring_yearly: boolean;
  } | null;
}

// "YYYY-MM-DDTHH:mm" (KST 입력) → UTC ISO
function kstLocalToUtcIso(local: string, allDay = false): string {
  if (!local) return '';
  // datetime-local 또는 date 둘 다 처리
  const normalized = allDay || local.length === 10 ? `${local}T00:00` : local;
  return new Date(`${normalized}:00+09:00`).toISOString();
}

// UTC ISO → "YYYY-MM-DDTHH:mm" (KST, datetime-local input용)
function utcIsoToKstLocal(iso: string, dateOnly = false): string {
  const d = new Date(iso);
  const k = new Date(d.getTime() + 9 * 60 * 60_000);
  const yyyy = k.getUTCFullYear();
  const mm = String(k.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(k.getUTCDate()).padStart(2, '0');
  if (dateOnly) return `${yyyy}-${mm}-${dd}`;
  const hh = String(k.getUTCHours()).padStart(2, '0');
  const mi = String(k.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function EventForm({ open, onClose, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<EventType>(initial?.type ?? 'broadcast');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startsAt, setStartsAt] = useState(
    initial ? utcIsoToKstLocal(initial.starts_at, initial.all_day) : ''
  );
  const [endsAt, setEndsAt] = useState(
    initial?.ends_at ? utcIsoToKstLocal(initial.ends_at) : ''
  );
  const [recurringYearly, setRecurringYearly] = useState(
    initial?.recurring_yearly ?? false
  );

  if (!open) return null;

  const isEdit = !!initial;
  const isAnniversary = type === 'anniversary';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startsAt) {
      alert('제목과 일자를 입력해주세요.');
      return;
    }

    startTransition(async () => {
      const payload = {
        type,
        title: title.trim(),
        description: description.trim() || null,
        startsAt: kstLocalToUtcIso(startsAt, isAnniversary),
        endsAt: !isAnniversary && endsAt ? kstLocalToUtcIso(endsAt) : null,
        allDay: isAnniversary,
        recurringYearly: isAnniversary ? true : recurringYearly,
      };

      const res = isEdit
        ? await updateEvent({ id: initial!.id, ...payload })
        : await createEvent(payload);

      if ('error' in res && res.error) {
        alert(res.error);
        return;
      }

      router.refresh();
      onClose();
    });
  };

  const handleDelete = () => {
    if (!initial) return;
    if (!confirm('이 일정을 삭제할까요?')) return;
    startTransition(async () => {
      const res = await deleteEvent(initial.id);
      if ('error' in res && res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-bold text-white">
            {isEdit ? '일정 수정' : '새 일정'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* 종류 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('broadcast')}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition',
                type === 'broadcast'
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
              )}
            >
              방송 일정
            </button>
            <button
              type="button"
              onClick={() => setType('anniversary')}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition',
                type === 'anniversary'
                  ? 'border-accent/60 bg-accent/15 text-accent'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
              )}
            >
              기념일
            </button>
          </div>

          {/* 제목 */}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              제목
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder={
                isAnniversary ? '예: 김공은 생일' : '예: 오늘 9시 OW 랭크'
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
              required
            />
          </label>

          {/* 시작 */}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              {isAnniversary ? '날짜' : '시작 시간 (KST)'}
            </span>
            <input
              type={isAnniversary ? 'date' : 'datetime-local'}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
              required
            />
          </label>

          {/* 종료 (방송만) */}
          {!isAnniversary && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                종료 시간 (선택, KST)
              </span>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
              />
            </label>
          )}

          {/* 매년 반복 (방송만 옵션, 기념일은 항상 반복) */}
          {!isAnniversary && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={recurringYearly}
                onChange={(e) => setRecurringYearly(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5"
              />
              매년 반복
            </label>
          )}

          {/* 설명 */}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              설명 (선택)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="추가 설명을 입력하세요"
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
            />
          </label>

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
                {isEdit ? '저장' : '등록'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
