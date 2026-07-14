<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lubricant_type', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fuel_category_id')->default(3);
            $table->string('name', 100);
            $table->double('price')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('fuel_category_id')
                ->references('id')
                ->on('fuel_category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lubricant_type');
    }
};
