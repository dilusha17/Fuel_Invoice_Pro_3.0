<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('monthly_income', function (Blueprint $table) {
            $table->id();
            $table->year('year')->default(2000);
            $table->integer('month')->nullable();
            $table->double('income')->nullable();
            $table->double('vat_percentage')->nullable()->default(0);
            $table->double('vat_amount')->nullable()->default(0);
            $table->double('net_amount')->nullable()->default(0);
            $table->timestamp('deleted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_income');
    }
};
