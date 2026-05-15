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

  // Realtime: roulette_spins INSERT 구독.
  // 주의: 한 채널에 publication에 없는 테이블 바인딩을 같이 걸면
  // 채널 자체가 ERROR로 떨어져서 spins 이벤트도 못 받는 케이스가 있음.
  // 그래서 roulette_items 구독은 일부러 뺐다 — items는 페이지 새로고침으로 갱신.
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
      .subscribe((status, err) => {
        // 구독 상태 확인용 (콘솔로 확인). 정상이면 'SUBSCRIBED'.
        // CHANNEL_ERROR / TIMED_OUT 이면 RLS / publication 문제.
        console.log('[roulette-overlay] realtime status:', status, err);
      });

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
