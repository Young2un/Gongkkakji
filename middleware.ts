import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // /@username → /u/username 내부 rewrite (URL 바에는 @ 유지)
  if (pathname.startsWith('/@') && pathname.length > 2) {
    const url = request.nextUrl.clone();
    url.pathname = `/u/${pathname.slice(2)}`;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에 적용:
     * - _next/static, _next/image
     * - favicon, 이미지 파일
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
