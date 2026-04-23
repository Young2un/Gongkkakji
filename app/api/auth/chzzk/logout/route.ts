import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revokeToken } from '@/lib/chzzk';

/**
 * POST /api/auth/chzzk/logout
 * Supabase 세션 종료 + 치지직 토큰 revoke
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 치지직 토큰 revoke (best-effort)
    const { data: tokens } = await supabase
      .from('chzzk_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tokens?.access_token) {
      revokeToken(tokens.access_token).catch(console.error);
    }
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
