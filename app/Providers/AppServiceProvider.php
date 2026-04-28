<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
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

        // Optimize view compilation
        View::share('appName', config('app.name'));
    }
}
