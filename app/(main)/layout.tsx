import { LiveStatusBanner } from '@/components/layout/live-status-banner';
import { SiteHeader } from '@/components/layout/site-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { StoryBar } from '@/components/story/story-bar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <BottomNav />
    </div>
  );
}
