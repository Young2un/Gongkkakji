import { createClient } from '@/lib/supabase/server';
import { CalendarView } from '@/components/calendar/calendar-view';
import type { EventRow } from '@/lib/events';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canEdit = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    canEdit = profile?.role === 'streamer' || profile?.role === 'admin';
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: true });

  return (
    <div className="mx-auto max-w-3xl pt-2">
      <CalendarView events={(events ?? []) as EventRow[]} canEdit={canEdit} />
    </div>
  );
}
