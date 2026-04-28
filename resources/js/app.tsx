import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Layout } from '@/components/layout/Layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const queryClient = new QueryClient();

const pages = import.meta.glob('./pages/**/*.tsx');

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const importer = pages[`./pages/${name}.tsx`];
        if (!importer) {
            const mod = await pages['./pages/NotFound.tsx']() as { default: unknown };
            return mod.default;
        }

        const mod = await importer() as { default: unknown };
        const Page = mod.default;

        if (!Page.layout) {
            Page.layout = (page: ReactNode) => <Layout>{page}</Layout>;
        }

        return Page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <StrictMode>
                <QueryClientProvider client={queryClient}>
                    <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <App {...props} />
                    </TooltipProvider>
                </QueryClientProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
