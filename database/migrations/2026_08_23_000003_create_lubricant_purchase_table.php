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
        Schema::create('lubricant_purchase', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->string('tax_invoice_no', 100)->nullable();
            $table->date('date');
            $table->double('net_amount', 15, 4)->default(0);
            $table->double('vat_percentage', 8, 4)->default(0);
            $table->double('vat_amount', 15, 4)->default(0);
            $table->double('total_amount', 15, 4)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('supplier')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lubricant_purchase');
    }
};
