import { LiveStatusBanner } from '@/components/layout/live-status-banner';
import { SiteHeader } from '@/components/layout/site-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { StoryBar } from '@/components/story/story-bar';
import { createClient } from '@/lib/supabase/server';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isStreamer = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    isStreamer = profile?.role === 'streamer' || profile?.role === 'admin';
  }

  return (
    <div className="min-h-screen bg-background dark text-foreground overflow-x-hidden">
      <LiveStatusBanner />
      <SiteHeader />
      <StoryBar />
      <main
        className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-8 relative z-10 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-8"
      >
        {children}
      </main>
      <BottomNav isStreamer={isStreamer} />
    </div>
  );
}
