import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ItemEditor } from '@/components/roulette/item-editor';
import { WheelPreview } from '@/components/roulette/wheel-preview';
import type { RouletteItemRow, RouletteWheelRow } from '@/lib/roulette';

export const dynamic = 'force-dynamic';

export default async function RouletteEditPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/admin/roulette/${params.slug}/edit`);
  }

  const { data: wheel } = await supabase
    .from('roulette_wheels')
    .select(
      'id, owner_id, slug, title, spin_duration_ms, show_result_ms, created_at, updated_at'
    )
    .eq('owner_id', user.id)
    .eq('slug', params.slug)
    .maybeSingle<RouletteWheelRow>();

  if (!wheel) {
    notFound();
  }

  const { data: items } = await supabase
    .from('roulette_items')
    .select('id, wheel_id, label, color, position, weight, created_at')
    .eq('wheel_id', wheel.id)
    .order('position', { ascending: true });

  const rows = (items ?? []) as RouletteItemRow[];

  return (
    <div className="mx-auto max-w-3xl pt-2">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin/roulette"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> 룰렛 목록
        </Link>
        <Link
          href={`/control/${wheel.slug}`}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
        >
          컨트롤 페이지 →
        </Link>
      </div>

      <h1 className="text-xl font-bold text-white">{wheel.title}</h1>
      <p className="mt-1 text-xs text-muted-foreground font-mono">
        OBS URL: /overlay/{wheel.slug}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        <div className="flex justify-center md:block">
          <WheelPreview items={rows} />
        </div>
        <ItemEditor wheelId={wheel.id} initialItems={rows} />
      </div>
    </div>
  );
}
