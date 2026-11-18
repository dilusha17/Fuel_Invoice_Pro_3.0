<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Disable lazy loading in production to prevent N+1 queries
        Model::preventLazyLoading(!app()->isProduction());

        // Enable strict mode in development
        Model::shouldBeStrict(!app()->isProduction());

        // Optimize database queries
        if (app()->isProduction()) {
            // Disable query logging in production for better performance
            DB::connection()->disableQueryLog();
        }

        // Always generate https links (assets, redirects, route URLs)
        if (config('app.force_https')) {
            URL::forceHttps();
        }

        // A production site must never run with debug output enabled
        if (app()->isProduction() && config('app.debug')) {
            Log::warning('APP_DEBUG is true in production; set APP_DEBUG=false in .env.');
        }

        // Optimize view compilation
        View::share('appName', config('app.name'));
    }
}
