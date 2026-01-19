import clsx from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium border',
        {
          'bg-muted/60 text-foreground border-border/60': variant === 'default',
          'bg-primary/15 text-primary border-primary/30': variant === 'primary',
          'bg-green-500/10 text-green-500 border-green-500/20': variant === 'success',
          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20': variant === 'warning',
          'bg-destructive/10 text-destructive border-destructive/20': variant === 'destructive',
        },
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-sm': size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  );
};
