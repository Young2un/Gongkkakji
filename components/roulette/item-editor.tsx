'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { replaceItems } from '@/app/actions/roulette';
import {
  DEFAULT_PALETTE,
  colorForIndex,
  totalWeight,
  type RouletteItemRow,
} from '@/lib/roulette';

interface DraftItem {
  label: string;
  color: string | null;
  weight: number;
}

interface Props {
  wheelId: string;
  initialItems: RouletteItemRow[];
}

export function ItemEditor({ wheelId, initialItems }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<DraftItem[]>(
    initialItems.length > 0
      ? initialItems.map((it) => ({
          label: it.label,
          color: it.color,
          weight: it.weight ?? 1,
        }))
      : [
          { label: '', color: null, weight: 1 },
          { label: '', color: null, weight: 1 },
        ]
  );
  const [dirty, setDirty] = useState(false);

  const update = (next: DraftItem[]) => {
    setItems(next);
    setDirty(true);
  };

  const handleAdd = () => {
    update([...items, { label: '', color: null, weight: 1 }]);
  };

  const handleRemove = (i: number) => {
    update(items.filter((_, idx) => idx !== i));
  };

  const handleMove = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const handleLabelChange = (i: number, value: string) => {
    const next = items.slice();
    next[i] = { ...next[i], label: value };
    update(next);
  };

  const handleColorChange = (i: number, color: string) => {
    const next = items.slice();
    next[i] = { ...next[i], color };
    update(next);
  };

  const handleWeightChange = (i: number, value: string) => {
    const n = Math.max(1, Math.min(1000, Math.floor(Number(value) || 1)));
    const next = items.slice();
    next[i] = { ...next[i], weight: n };
    update(next);
  };

  const handleSave = () => {
    const clean = items
      .map((it) => ({
        label: it.label.trim(),
        color: it.color,
        weight: it.weight,
      }))
      .filter((it) => it.label.length > 0);
    if (clean.length < 2) {
      alert('항목을 2개 이상 입력해주세요.');
      return;
    }
    startTransition(async () => {
      const res = await replaceItems({ wheelId, items: clean });
      if ('error' in res && res.error) {
        alert(res.error);
        return;
      }
      setDirty(false);
      router.refresh();
    });
  };

  const sumW = totalWeight(items);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        가중치 합계: <span className="text-white">{sumW}</span> · 확률은 가중치 비율로 계산돼요.
      </p>

      <ul className="space-y-2">
        {items.map((it, i) => {
          const swatch = colorForIndex(i, it.color);
          const pct = sumW > 0 ? (it.weight / sumW) * 100 : 0;
          return (
            <li
              key={i}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2"
            >
              <ColorPicker
                value={swatch}
                onChange={(c) => handleColorChange(i, c)}
              />
              <input
                type="text"
                value={it.label}
                onChange={(e) => handleLabelChange(i, e.target.value)}
                maxLength={60}
                placeholder={`항목 ${i + 1}`}
                className="flex-1 min-w-0 rounded-lg border border-white/10 bg-background px-3 py-2 text-base sm:text-sm text-white placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none min-h-[40px]"
              />
              <div className="flex flex-col items-center w-16 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={it.weight}
                  onChange={(e) => handleWeightChange(i, e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-background px-2 py-1.5 text-sm text-white text-center focus:border-primary/50 focus:outline-none min-h-[36px] [color-scheme:dark]"
                  aria-label="가중치"
                />
                <span className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                  {pct.toFixed(pct < 10 ? 1 : 0)}%
                </span>
              </div>
              <div className="flex items-center">
                <IconBtn
                  onClick={() => handleMove(i, -1)}
                  disabled={i === 0}
                  label="위로"
                >
                  <ArrowUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  onClick={() => handleMove(i, 1)}
                  disabled={i === items.length - 1}
                  label="아래로"
                >
                  <ArrowDown className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  onClick={() => handleRemove(i)}
                  disabled={items.length <= 1}
                  label="삭제"
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          항목 추가
        </Button>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-300">저장되지 않은 변경</span>
          )}
          <Button
            variant="accent"
            onClick={handleSave}
            disabled={isPending || !dirty}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  onClick,
  disabled,
  label,
  className = '',
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={
        'rounded-md p-2 text-muted-foreground hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent min-w-[36px] min-h-[36px] flex items-center justify-center ' +
        className
      }
    >
      {children}
    </button>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 shrink-0 rounded-md border border-white/10"
        style={{ backgroundColor: value }}
        aria-label="색상 선택"
      />
      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10"
            aria-hidden
          />
          <div className="absolute left-0 top-11 z-20 grid grid-cols-4 gap-1 rounded-lg border border-white/10 bg-card p-2 shadow-xl">
            {DEFAULT_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="h-7 w-7 rounded-md border border-white/10 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
