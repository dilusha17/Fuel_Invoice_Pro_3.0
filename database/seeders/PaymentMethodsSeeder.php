<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentMethodsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paymentMethods = [
            [
                'name' => 'Cash',
            ],
            [
                'name' => 'Credit Card',
            ],
            [
                'name' => 'Debit Card',
            ],
            [
                'name' => 'Bank Transfer',
            ],
            [
                'name' => 'Cheque',
            ],
        ];

        DB::table('payment_method')->insert($paymentMethods);
    }
}
