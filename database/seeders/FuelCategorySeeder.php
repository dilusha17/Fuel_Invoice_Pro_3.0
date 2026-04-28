<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\FuelCategory;

class FuelCategorySeeder extends Seeder
{
    protected $fuelCategory;

    public function __construct()
    {
        $this->fuelCategory = new FuelCategory();
    }
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $initialFuelCategory = [
            [
                'id' => 1,
                'name' => 'Petrol',
            ],
            [
                'id' => 2,
                'name' => 'Diesel',
            ],
        ];
        foreach ($initialFuelCategory as $fuelCategory) {
            FuelCategory::updateOrCreate(
                ['id' => $fuelCategory['id']],
                $fuelCategory
            );
        }
    }
}
