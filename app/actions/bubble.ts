'use server';

import { createClient } from '@/lib/supabase/server';

export async function sendBubbleMessage(content: string) {
  const text = content.trim();
  if (!text) return { error: '메시지를 입력해주세요' };
  if (text.length > 500) return { error: '메시지는 500자 이하로 작성해주세요' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: '로그인이 필요합니다' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return { error: '프로필을 찾을 수 없습니다' };

  const { error } = await supabase.from('bubble_messages').insert({
    user_id: user.id,
    user_name: profile.display_name || profile.username,
    user_avatar: profile.avatar_url,
    user_role: profile.role,
    content: text,
  });

  if (error) {
    return { error: '메시지 전송에 실패했어요' };
  }

  return { success: true };
}
