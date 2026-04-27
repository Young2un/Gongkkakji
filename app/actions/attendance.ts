'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function claimAttendance() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data, error } = await supabase.rpc('claim_attendance');
  if (error) return { error: '출석 처리에 실패했어요' };

  // RPC는 table을 반환하므로 data는 배열
  const row = Array.isArray(data) ? data[0] : data;
  const result = {
    alreadyAttended: !!row?.already_attended,
    pointsEarned: row?.points_earned ?? 0,
    totalPoints: row?.total_points ?? 0,
  };

  revalidatePath('/');
  revalidatePath('/profile');
  return { data: result };
}
