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
        Schema::create('deleted_tax_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('tax_invoice_no', 45)->nullable();
            $table->string('client_name', 255)->nullable();
            $table->string('reason_for_delete', 500);
            $table->timestamp('deleted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deleted_tax_invoices');
    }
};
