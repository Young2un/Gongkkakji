import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OverlayClient } from '@/components/roulette/overlay-client';
import type { RouletteItemRow, RouletteWheelRow } from '@/lib/roulette';

export const dynamic = 'force-dynamic';

/**
 * OBS 브라우저 소스용 오버레이 페이지.
 * 비로그인 접근 가능 (RLS는 select using (true)).
 * 본인 인증이 필요한 것은 컨트롤 페이지 쪽에서 처리.
 */
export default async function OverlayPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: wheel } = await supabase
    .from('roulette_wheels')
    .select(
      'id, owner_id, slug, title, spin_duration_ms, show_result_ms, created_at, updated_at'
    )
    .eq('slug', params.slug)
    .maybeSingle<RouletteWheelRow>();

  if (!wheel) notFound();

  const { data: items } = await supabase
    .from('roulette_items')
    .select('id, wheel_id, label, color, position, weight, created_at')
    .eq('wheel_id', wheel.id)
    .order('position', { ascending: true });

  return (
    <>
      {/* OBS 브라우저 소스에서 투명 배경 합성 */}
      <style>{`html, body { background: transparent !important; }`}</style>
      <OverlayClient
        wheel={wheel}
        initialItems={(items ?? []) as RouletteItemRow[]}
      />
    </>
  );
}
