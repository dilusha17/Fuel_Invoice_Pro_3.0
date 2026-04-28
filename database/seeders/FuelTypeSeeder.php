<?php

namespace Database\Seeders;

use App\Models\FuelType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FuelTypeSeeder extends Seeder
{
    protected $fuelType;

    public function __construct()
    {
        $this->fuelType = new FuelType();
    }
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $initialFuelType = [
            [
                'id' => 1,
                'fuel_category_id' => 1,
                'name' => '92 Petrol',
                'price' => 292,
            ],
            [
                'id' => 2,
                'fuel_category_id' => 1,
                'name' => '95 Petrol',
                'price' => 340,
            ],
            [
                'id' => 3,
                'fuel_category_id' => 2,
                'name' => 'Auto Diesel',
                'price' => 277,
            ],
            [
                'id' => 4,
                'fuel_category_id' => 2,
                'name' => 'Super Diesel',
                'price' => 323,
            ],
        ];
        foreach ($initialFuelType as $fuelType) {
            FuelType::updateOrCreate(
                ['id' => $fuelType['id']],
                $fuelType
            );
        }
    }
}
