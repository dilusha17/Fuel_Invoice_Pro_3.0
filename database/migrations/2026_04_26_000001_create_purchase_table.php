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
        Schema::create('purchase', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_name', 255)->nullable();
            $table->string('invoice_number', 100)->nullable();
            $table->date('date');
            $table->unsignedBigInteger('fuel_category_id');
            $table->unsignedBigInteger('fuel_type_id');
            $table->double('volume', 15, 4)->default(0);
            $table->double('unit_price', 15, 4)->default(0);
            $table->double('amount', 15, 4)->default(0);
            $table->double('discount', 15, 4)->default(0);
            $table->double('invoice_amount', 15, 4)->default(0);
            $table->double('vat_percentage', 8, 4)->default(0);
            $table->double('vat_amount', 15, 4)->default(0);
            $table->double('net_amount', 15, 4)->default(0);
            $table->timestamps();

            $table->foreign('fuel_category_id')->references('id')->on('fuel_category');
            $table->foreign('fuel_type_id')->references('id')->on('fuel_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase');
    }
};
