import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { WheelList } from '@/components/roulette/wheel-list';
import type { RouletteWheelRow } from '@/lib/roulette';

export const dynamic = 'force-dynamic';

export default async function RouletteAdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin/roulette');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['streamer', 'admin'].includes(profile.role)) {
    return (
      <div className="mx-auto max-w-md pt-10 text-center">
        <h1 className="text-base font-bold text-white">권한이 없어요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          스트리머 계정만 룰렛을 관리할 수 있어요.
        </p>
      </div>
    );
  }

  const { data: wheels } = await supabase
    .from('roulette_wheels')
    .select(
      'id, owner_id, slug, title, spin_duration_ms, show_result_ms, created_at, updated_at, roulette_items(count)'
    )
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (wheels ?? []).map((w: any) => ({
    ...(w as RouletteWheelRow),
    item_count: w.roulette_items?.[0]?.count ?? 0,
  }));

  // OBS URL 표시용 origin (서버에서 forwarded host 확인)
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host') ?? 'localhost:3000';
  const appOrigin = `${proto}://${host}`;

  return (
    <div className="mx-auto max-w-3xl pt-2">
      <WheelList wheels={rows} appOrigin={appOrigin} />
    </div>
  );
}
