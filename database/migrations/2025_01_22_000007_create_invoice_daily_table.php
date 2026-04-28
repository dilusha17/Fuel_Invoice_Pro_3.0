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
        Schema::create('invoice_daily', function (Blueprint $table) {
            $table->id();
            $table->string('serial_no', 15)->nullable();
            $table->date('date_added')->nullable();
            $table->unsignedBigInteger('vehicle_id');
            $table->unsignedBigInteger('fuel_type_id');
            $table->double('volume')->default(0);
            $table->double('fuel_net_price')->default(0);
            $table->double('sub_total')->default(0);
            $table->double('vat_percentage')->default(0);
            $table->double('vat_amount')->default(0);
            $table->double('Total')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();

            $table->foreign('vehicle_id')
                ->references('id')
                ->on('vehicle');

            $table->foreign('fuel_type_id')
                ->references('id')
                ->on('fuel_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_daily');
    }
};
