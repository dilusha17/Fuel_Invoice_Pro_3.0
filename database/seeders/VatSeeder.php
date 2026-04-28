<?php

namespace Database\Seeders;

use App\Models\Vat;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Vat::updateOrCreate(
            ['id' => 1],
            [
                'vat_percentage' => 18,
                'from_date' => '2024-01-01',
                'to_date' => Null
            ]
        );
    }
}
