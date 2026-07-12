<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase', function (Blueprint $table) {
            $table->renameColumn('invoice_number', 'tax_invoice_no');
        });
    }

    public function down(): void
    {
        Schema::table('purchase', function (Blueprint $table) {
            $table->renameColumn('tax_invoice_no', 'invoice_number');
        });
    }
};
