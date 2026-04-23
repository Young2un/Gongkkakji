'use client';

import { useOptimistic, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { CornerDownRight, Send } from 'lucide-react';
import { createComment } from '@/app/actions/board';
import { AuthorBadge } from './author-badge';
import { Button } from '@/components/ui/button';
import { timeAgo, cn } from '@/lib/utils';

export interface CommentAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

export interface CommentItem {
  id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  author: CommentAuthor | null;
  _pending?: boolean;
}

interface CommentSectionProps {
  postId: string;
  categorySlug: string;
  comments: CommentItem[];
  currentUser:
    | {
        id: string;
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
        role: string | null;
      }
    | null;
}

export function CommentSection({
  postId,
  categorySlug,
  comments: initialComments,
  currentUser,
}: CommentSectionProps) {
  type Action =
    | { type: 'add'; comment: CommentItem }
    | { type: 'remove'; tempId: string }
    | { type: 'replace'; tempId: string; comment: CommentItem };

  const [optimistic, dispatch] = useOptimistic(
    initialComments,
    (state, action: Action) => {
      if (action.type === 'add') return [...state, action.comment];
      if (action.type === 'remove')
        return state.filter((c) => c.id !== action.tempId);
      if (action.type === 'replace')
        return state.map((c) => (c.id === action.tempId ? action.comment : c));
      return state;
    }
  );

  // 부모-자식 구조로 정렬
  const roots = optimistic.filter((c) => !c.parent_id);
  const childrenOf = (id: string) =>
    optimistic.filter((c) => c.parent_id === id);

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">
        댓글 <span className="text-muted-foreground">{optimistic.length}</span>
      </h2>

      {currentUser ? (
        <CommentForm
          postId={postId}
          categorySlug={categorySlug}
          parentId={null}
          currentUser={currentUser}
          onAdd={(action) => dispatch(action)}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          댓글을 작성하려면{' '}
          <Link href="/login" className="underline">
            로그인
          </Link>
          이 필요해요
        </div>
      )}

      <ul className="space-y-5">
        {roots.length === 0 && (
          <li className="text-sm text-muted-foreground">
            아직 댓글이 없어요. 첫 댓글을 남겨보세요.
          </li>
        )}
        {roots.map((c) => (
          <li key={c.id} className="space-y-3">
            <CommentBubble comment={c} />
            <div className="space-y-3 pl-6">
              {childrenOf(c.id).map((child) => (
                <div key={child.id} className="flex gap-2">
                  <CornerDownRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <CommentBubble comment={child} />
                  </div>
                </div>
              ))}
              {currentUser && !c._pending && (
                <ReplyComposer
                  postId={postId}
                  categorySlug={categorySlug}
                  parentId={c.id}
                  currentUser={currentUser}
                  onAdd={(action) => dispatch(action)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CommentBubble({ comment }: { comment: CommentItem }) {
  return (
    <div
      className={cn(
        'space-y-1.5',
        comment._pending && 'opacity-60'
      )}
    >
      <div className="flex items-center justify-between">
        <AuthorBadge author={comment.author} />
        <span className="text-xs text-muted-foreground">
          {timeAgo(comment.created_at)}
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words pl-9 text-sm">
        {comment.content}
      </p>
    </div>
  );
}

function ReplyComposer(props: {
  postId: string;
  categorySlug: string;
  parentId: string;
  currentUser: CommentSectionProps['currentUser'];
  onAdd: (action: any) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        답글 달기
      </button>
    );
  }
  return (
    <CommentForm
      {...props}
      onClose={() => setOpen(false)}
      compact
    />
  );
}

function CommentForm({
  postId,
  categorySlug,
  parentId,
  currentUser,
  onAdd,
  onClose,
  compact,
}: {
  postId: string;
  categorySlug: string;
  parentId: string | null;
  currentUser: CommentSectionProps['currentUser'];
  onAdd: (action: any) => void;
  onClose?: () => void;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = ref.current?.value.trim() ?? '';
    if (!content || !currentUser) return;

    const tempId = `temp-${crypto.randomUUID()}`;
    const tempComment: CommentItem = {
      id: tempId,
      content,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      author: {
        id: currentUser.id,
        username: currentUser.username,
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url,
        role: currentUser.role,
      },
      _pending: true,
    };

    startTransition(async () => {
      onAdd({ type: 'add', comment: tempComment });
      if (ref.current) ref.current.value = '';

      const res = await createComment({
        postId,
        content,
        parentId,
        categorySlug,
      });

      if ('error' in res && res.error) {
        onAdd({ type: 'remove', tempId });
        alert(res.error);
      } else if ('data' in res && res.data) {
        const author = Array.isArray(res.data.author)
          ? res.data.author[0]
          : res.data.author;
        onAdd({
          type: 'replace',
          tempId,
          comment: {
            id: res.data.id,
            content: res.data.content,
            parent_id: res.data.parent_id,
            created_at: res.data.created_at,
            author,
          } as CommentItem,
        });
        onClose?.();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        ref={ref}
        rows={compact ? 2 : 3}
        placeholder={parentId ? '답글을 입력하세요' : '댓글을 입력하세요'}
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
        maxLength={1000}
        required
      />
      <div className="flex items-center justify-end gap-2">
        {onClose && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          <Send className="h-4 w-4" />
          {parentId ? '답글 달기' : '댓글 작성'}
        </Button>
      </div>
    </form>
  );
}
