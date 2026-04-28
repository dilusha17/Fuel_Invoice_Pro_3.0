<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vehicle extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'vehicle';
    protected $primaryKey = 'id';

    protected $fillable = [
        'client_id',
        'vehicle_no',
        'type',
        'fuel_category_id',
        'created_at',
        'deleted_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'deleted_at' => 'datetime',
        'client_id' => 'integer',
        'fuel_category_id' => 'integer',
    ];

    /**
     * Get all active vehicles
     */
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    /**
     * Get the client that owns the vehicle
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id', 'id');
    }

    /**
     * Get the fuel category for the vehicle
     */
    public function fuelCategory(): BelongsTo
    {
        return $this->belongsTo(FuelCategory::class, 'fuel_category_id', 'id');
    }

}
