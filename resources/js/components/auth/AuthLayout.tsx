import * as React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-background via-muted/30 to-background flex flex-col">
            <main className="flex-1 flex items-center justify-center p-4 pb-16">
                {children}
            </main>
            <footer className="fixed bottom-0 left-0 right-0 py-3 px-4 text-center text-xs text-muted-foreground bg-gradient-to-t from-background via-background to-transparent">
                Designed by DE Creations (PVT) Ltd.
            </footer>
        </div>
    );
}
