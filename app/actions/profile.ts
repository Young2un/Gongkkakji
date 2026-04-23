'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const profileSchema = z.object({
  display_name: z.string().trim().max(30).optional().nullable(),
  bio: z.string().trim().max(200).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

export async function updateProfile(input: {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다',
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const payload: Record<string, string | null> = {};
  if (parsed.data.display_name !== undefined)
    payload.display_name = parsed.data.display_name || null;
  if (parsed.data.bio !== undefined) payload.bio = parsed.data.bio || null;
  if (parsed.data.avatar_url !== undefined)
    payload.avatar_url = parsed.data.avatar_url || null;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select('username')
    .single();

  if (error || !data) return { error: '프로필 저장에 실패했어요' };

  revalidatePath('/profile');
  revalidatePath(`/u/${data.username}`);
  revalidatePath('/');
  return { ok: true };
}
