/// <reference types="vite/client" />

declare global {
    function route(name: string, params?: Record<string, unknown>): string;
}

export {};
