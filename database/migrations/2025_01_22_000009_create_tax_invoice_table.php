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
        Schema::create('tax_invoice', function (Blueprint $table) {
            $table->id();
            $table->string('tax_invoice_no', 45)->nullable();
            $table->date('invoice_date')->nullable();
            $table->string('client_name', 255)->nullable();
            $table->string('vehicle_no', 255)->nullable();
            $table->unsignedBigInteger('payment_method_id')->default(1);
            $table->date('from_date')->nullable();
            $table->date('to_date')->nullable();
            $table->double('subtotal')->default(0);
            $table->double('vat_percentage')->default(0);
            $table->double('vat_amount')->default(0);
            $table->double('total_amount')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('payment_method_id')
                ->references('id')
                ->on('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_invoice');
    }
};
