<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $initialUsers = [
            [
                'name' => 'admin',
                'password' => 'De.Creations.321',
                'user_type' => 'admin',
                'expired_at' => '2100-01-01 00:00:00',
                'created_at' => now(),
            ],
        ];

        foreach ($initialUsers as $userData) {
            User::firstOrCreate(
                ['name' => $userData['name']],
                [
                    'password' => Hash::make($userData['password']),
                    'user_type' => $userData['user_type'],
                    'expired_at' => $userData['expired_at'],
                    'created_at' => $userData['created_at'],
                ]
            );
        }
    }
}
