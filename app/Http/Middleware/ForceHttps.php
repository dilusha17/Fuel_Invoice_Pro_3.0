<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttps
{
    /**
     * Redirect every plain-http request to https when FORCE_HTTPS is on.
     *
     * 308 (not 301) so a POST/PUT/DELETE is replayed with the same method.
     * The /up health endpoint is left alone so load balancers that probe over
     * http keep working.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (config('app.force_https') && ! $request->isSecure() && ! $request->is('up')) {
            return redirect()->secure($request->getRequestUri(), 308);
        }

        return $next($request);
    }
}
