'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { SLUG_PATTERN, pickWeightedIndex } from '@/lib/roulette';

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
    return { error: '스트리머만 룰렛을 관리할 수 있어요' as const };
  }

  return { supabase, user };
}

const wheelSchema = z.object({
  slug: z
    .string()
    .min(1, 'URL용 이름을 입력해주세요')
    .max(40)
    .regex(SLUG_PATTERN, '영문 소문자/숫자/하이픈만 사용 가능해요'),
  title: z.string().min(1, '룰렛 이름을 입력해주세요').max(60),
  donationThreshold: z.number().int().min(0).nullable(),
  spinDurationMs: z.number().int().min(1000).max(20000),
  showResultMs: z.number().int().min(0).max(30000),
});

export async function createWheel(input: {
  slug: string;
  title: string;
  donationThreshold: number | null;
  spinDurationMs: number;
  showResultMs: number;
}) {
  const parsed = wheelSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다' };
  }

  const auth = await requireStreamer();
  if ('error' in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from('roulette_wheels')
    .insert({
      owner_id: auth.user.id,
      slug: parsed.data.slug,
      title: parsed.data.title,
      donation_threshold: parsed.data.donationThreshold,
      spin_duration_ms: parsed.data.spinDurationMs,
      show_result_ms: parsed.data.showResultMs,
    })
    .select('id, slug')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: '이미 사용 중인 URL 이름이에요' };
    }
    return { error: '룰렛 생성에 실패했어요' };
  }

  revalidatePath('/admin/roulette');
  return { success: true, wheel: data };
}

export async function updateWheel(input: {
  id: string;
  slug: string;
  title: string;
  donationThreshold: number | null;
  spinDurationMs: number;
  showResultMs: number;
}) {
  const parsed = wheelSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다' };
  }

  const auth = await requireStreamer();
  if ('error' in auth) return { error: auth.error };

  const { error } = await auth.supabase
    .from('roulette_wheels')
    .update({
      slug: parsed.data.slug,
      title: parsed.data.title,
      donation_threshold: parsed.data.donationThreshold,
      spin_duration_ms: parsed.data.spinDurationMs,
      show_result_ms: parsed.data.showResultMs,
    })
    .eq('id', input.id)
    .eq('owner_id', auth.user.id);

  if (error) {
    if (error.code === '23505') {
      return { error: '이미 사용 중인 URL 이름이에요' };
    }
    return { error: '룰렛 수정에 실패했어요' };
  }

  revalidatePath('/admin/roulette');
  revalidatePath(`/admin/roulette/${parsed.data.slug}/edit`);
  return { success: true };
}

export async function deleteWheel(id: string) {
  const auth = await requireStreamer();
  if ('error' in auth) return { error: auth.error };

  const { error } = await auth.supabase
    .from('roulette_wheels')
    .delete()
    .eq('id', id)
    .eq('owner_id', auth.user.id);

  if (error) return { error: '룰렛 삭제에 실패했어요' };

  revalidatePath('/admin/roulette');
  return { success: true };
}

const itemSchema = z.object({
  label: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  weight: z.number().int().min(1).max(1000),
});

const replaceItemsSchema = z.object({
  wheelId: z.string().uuid(),
  items: z
    .array(itemSchema)
    .min(2, '항목을 2개 이상 입력해주세요')
    .max(40, '항목은 최대 40개까지 가능해요'),
});

/**
 * 항목 전체 교체. 단순한 delete + insert 전략.
 * 항목 수가 적기 때문에 충분.
 */
export async function replaceItems(input: {
  wheelId: string;
  items: { label: string; color: string | null; weight: number }[];
}) {
  const parsed = replaceItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '항목이 올바르지 않습니다' };
  }

  const auth = await requireStreamer();
  if ('error' in auth) return { error: auth.error };

  // 소유 확인
  const { data: wheel } = await auth.supabase
    .from('roulette_wheels')
    .select('id, owner_id, slug')
    .eq('id', input.wheelId)
    .maybeSingle();

  if (!wheel || wheel.owner_id !== auth.user.id) {
    return { error: '권한이 없어요' };
  }

  const { error: delErr } = await auth.supabase
    .from('roulette_items')
    .delete()
    .eq('wheel_id', input.wheelId);
  if (delErr) {
    console.error('[roulette.replaceItems delete]', delErr);
    return { error: `항목 삭제 실패: ${delErr.message}` };
  }

  const rows = parsed.data.items.map((it, i) => ({
    wheel_id: input.wheelId,
    label: it.label.trim(),
    color: it.color,
    weight: it.weight,
    position: i,
  }));

  const { error: insErr } = await auth.supabase.from('roulette_items').insert(rows);
  if (insErr) {
    console.error('[roulette.replaceItems insert]', insErr);
    return { error: `항목 저장 실패: ${insErr.message}` };
  }

  revalidatePath(`/admin/roulette/${wheel.slug}/edit`);
  revalidatePath(`/overlay/${wheel.slug}`);
  revalidatePath(`/control/${wheel.slug}`);
  return { success: true };
}

/**
 * 룰렛 돌리기. 컨트롤 페이지에서 호출.
 * - 서버에서 균등 랜덤으로 결과 결정
 * - spins insert → Realtime으로 overlay에 전달
 */
const spinSchema = z.object({
  wheelId: z.string().uuid(),
  triggeredBy: z.enum(['manual', 'donation']).default('manual'),
  donorName: z.string().max(40).nullable().optional(),
  donorAmount: z.number().int().min(0).nullable().optional(),
});

export async function spinWheel(input: {
  wheelId: string;
  triggeredBy?: 'manual' | 'donation';
  donorName?: string | null;
  donorAmount?: number | null;
}) {
  const parsed = spinSchema.safeParse(input);
  if (!parsed.success) {
    return { error: '입력값이 올바르지 않습니다' };
  }

  const auth = await requireStreamer();
  if ('error' in auth) return { error: auth.error };

  const { data: wheel } = await auth.supabase
    .from('roulette_wheels')
    .select('id, owner_id')
    .eq('id', input.wheelId)
    .maybeSingle();
  if (!wheel || wheel.owner_id !== auth.user.id) {
    return { error: '권한이 없어요' };
  }

  const { data: items } = await auth.supabase
    .from('roulette_items')
    .select('id, weight')
    .eq('wheel_id', input.wheelId)
    .order('position', { ascending: true });

  if (!items || items.length < 2) {
    return { error: '항목이 2개 이상 있어야 돌릴 수 있어요' };
  }

  const idx = pickWeightedIndex(
    items.map((it) => ({ weight: (it as { weight: number }).weight }))
  );
  if (idx < 0) {
    return { error: '가중치가 모두 0이라 돌릴 수 없어요' };
  }
  const resultItemId = items[idx].id;

  const { data: spin, error } = await auth.supabase
    .from('roulette_spins')
    .insert({
      wheel_id: input.wheelId,
      result_item_id: resultItemId,
      triggered_by: parsed.data.triggeredBy,
      donor_name: parsed.data.donorName ?? null,
      donor_amount: parsed.data.donorAmount ?? null,
      status: 'spinning',
    })
    .select('id, result_item_id')
    .single();

  if (error) return { error: '돌리기에 실패했어요' };

  return { success: true, spin };
}
