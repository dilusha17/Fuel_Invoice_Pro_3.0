<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCacheHeaders
{
    /**
     * Handle an incoming request and apply cache headers for static content.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Don't cache authenticated routes
        if ($request->user()) {
            return $response->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                           ->header('Pragma', 'no-cache')
                           ->header('Expires', '0');
        }

        // Cache static assets for 1 year
        if ($this->isStaticAsset($request)) {
            return $response->header('Cache-Control', 'public, max-age=31536000, immutable');
        }

        // Cache public pages for 1 hour
        if ($this->isPublicPage($request)) {
            return $response->header('Cache-Control', 'public, max-age=3600');
        }

        return $response;
    }

    /**
     * Check if the request is for a static asset
     */
    private function isStaticAsset(Request $request): bool
    {
        $path = $request->path();
        $extensions = ['css', 'js', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'woff', 'woff2', 'ttf', 'eot', 'ico'];

        foreach ($extensions as $ext) {
            if (str_ends_with($path, '.' . $ext)) {
                return true;
            }
        }

        return str_starts_with($path, 'build/');
    }

    /**
     * Check if the request is for a public page
     */
    private function isPublicPage(Request $request): bool
    {
        // Add routes that can be cached
        $cachableRoutes = ['login'];

        return in_array($request->route()?->getName(), $cachableRoutes);
    }
}
