import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { StoryUploader } from '@/components/story/story-uploader';
import { LogoutButton } from '@/components/layout/logout-button';
import { LogIn, User } from 'lucide-react';

export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, role')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 md:h-24 max-w-5xl items-center justify-between px-3 md:px-4 gap-2">
        <Link href="/" className="group flex items-center transition-transform hover:scale-105 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="공깍지 로고"
            className="h-10 md:h-20 w-auto object-contain -ml-1 md:-ml-2"
          />
        </Link>

        {/* 데스크톱 네비 (모바일은 BottomNav 사용) */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/bubble"
            className="rounded-md px-3 py-2 text-sm text-primary transition-all hover:bg-primary/10 font-bold"
          >
            공은talk
          </Link>
          <Link
            href="/c/notice"
            className="rounded-md px-3 py-2 text-sm text-foreground/70 transition-all hover:bg-white/5 hover:text-white font-medium"
          >
            공지
          </Link>
          <Link
            href="/c/free"
            className="rounded-md px-3 py-2 text-sm text-foreground/70 transition-all hover:bg-white/5 hover:text-white font-medium"
          >
            자유
          </Link>
          <Link
            href="/c/clips"
            className="rounded-md px-3 py-2 text-sm text-foreground/70 transition-all hover:bg-white/5 hover:text-white font-medium"
          >
            클립
          </Link>
          <Link
            href="/calendar"
            className="rounded-md px-3 py-2 text-sm text-foreground/70 transition-all hover:bg-white/5 hover:text-white font-medium"
          >
            일정
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 md:gap-2">
          {user && <StoryUploader userId={user.id} trigger="icon" />}
          {profile ? (
            <div className="flex items-center gap-1.5 md:gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 md:gap-2 rounded-full border border-white/10 py-1 pl-1 pr-2 md:pr-3 transition-colors hover:bg-white/10 min-h-[40px]"
                aria-label="내 프로필"
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover border border-primary/50"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border border-primary/50">
                    <User className="h-4 w-4" />
                  </span>
                )}
                <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                  {profile.display_name ?? profile.username}
                </span>
                {profile.role === 'streamer' && (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] md:text-xs text-white font-bold tracking-wider">
                    LIVE
                  </span>
                )}
              </Link>
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
            </div>
          ) : (
            <Link href="/login" aria-label="로그인">
              <Button size="sm" variant="outline" className="border-white/20 bg-transparent hover:bg-primary/20 hover:text-white hover:border-primary/50 transition-all min-h-[40px]">
                <LogIn className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">로그인</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
