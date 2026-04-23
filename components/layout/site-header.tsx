import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { StoryUploader } from '@/components/story/story-uploader';
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          공은이를 향한 박수갈채
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/c/notice"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            공지
          </Link>
          <Link
            href="/c/free"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            자유
          </Link>
          <Link
            href="/c/clips"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            클립
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user && <StoryUploader userId={user.id} trigger="icon" />}
          {profile ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 hover:bg-muted"
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </span>
              )}
              <span className="text-sm">
                {profile.display_name ?? profile.username}
              </span>
              {profile.role === 'streamer' && (
                <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-white">
                  STREAMER
                </span>
              )}
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline">
                <LogIn className="h-4 w-4" />
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
