<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Vat;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class WarmCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:warm
                          {--clear : Clear cache before warming}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warm up application cache with frequently accessed data';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('clear')) {
            $this->info('Clearing cache...');
            Cache::flush();
        }

        $this->info('Warming cache...');

        // Warm up VAT cache
        $this->info('Caching VAT percentage...');
        Vat::getCurrentVatPercentage();

        // Warm up companies cache
        $this->info('Caching active companies...');
        Company::getActiveCompanies();

        // Warm up vehicles cache for each company
        $this->info('Caching vehicles for each company...');
        $companies = DB::table('company')
            ->whereNull('deleted_at')
            ->pluck('id');

        foreach ($companies as $companyId) {
            Cache::remember("vehicles_company_{$companyId}", now()->addHours(6), function () use ($companyId) {
                return DB::table('vehicle')
                    ->where('company_id', $companyId)
                    ->whereNull('deleted_at')
                    ->select('id as value', 'vehicle_no as label', 'fuel_category_id')
                    ->get();
            });
        }

        // Warm up fuel types cache for each category
        $this->info('Caching fuel types for each category...');
        $fuelCategories = DB::table('fuel_category')->pluck('id');

        foreach ($fuelCategories as $categoryId) {
            Cache::remember("fuel_types_category_{$categoryId}", now()->addHours(6), function () use ($categoryId) {
                return DB::table('fuel_type')
                    ->where('fuel_category_id', $categoryId)
                    ->select('id as value', 'name as label', 'price')
                    ->get();
            });
        }

        $this->info('Cache warmed successfully!');
        return 0;
    }
}
