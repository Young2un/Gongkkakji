'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Send, Loader2, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendBubbleMessage } from '@/app/actions/bubble';
import { cn } from '@/lib/utils';

export interface BubbleMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_role: string;
  content: string;
  created_at: string;
}

interface Props {
  initialMessages: BubbleMessage[];
  currentUserId: string;
  currentUserRole: string;
}

export function BubbleChat({ initialMessages, currentUserId, currentUserRole }: Props) {
  const [messages, setMessages] = useState<BubbleMessage[]>(initialMessages);
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 스크롤을 항상 아래로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 실시간 구독 (새 메시지가 올 때마다 리스트에 추가)
  useEffect(() => {
    const channel = supabase
      .channel('bubble_messages_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bubble_messages' },
        (payload) => {
          const newMsg = payload.new as BubbleMessage;
          // 내가 보낸 메시지거나, 상대방(스트리머/팬)이 보낸 메시지 필터링
          // (RLS가 이미 서버에서 막아주지만, 클라이언트 구독에서도 내가 볼 권한이 있는 것만 옴)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isPending) return;

    const content = text;
    setText(''); // 입력창 즉시 비우기

    startTransition(async () => {
      const res = await sendBubbleMessage(content);
      if (res.error) {
        alert(res.error);
        setText(content); // 실패 시 복구
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/30">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-white">공은 톡 (Secret Chat)</h2>
            <p className="text-xs text-muted-foreground">
              {currentUserRole === 'streamer'
                ? '팬들과의 1:1 메시지를 확인하세요'
                : '스트리머에게만 보이는 프라이빗 메시지입니다'}
            </p>
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            아직 대화가 없습니다. 첫 메시지를 보내보세요!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            const isStreamer = msg.user_role === 'streamer' || msg.user_role === 'admin';

            return (
              <div
                key={msg.id}
                className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}
              >
                <div className={cn('flex max-w-[80%] gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
                  {/* 프로필 이미지 (상대방일 때만 표시) */}
                  {!isMe && (
                    <div className="shrink-0">
                      {msg.user_avatar ? (
                        <img
                          src={msg.user_avatar}
                          alt=""
                          className={cn(
                            'h-8 w-8 rounded-full object-cover border',
                            isStreamer ? 'border-primary/50' : 'border-white/10'
                          )}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-white/10">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
                    {/* 이름 (상대방일 때만 표시) */}
                    {!isMe && (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {msg.user_name}
                        </span>
                        {isStreamer && (
                          <span className="rounded bg-primary/20 px-1 py-0.5 text-[10px] font-bold text-primary">
                            스트리머
                          </span>
                        )}
                      </div>
                    )}

                    {/* 말풍선 */}
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed break-words',
                        isMe
                          ? 'bg-primary text-white rounded-tr-sm'
                          : isStreamer
                          ? 'bg-primary/20 border border-primary/30 text-white rounded-tl-sm'
                          : 'bg-white/10 border border-white/5 text-white/90 rounded-tl-sm'
                      )}
                    >
                      {msg.content}
                    </div>
                    
                    {/* 시간 */}
                    <span className="text-[10px] text-muted-foreground/60 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-white/10 bg-black/20 p-4">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하세요..."
            maxLength={500}
            className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-5 pr-14 text-sm text-white placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={!text.trim() || isPending}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 -ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
