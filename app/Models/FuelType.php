<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuelType extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $table = 'fuel_type';
    protected $primaryKey = 'id';

    protected $fillable = [
        'fuel_category_id',
        'name',
        'price',
    ];

    protected $casts = [
        'price' => 'double',
        'fuel_category_id' => 'integer',
    ];

    /**
     * Get the fuel category for this type
     */
    public function fuelCategory(): BelongsTo
    {
        return $this->belongsTo(FuelCategory::class, 'fuel_category_id', 'id');
    }

    /**
     * Get fuel type by ID
     */
    public function getById($id)
    {
        return $this->where('fuel_type_id', $id)->first();
    }

}
