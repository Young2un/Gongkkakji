import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Author {
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
}

interface AuthorBadgeProps {
  author: Author | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export function AuthorBadge({ author, size = 'sm', className }: AuthorBadgeProps) {
  const avatarSize = size === 'md' ? 'h-9 w-9' : 'h-7 w-7';
  const iconSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {author?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatar_url}
          alt=""
          className={cn(avatarSize, 'rounded-full object-cover')}
        />
      ) : (
        <span
          className={cn(
            avatarSize,
            'flex items-center justify-center rounded-full bg-muted'
          )}
        >
          <User className={iconSize} />
        </span>
      )}
      <div className="text-sm">
        <span className="font-medium">
          {author?.display_name ?? author?.username ?? '알 수 없음'}
        </span>
        {author?.role === 'streamer' && (
          <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
            STREAMER
          </span>
        )}
      </div>
    </div>
  );
}
