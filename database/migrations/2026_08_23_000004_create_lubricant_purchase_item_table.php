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
        Schema::create('lubricant_purchase_item', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lubricant_purchase_id');
            $table->unsignedBigInteger('lubricant_type_id')->nullable();
            $table->string('lubricant_type_name', 100)->nullable();
            $table->double('quantity', 15, 4)->default(0);
            $table->double('unit_price', 15, 4)->default(0);
            $table->double('amount', 15, 4)->default(0);
            $table->timestamps();

            $table->foreign('lubricant_purchase_id')
                ->references('id')
                ->on('lubricant_purchase')
                ->cascadeOnDelete();

            $table->foreign('lubricant_type_id')
                ->references('id')
                ->on('lubricant_type')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lubricant_purchase_item');
    }
};
