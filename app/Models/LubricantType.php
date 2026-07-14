<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LubricantType extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'lubricant_type';

    protected $fillable = [
        'fuel_category_id',
        'name',
        'price',
    ];

    protected $casts = [
        'price' => 'double',
        'fuel_category_id' => 'integer',
    ];

    public function fuelCategory(): BelongsTo
    {
        return $this->belongsTo(FuelCategory::class, 'fuel_category_id', 'id');
    }
}
