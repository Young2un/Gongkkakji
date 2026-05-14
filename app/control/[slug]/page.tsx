import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ControlClient } from '@/components/roulette/control-client';
import type { RouletteItemRow, RouletteWheelRow } from '@/lib/roulette';

export const dynamic = 'force-dynamic';

export default async function ControlPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/control/${params.slug}`);
  }

  const { data: wheel } = await supabase
    .from('roulette_wheels')
    .select(
      'id, owner_id, slug, title, donation_threshold, spin_duration_ms, show_result_ms, created_at, updated_at'
    )
    .eq('owner_id', user.id)
    .eq('slug', params.slug)
    .maybeSingle<RouletteWheelRow>();

  if (!wheel) notFound();

  const { data: items } = await supabase
    .from('roulette_items')
    .select('id, wheel_id, label, color, position, weight, created_at')
    .eq('wheel_id', wheel.id)
    .order('position', { ascending: true });

  return (
    <ControlClient
      wheel={wheel}
      items={(items ?? []) as RouletteItemRow[]}
    />
  );
}
