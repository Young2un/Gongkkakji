import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { StoryUploader } from '@/components/story/story-uploader';
import { AttendanceButton } from '@/components/attendance/attendance-button';
import { LogoutButton } from '@/components/layout/logout-button';
import { LogIn, User } from 'lucide-react';

export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let attendedToday = false;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, role')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;

    // KST 기준 오늘 날짜로 출석 여부 확인
    const todayKst = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
    )
      .toISOString()
      .slice(0, 10);
    const { data: att } = await supabase
      .from('attendance')
      .select('date')
      .eq('user_id', user.id)
      .eq('date', todayKst)
      .maybeSingle();
    attendedToday = !!att;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 md:h-24 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center transition-transform hover:scale-105">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/images/logo.png" 
            alt="공깍지 로고" 
            className="h-16 md:h-20 w-auto object-contain -ml-2"
          />
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/bubble"
            className="rounded-md px-3 py-2 text-sm text-primary transition-all hover:bg-primary/10 font-bold"
          >
            공은톡
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
        </nav>

        <div className="flex items-center gap-2">
          {user && <AttendanceButton initialAttended={attendedToday} />}
          {user && <StoryUploader userId={user.id} trigger="icon" />}
          {profile ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 transition-colors hover:bg-white/10"
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
                <span className="text-sm font-medium">
                  {profile.display_name ?? profile.username}
                </span>
                {profile.role === 'streamer' && (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-white font-bold tracking-wider">
                    LIVE
                  </span>
                )}
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="border-white/20 bg-transparent hover:bg-primary/20 hover:text-white hover:border-primary/50 transition-all">
                <LogIn className="h-4 w-4 mr-1" />
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
