import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    glow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', glow = false, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-primary text-primary-foreground hover:brightness-110": variant === 'primary',
                        "bg-secondary text-secondary-foreground hover:brightness-110": variant === 'secondary',
                        "glass-panel hover:bg-white/10": variant === 'glass',
                        "hover:bg-accent/10 hover:text-accent": variant === 'ghost',
                        "neon-border": glow,
                        "h-8 px-3 text-xs": size === 'sm',
                        "h-10 px-4 py-2": size === 'md',
                        "h-12 px-6 text-lg": size === 'lg',
                        "h-10 w-10 p-0": size === 'icon',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";
