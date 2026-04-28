<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vat', function (Blueprint $table) {
            $table->id();
            $table->double('vat_percentage')->default(0);
            $table->date('from_date')->nullable();
            $table->date('to_date')->nullable();
        });

        // Add indexes to vat table for better query performance
        Schema::table('vat', function (Blueprint $table) {
            $table->index(['from_date', 'to_date'], 'idx_vat_date_range');
            $table->index('from_date', 'idx_vat_from_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vat');
    }
};
