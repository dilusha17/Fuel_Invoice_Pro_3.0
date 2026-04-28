import * as React from 'react';
import { cn } from '@/lib/utils';

interface AuthCardProps {
    children: React.ReactNode;
    className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
    return (
        <div
            className={cn(
                'w-full max-w-[420px] bg-card/80 backdrop-blur-sm rounded-2xl',
                'border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)]',
                'p-8 animate-fade-in',
                className,
            )}
        >
            {children}
        </div>
    );
}
