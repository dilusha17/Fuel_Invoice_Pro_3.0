<?php

namespace Database\Seeders;

use App\Models\Settings;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Settings::updateOrCreate(
            ['id' => 1],
            [
                'company_name' => 'Sample Fuel Station',
                'company_address' => '123 Main Street, Colombo 01',
                'company_contact' => '+94 11 234 5678',
                'company_vat_no' => 'VAT123456789',
                'place_of_supply' => 'Colombo',
                'supplier_name' => 'CEYLON PETROLEUM CORPORATION',
            ]
        );
    }
}
