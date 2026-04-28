import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      ssr: 'resources/js/ssr.tsx',
      refresh: true,
    }),
    react(),
    wayfinder({
      formVariants: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/js'),
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: !isSsrBuild ? {
        manualChunks: {
          // Split vendor code into separate chunk
          vendor: ['react', 'react-dom', '@inertiajs/react'],
          // Split UI components into separate chunk
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-label',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
          ],
          // Split form libraries
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      } : undefined,
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification (using esbuild which is faster and doesn't require extra dependencies)
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
  // Optimize deps
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@inertiajs/react',
      'react-hook-form',
      'zod',
    ],
  },
}));
