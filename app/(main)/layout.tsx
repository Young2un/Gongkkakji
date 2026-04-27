import { LiveStatusBanner } from '@/components/layout/live-status-banner';
import { SiteHeader } from '@/components/layout/site-header';
import { StoryBar } from '@/components/story/story-bar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background dark text-foreground">
      <LiveStatusBanner />
      <SiteHeader />
      <StoryBar />
      <main className="mx-auto max-w-5xl px-4 py-8 relative z-10">{children}</main>
    </div>
  );
}
