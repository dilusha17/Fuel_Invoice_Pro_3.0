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
        Schema::create('fuel_type', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fuel_category_id');
            $table->string('name', 45)->nullable();
            $table->double('price')->default(0);

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
        Schema::dropIfExists('fuel_type');
    }
};
