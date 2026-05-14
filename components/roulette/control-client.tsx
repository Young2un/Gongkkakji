'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Play, ChevronLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { spinWheel } from '@/app/actions/roulette';
import { createClient } from '@/lib/supabase/client';
import {
  colorForIndex,
  type RouletteItemRow,
  type RouletteSpinRow,
  type RouletteWheelRow,
} from '@/lib/roulette';

interface Props {
  wheel: RouletteWheelRow;
  items: RouletteItemRow[];
}

export function ControlClient({ wheel, items }: Props) {
  const [isPending, startTransition] = useTransition();
  const [donorName, setDonorName] = useState('');
  const [donorAmount, setDonorAmount] = useState('');
  const [lastSpin, setLastSpin] = useState<RouletteSpinRow | null>(null);

  // 최근 spin 1건 + Realtime으로 새 spin 받기 (overlay 동기화 모니터링용)
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from('roulette_spins')
      .select('*')
      .eq('wheel_id', wheel.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!cancelled && data && data[0]) {
          setLastSpin(data[0] as RouletteSpinRow);
        }
      });

    const channel = supabase
      .channel(`roulette-control-${wheel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'roulette_spins',
          filter: `wheel_id=eq.${wheel.id}`,
        },
        (payload) => {
          setLastSpin(payload.new as RouletteSpinRow);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [wheel.id]);

  const handleSpin = () => {
    if (items.length < 2) {
      alert('항목이 2개 이상 있어야 돌릴 수 있어요. 항목 편집에서 추가해주세요.');
      return;
    }

    const amountTrim = donorAmount.trim();
    const amountNum = amountTrim ? Number(amountTrim) : null;
    if (amountNum != null && (!Number.isFinite(amountNum) || amountNum < 0)) {
      alert('후원 금액은 0 이상의 숫자여야 해요.');
      return;
    }

    const trimmedName = donorName.trim();
    startTransition(async () => {
      const res = await spinWheel({
        wheelId: wheel.id,
        triggeredBy: 'manual',
        donorName: trimmedName || null,
        donorAmount: amountNum,
      });
      if ('error' in res && res.error) {
        alert(res.error);
        return;
      }
      // 입력값은 다음 spin 위해 비움
      setDonorName('');
      setDonorAmount('');
    });
  };

  const resultLabel = lastSpin?.result_item_id
    ? items.find((it) => it.id === lastSpin.result_item_id)?.label
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/roulette"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> 룰렛 목록
        </Link>
        <Link
          href={`/admin/roulette/${wheel.slug}/edit`}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
        >
          <Pencil className="h-3.5 w-3.5" /> 항목 편집
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-white">{wheel.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          후원 정보를 입력하고 "돌리기"를 누르면 OBS 오버레이가 돌아갑니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            후원자 닉네임 (선택)
          </span>
          <input
            type="text"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            maxLength={40}
            placeholder="예: 응원해요"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base text-white placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none min-h-[44px]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            후원 금액 (선택)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={donorAmount}
            onChange={(e) => setDonorAmount(e.target.value)}
            placeholder="예: 5000"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base text-white placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none min-h-[44px] [color-scheme:dark]"
          />
        </label>

        <Button
          variant="accent"
          onClick={handleSpin}
          disabled={isPending || items.length < 2}
          className="w-full h-12 text-base"
        >
          <Play className="h-5 w-5" />
          돌리기
        </Button>

        {items.length < 2 && (
          <p className="text-center text-xs text-amber-300">
            항목이 부족해요. 항목 편집에서 2개 이상 추가해주세요.
          </p>
        )}
      </div>

      {lastSpin && resultLabel && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] text-muted-foreground">최근 결과</p>
          <p className="mt-1 text-base font-bold text-white">{resultLabel}</p>
          {lastSpin.donor_name && (
            <p className="mt-1 text-xs text-muted-foreground">
              {lastSpin.donor_name}
              {lastSpin.donor_amount != null &&
                ` · ${lastSpin.donor_amount.toLocaleString()}원`}
            </p>
          )}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          현재 항목 ({items.length}개)
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <li
              key={it.id}
              className="rounded-full border border-white/10 px-2.5 py-1 text-xs"
              style={{
                backgroundColor: `${colorForIndex(i, it.color)}22`,
                borderColor: colorForIndex(i, it.color),
              }}
            >
              {it.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
