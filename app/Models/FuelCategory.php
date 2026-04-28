<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FuelCategory extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $table = 'fuel_category';

    protected $primaryKey = 'id';

    protected $fillable = [
        'name',
    ];



    /**
     * Get fuel types for this category
     */
    public function fuelTypes()
    {
        return $this->hasMany(FuelType::class, 'fuel_category_id', 'id');
    }

    public function getById($id)
    {
        return $this->where('fuel_category_id', $id)->first();
    }

    /**
     * Get all fuel categories
     */
    public static function getAllCategories()
    {
        return self::select('id', 'name')->get();
    }
}
