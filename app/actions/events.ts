'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const eventSchema = z
  .object({
    type: z.enum(['broadcast', 'anniversary']),
    title: z.string().min(1, '제목을 입력해주세요').max(100),
    description: z.string().max(500).optional().nullable(),
    startsAt: z.string().min(1, '시작 일시를 입력해주세요'),
    endsAt: z.string().optional().nullable(),
    allDay: z.boolean().default(false),
    recurringYearly: z.boolean().default(false),
  })
  .refine(
    (v) => {
      if (!v.endsAt) return true;
      return new Date(v.endsAt).getTime() >= new Date(v.startsAt).getTime();
    },
    { message: '종료 시간은 시작 시간 이후여야 합니다', path: ['endsAt'] }
  );

async function requireStreamer() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' as const };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['streamer', 'admin'].includes(profile.role)) {
    return { error: '스트리머만 일정을 관리할 수 있어요' as const };
  }

  return { supabase, user };
}

export async function createEvent(input: {
  type: 'broadcast' | 'anniversary';
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  allDay?: boolean;
  recurringYearly?: boolean;
}) {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다' };
  }

  const auth = await requireStreamer();
  if ('error' in auth) return { error: auth.error };

  // anniversary는 항상 종일 + 매년 반복
  const allDay = parsed.data.type === 'anniversary' ? true : parsed.data.allDay;
  const recurringYearly =
    parsed.data.type === 'anniversary' ? true : parsed.data.recurringYearly;

  const { error } = await auth.supabase.from('events').insert({
    type: parsed.data.type,
    title: parsed.data.title,
    description: parsed.data.description || null,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt || null,
    all_day: allDay,
    recurring_yearly: recurringYearly,
    created_by: auth.user.id,
  });

  if (error) {
    return { error: '일정 등록에 실패했어요' };
  }

  revalidatePath('/calendar');
  revalidatePath('/');
  return { success: true };
}

export async function updateEvent(input: {
  id: string;
  type: 'broadcast' | 'anniversary';
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  allDay?: boolean;
  recurringYearly?: boolean;
}) {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다' };
  }

  const auth = await requireStreamer();
  if ('error' in auth) return { error: auth.error };

  const allDay = parsed.data.type === 'anniversary' ? true : parsed.data.allDay;
  const recurringYearly =
    parsed.data.type === 'anniversary' ? true : parsed.data.recurringYearly;

  const { error } = await auth.supabase
    .from('events')
    .update({
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt || null,
      all_day: allDay,
      recurring_yearly: recurringYearly,
    })
    .eq('id', input.id);

  if (error) {
    return { error: '일정 수정에 실패했어요' };
  }

  revalidatePath('/calendar');
  revalidatePath('/');
  return { success: true };
}

export async function deleteEvent(id: string) {
  const auth = await requireStreamer();
  if ('error' in auth) return { error: auth.error };

  const { error } = await auth.supabase.from('events').delete().eq('id', id);

  if (error) {
    return { error: '일정 삭제에 실패했어요' };
  }

  revalidatePath('/calendar');
  revalidatePath('/');
  return { success: true };
}
