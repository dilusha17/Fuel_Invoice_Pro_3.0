<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lubricant_price_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lubricant_type_id');
            $table->double('price')->default(0);
            $table->double('vat_percentage')->default(0);
            $table->date('from_date')->nullable();
            $table->date('to_date')->nullable();

            $table->foreign('lubricant_type_id')
                ->references('id')
                ->on('lubricant_type');

            $table->index(['lubricant_type_id', 'from_date', 'to_date'], 'idx_lub_price_type_date_range');
            $table->index(['lubricant_type_id', 'from_date'], 'idx_lub_price_type_from_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lubricant_price_history');
    }
};
