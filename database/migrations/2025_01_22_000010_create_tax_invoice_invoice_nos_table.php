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
        Schema::create('tax_invoice_invoice_nos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tax_invoice_id');
            $table->unsignedBigInteger('invoice_daily_id');

            $table->foreign('tax_invoice_id')
                ->references('id')
                ->on('tax_invoice');

            $table->foreign('invoice_daily_id')
                ->references('id')
                ->on('invoice_daily');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_invoice_invoice_nos');
    }
};
