import { ReactNode } from 'react';
import clsx from 'clsx';

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ children, className, padding = 'md' }: CardProps) => {
  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-secondary',
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
        },
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <div className={clsx('flex flex-col space-y-1.5 pb-4', className)}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <h3 className={clsx('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <p className={clsx('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
