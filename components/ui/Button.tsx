import { forwardRef, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          // Base styles
          'inline-flex items-center justify-center rounded-standard font-medium',
          'border border-transparent shadow-none',
          // Transitions for micro-interactions
          'transition-all duration-fast ease-out',
          'hover:scale-[1.02] active:scale-[0.98]',
          // Focus states for accessibility
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100',
          
          // Variants
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md':
              variant === 'primary',
            'bg-secondary text-secondary-foreground border-border/60 hover:bg-secondary/80':
              variant === 'secondary',
            'bg-transparent text-foreground hover:bg-accent/20 hover:text-accent-foreground':
              variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90':
              variant === 'destructive',
            'bg-success text-success-foreground hover:bg-success/90':
              variant === 'success',
            'bg-warning text-warning-foreground hover:bg-warning/90':
              variant === 'warning',
          },
          
          // Sizes
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
