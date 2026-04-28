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
        Schema::create('fuel_price_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fuel_type_id');
            $table->double('fuel_price')->default(0);
            $table->double('vat_percentage')->default(0);
            $table->date('from_date')->nullable();
            $table->date('to_date')->nullable();

            $table->foreign('fuel_type_id')
                ->references('id')
                ->on('fuel_type');
        });

        // Add indexes to fuel_price_history table for better query performance
        Schema::table('fuel_price_history', function (Blueprint $table) {
            $table->index(['fuel_type_id', 'from_date', 'to_date'], 'idx_fuel_price_type_date_range');
            $table->index(['fuel_type_id', 'from_date'], 'idx_fuel_price_type_from_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fuel_price_history');
    }
};
