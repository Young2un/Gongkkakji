'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OverlayClient } from '@/components/roulette/overlay-client';
import type { RouletteItemRow, RouletteWheelRow } from '@/lib/roulette';

interface Props {
  ownerId: string;
  initialWheel: RouletteWheelRow | null;
  initialItems: RouletteItemRow[];
}

/**
 * 채널 단위 오버레이.
 * - profiles.active_roulette_wheel_id 변화를 Realtime으로 감지.
 * - 활성 wheel이 바뀌면 새 wheel + items를 다시 가져온 뒤,
 *   `key={wheel.id}` 로 OverlayClient를 통째로 리마운트해서 spins 구독도 갈아끼움.
 */
export function LiveOverlayClient({ ownerId, initialWheel, initialItems }: Props) {
  const [wheel, setWheel] = useState<RouletteWheelRow | null>(initialWheel);
  const [items, setItems] = useState<RouletteItemRow[]>(initialItems);

  useEffect(() => {
    const supabase = createClient();

    const reloadFor = async (activeWheelId: string | null) => {
      if (!activeWheelId) {
        setWheel(null);
        setItems([]);
        return;
      }
      const { data: w } = await supabase
        .from('roulette_wheels')
        .select(
          'id, owner_id, slug, title, spin_duration_ms, display_mode, created_at, updated_at'
        )
        .eq('id', activeWheelId)
        .maybeSingle<RouletteWheelRow>();
      if (!w || w.owner_id !== ownerId) {
        setWheel(null);
        setItems([]);
        return;
      }
      const { data: rows } = await supabase
        .from('roulette_items')
        .select('id, wheel_id, label, color, position, weight, created_at')
        .eq('wheel_id', w.id)
        .order('position', { ascending: true });
      setWheel(w);
      setItems((rows ?? []) as RouletteItemRow[]);
    };

    const channel = supabase
      .channel(`roulette-live-${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${ownerId}`,
        },
        (payload) => {
          const next = payload.new as { active_roulette_wheel_id: string | null };
          setWheel((current) => {
            if (current?.id === next.active_roulette_wheel_id) return current;
            reloadFor(next.active_roulette_wheel_id);
            return current;
          });
        }
      )
      .subscribe((status, err) => {
        console.log('[roulette-live] realtime status:', status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId]);

  if (!wheel) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-white/60">
          표시할 룰렛이 선택되지 않았어요
        </p>
      </div>
    );
  }

  // wheel.id를 key로 두면 wheel 교체 시 OverlayClient가 새로 마운트되어
  // spins Realtime 채널도 깨끗하게 재구독된다.
  return (
    <OverlayClient
      key={wheel.id}
      wheel={wheel}
      initialItems={items}
    />
  );
}
