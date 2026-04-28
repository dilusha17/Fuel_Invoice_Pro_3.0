<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_income', function (Blueprint $table) {
            $table->double('vat_percentage')->nullable()->default(0)->after('income');
            $table->double('vat_amount')->nullable()->default(0)->after('vat_percentage');
            $table->double('net_amount')->nullable()->default(0)->after('vat_amount');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_income', function (Blueprint $table) {
            $table->dropColumn(['vat_percentage', 'vat_amount', 'net_amount']);
        });
    }
};
