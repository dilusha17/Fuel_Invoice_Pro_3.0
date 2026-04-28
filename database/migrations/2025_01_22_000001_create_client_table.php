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
        Schema::create('client', function (Blueprint $table) {
            $table->id();
            $table->string('client_name', 255)->nullable();
            $table->string('c_name', 255)->nullable();
            $table->string('nick_name', 50)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('vat_no', 32)->nullable();
            $table->string('contact_number', 10)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client');
    }
};
