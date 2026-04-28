<?php

namespace Database\Seeders;

use App\Models\FuelType;
use App\Models\Vat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FuelPriceHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing records
        DB::table('fuel_price_history')->truncate();

        // Fuel price history data
        $priceHistory = [
            // Fuel Type 1
            [
                'fuel_type_id' => 1,
                'fuel_price' => 294,
                'vat_percentage' => 18,
                'from_date' => '2024-01-01',
                'to_date' => '2026-01-31',
            ],
            [
                'fuel_type_id' => 1,
                'fuel_price' => 292,
                'vat_percentage' => 18,
                'from_date' => '2026-02-01',
                'to_date' => null,
            ],
            // Fuel Type 2
            [
                'fuel_type_id' => 2,
                'fuel_price' => 335,
                'vat_percentage' => 18,
                'from_date' => '2024-01-01',
                'to_date' => '2026-01-05',
            ],
            [
                'fuel_type_id' => 2,
                'fuel_price' => 340,
                'vat_percentage' => 18,
                'from_date' => '2026-01-06',
                'to_date' => null,
            ],
            // Fuel Type 3
            [
                'fuel_type_id' => 3,
                'fuel_price' => 277,
                'vat_percentage' => 18,
                'from_date' => '2024-01-01',
                'to_date' => '2026-01-05',
            ],
            [
                'fuel_type_id' => 3,
                'fuel_price' => 279,
                'vat_percentage' => 18,
                'from_date' => '2026-01-06',
                'to_date' => '2026-01-31',
            ],
            [
                'fuel_type_id' => 3,
                'fuel_price' => 277,
                'vat_percentage' => 18,
                'from_date' => '2026-02-01',
                'to_date' => null,
            ],
            // Fuel Type 4
            [
                'fuel_type_id' => 4,
                'fuel_price' => 318,
                'vat_percentage' => 18,
                'from_date' => '2024-01-01',
                'to_date' => '2026-01-05',
            ],
            [
                'fuel_type_id' => 4,
                'fuel_price' => 323,
                'vat_percentage' => 18,
                'from_date' => '2026-01-06',
                'to_date' => null,
            ],
        ];

        // Insert all records
        DB::table('fuel_price_history')->insert($priceHistory);
    }
}
