'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
      aria-label="로그아웃"
      title="로그아웃"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
