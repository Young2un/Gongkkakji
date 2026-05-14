'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RouletteWheel } from '@/components/roulette/roulette-wheel';
import type {
  RouletteItemRow,
  RouletteSpinRow,
  RouletteWheelRow,
} from '@/lib/roulette';

interface Props {
  wheel: RouletteWheelRow;
  initialItems: RouletteItemRow[];
}

type Phase = 'idle' | 'spinning' | 'result';

export function OverlayClient({ wheel, initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentSpin, setCurrentSpin] = useState<RouletteSpinRow | null>(null);
  const seenSpinIds = useRef<Set<string>>(new Set());

  const itemById = useMemo(() => {
    const m = new Map<string, RouletteItemRow>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  // Realtime: roulette_spins INSERT 구독 + 항목 변경도 같이 구독
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`roulette-overlay-${wheel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'roulette_spins',
          filter: `wheel_id=eq.${wheel.id}`,
        },
        (payload) => {
          const spin = payload.new as RouletteSpinRow;
          if (seenSpinIds.current.has(spin.id)) return;
          seenSpinIds.current.add(spin.id);
          setCurrentSpin(spin);
          setPhase('spinning');
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roulette_items',
          filter: `wheel_id=eq.${wheel.id}`,
        },
        async () => {
          // 항목이 추가/수정/삭제되면 다시 fetch
          const { data } = await supabase
            .from('roulette_items')
            .select('id, wheel_id, label, color, position, weight, created_at')
            .eq('wheel_id', wheel.id)
            .order('position', { ascending: true });
          if (data) setItems(data as RouletteItemRow[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wheel.id]);

  // 결과 표시 자동 숨김
  useEffect(() => {
    if (phase !== 'result') return;
    if (!wheel.show_result_ms || wheel.show_result_ms <= 0) return;
    const t = setTimeout(() => {
      setPhase('idle');
      setCurrentSpin(null);
    }, wheel.show_result_ms);
    return () => clearTimeout(t);
  }, [phase, wheel.show_result_ms]);

  const resultItem =
    currentSpin?.result_item_id != null
      ? itemById.get(currentSpin.result_item_id)
      : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="relative flex flex-col items-center gap-6">
        <RouletteWheel
          items={items}
          spinKey={
            phase === 'spinning' && currentSpin ? currentSpin.id : null
          }
          resultItemId={currentSpin?.result_item_id ?? null}
          spinDurationMs={wheel.spin_duration_ms}
          size={520}
          overlay
          onSpinEnd={() => setPhase('result')}
        />

        {phase === 'result' && resultItem && (
          <div
            className="pointer-events-none rounded-2xl border border-white/20 bg-black/70 px-8 py-5 text-center shadow-2xl backdrop-blur"
            style={{ animation: 'roulette-result-pop 400ms ease-out' }}
          >
            {currentSpin?.donor_name && (
              <p className="text-sm font-medium text-white/80">
                <span className="text-accent">{currentSpin.donor_name}</span>
                {currentSpin.donor_amount != null && (
                  <> · {currentSpin.donor_amount.toLocaleString()}원</>
                )}
                {' 후원 결과'}
              </p>
            )}
            <p
              className="mt-1 text-3xl font-extrabold text-white"
              style={{ color: resultItem.color ?? undefined }}
            >
              {resultItem.label}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes roulette-result-pop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
