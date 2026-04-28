import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { exchangeCodeForToken, getChzzkUser } from '@/lib/chzzk';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/chzzk/callback
 * 치지직에서 돌아온 뒤: 토큰 교환 → 유저 정보 조회 → Supabase 유저 생성/로그인
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // 1) state 검증 (CSRF)
  const savedState = cookies().get('chzzk_oauth_state')?.value;
  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }
  cookies().delete('chzzk_oauth_state');

  try {
    // 2) 토큰 교환
    const token = await exchangeCodeForToken(code, state);

    // 3) 유저 정보 조회
    const chzzkUser = await getChzzkUser(token.accessToken);

    // 4) Supabase에 유저 생성 or 기존 유저 찾기
    const supabase = createAdminClient();

    // 가상 이메일 (치지직은 이메일 제공 안 함)
    const email = `chzzk_${chzzkUser.channelId}@chzzk.local`;
    const password = `chzzk_${chzzkUser.channelId}_${process.env.CHZZK_CLIENT_SECRET!.slice(0, 16)}`;

    // 기존 유저 찾기
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('chzzk_channel_id', chzzkUser.channelId)
      .maybeSingle();

    let userId: string | null = null;

    if (existing) {
      // auth.users에 실제로 존재하는지 확인 (admin이 강제로 지운 경우 orphan)
      const { data: authUser } = await supabase.auth.admin.getUserById(
        existing.id
      );

      if (authUser?.user) {
        userId = existing.id;
        // CHZZK_CLIENT_SECRET이 바뀌어도 로그인이 끊기지 않도록
        // 매 로그인마다 현재 secret 기준 password로 동기화
        await supabase.auth.admin.updateUserById(userId, { password });
      } else {
        // orphan profile → 삭제하고 아래 신규 생성 플로우로 진행
        await supabase.from('profiles').delete().eq('id', existing.id);
        await supabase.from('chzzk_tokens').delete().eq('user_id', existing.id);
      }
    }

    if (!userId) {
      // 신규 생성
      const { data: created, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          chzzk_channel_id: chzzkUser.channelId,
          chzzk_channel_name: chzzkUser.channelName,
        },
      });

      if (error || !created.user) {
        throw new Error(`User creation failed: ${error?.message}`);
      }
      userId = created.user.id;

      // 프로필 레코드 생성
      await supabase.from('profiles').insert({
        id: userId,
        username: chzzkUser.channelName,
        display_name: chzzkUser.channelName,
        avatar_url: chzzkUser.profileImageUrl,
        chzzk_channel_id: chzzkUser.channelId,
        // 본인이 스트리머면 환경변수와 비교해서 자동 부여
        role:
          chzzkUser.channelId === process.env.STREAMER_CHANNEL_ID
            ? 'streamer'
            : 'fan',
      });
    }

    // 5) 치지직 토큰 저장 (refresh용)
    await supabase.from('chzzk_tokens').upsert(
      {
        user_id: userId,
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        expires_at: new Date(
          Date.now() + Number(token.expiresIn) * 1000
        ).toISOString(),
      },
      { onConflict: 'user_id' }
    );

    // 6) Supabase 세션 생성 (password 로그인)
    const cookieStore = cookies();
    const { createServerClient } = await import('@supabase/ssr');
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: CookieOptions) =>
            cookieStore.set({ name, value, ...options }),
          remove: (name: string, options: CookieOptions) =>
            cookieStore.set({ name, value: '', ...options }),
        },
      }
    );

    const { error: signInError } = await supabaseSSR.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw new Error(`Sign-in failed: ${signInError.message}`);
    }

    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error('[chzzk/callback]', error);
    const message = error instanceof Error ? error.message : 'unknown';
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }
}
