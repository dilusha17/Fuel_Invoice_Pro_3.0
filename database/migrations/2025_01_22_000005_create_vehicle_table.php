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
        Schema::create('vehicle', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('client_id')->nullable();
            $table->string('vehicle_no', 15)->nullable();
            $table->string('type', 50)->nullable();
            $table->unsignedBigInteger('fuel_category_id');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('deleted_at')->nullable();

            $table->foreign('client_id')
                ->references('id')
                ->on('client');

            $table->foreign('fuel_category_id')
                ->references('id')
                ->on('fuel_category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle');
    }
};
