import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            default: 'bg-foreground text-background hover:bg-foreground/90',
            outline: 'border border-border bg-background hover:bg-muted',
            ghost: 'hover:bg-muted',
            accent: 'bg-accent text-accent-foreground hover:bg-accent-hover',
          }[variant],
          {
            sm: 'h-9 px-3 text-sm',
            md: 'h-11 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
          }[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
