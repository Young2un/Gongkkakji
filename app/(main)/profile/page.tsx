import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/profile/profile-form';

export default async function MyProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, bio, avatar_url, role, chzzk_channel_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/login');

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">프로필</h1>
          <p className="text-sm text-muted-foreground">
            다른 사람에게 보여질 정보를 수정할 수 있어요
          </p>
        </div>
        <Link
          href={`/@${profile.username}`}
          className="inline-flex items-center gap-1 text-sm text-accent underline"
        >
          공개 프로필 보기
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </header>

      {profile.role === 'streamer' && profile.chzzk_channel_id && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <div className="font-medium">STREAMER 계정</div>
          <p className="mt-1 text-muted-foreground">
            연결된 치지직 채널 ID:{' '}
            <span className="font-mono text-xs">{profile.chzzk_channel_id}</span>
          </p>
        </div>
      )}

      <ProfileForm
        userId={user.id}
        initial={{
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        }}
      />
    </div>
  );
}
