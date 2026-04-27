import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BubbleChat, type BubbleMessage } from '@/components/bubble/bubble-chat';

export default async function BubblePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/bubble');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/');
  }

  // 초기 메시지 불러오기 (최근 100개)
  const { data: messages } = await supabase
    .from('bubble_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  // 과거순으로 정렬
  const sortedMessages = (messages || []).reverse() as BubbleMessage[];

  return (
    <div className="mx-auto max-w-3xl pt-4">
      <BubbleChat
        initialMessages={sortedMessages}
        currentUserId={user.id}
        currentUserRole={profile.role}
      />
    </div>
  );
}
