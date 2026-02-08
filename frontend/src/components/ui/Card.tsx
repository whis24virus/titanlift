import React from 'react';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "glass-panel rounded-3xl p-6",
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";
