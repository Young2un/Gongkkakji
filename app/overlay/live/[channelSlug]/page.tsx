import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LiveOverlayClient } from '@/components/roulette/live-overlay-client';
import type { RouletteItemRow, RouletteWheelRow } from '@/lib/roulette';

export const dynamic = 'force-dynamic';

/**
 * 채널 슬러그 기반 고정 오버레이.
 * 스트리머가 admin/roulette에서 "OBS에 표시"로 지정한 룰렛을 그린다.
 * 룰렛을 바꾸면 이 URL은 그대로지만 표시되는 룰렛이 자동 전환된다.
 */
export default async function LiveOverlayPage({
  params,
}: {
  params: { channelSlug: string };
}) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, channel_slug, active_roulette_wheel_id')
    .eq('channel_slug', params.channelSlug)
    .maybeSingle<{
      id: string;
      channel_slug: string | null;
      active_roulette_wheel_id: string | null;
    }>();

  if (!profile) notFound();

  // 활성 wheel + items 로드 (있을 때만)
  let wheel: RouletteWheelRow | null = null;
  let items: RouletteItemRow[] = [];
  if (profile.active_roulette_wheel_id) {
    const { data: w } = await supabase
      .from('roulette_wheels')
      .select(
        'id, owner_id, slug, title, spin_duration_ms, display_mode, created_at, updated_at'
      )
      .eq('id', profile.active_roulette_wheel_id)
      .maybeSingle<RouletteWheelRow>();

    if (w && w.owner_id === profile.id) {
      wheel = w;
      const { data: rows } = await supabase
        .from('roulette_items')
        .select('id, wheel_id, label, color, position, weight, created_at')
        .eq('wheel_id', w.id)
        .order('position', { ascending: true });
      items = (rows ?? []) as RouletteItemRow[];
    }
  }

  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      <LiveOverlayClient
        ownerId={profile.id}
        initialWheel={wheel}
        initialItems={items}
      />
    </>
  );
}
