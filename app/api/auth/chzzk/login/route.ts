import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getAuthorizationUrl } from '@/lib/chzzk';

/**
 * GET /api/auth/chzzk/login
 * 치지직 OAuth 동의 화면으로 리디렉트
 */
export async function GET() {
  // CSRF 방지용 state 생성
  const state = crypto.randomBytes(16).toString('hex');

  cookies().set('chzzk_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10분
  });

  return NextResponse.redirect(getAuthorizationUrl(state));
}
