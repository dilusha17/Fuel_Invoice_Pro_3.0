import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="flex min-h-screen w-full">
            <Sidebar />
            <main className="flex-1 lg:ml-0 min-h-screen flex flex-col">
                <div className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 pb-20">
                    {children}
                </div>
                <footer className="fixed bottom-0 left-0 right-0 lg:left-64 py-3 px-4 text-center text-xs text-muted-foreground bg-gradient-to-t from-background via-background to-transparent z-40">
                    Designed by DE Creations (PVT) Ltd.
                </footer>
            </main>
        </div>
    );
}
