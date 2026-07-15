<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\LubricantType;

class InvoiceDaily extends Model
{
    use HasFactory, SoftDeletes;

    public $timestamps = false;
    const DELETED_AT = 'deleted_at';
    protected $table = 'invoice_daily';
    protected $primaryKey = 'id';

    protected $fillable = [
        'serial_no',
        'date_added',
        'vehicle_id',
        'fuel_type_id',
        'lubricant_type_id',
        'input_method',
        'volume',
        'fuel_net_price',
        'sub_total',
        'vat_percentage',
        'vat_amount',
        'Total',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $casts = [
        'date_added' => 'date',
        'volume' => 'double',
        'fuel_net_price' => 'double',
        'sub_total' => 'double',
        'vat_percentage' => 'double',
        'vat_amount' => 'double',
        'Total' => 'double',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'vehicle_id' => 'integer',
        'fuel_type_id' => 'integer',
        'lubricant_type_id' => 'integer',
    ];

    /**
     * Get the vehicle for this invoice
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'id');
    }

    /**
     * Get the fuel type for this invoice
     */
    public function fuelType(): BelongsTo
    {
        return $this->belongsTo(FuelType::class, 'fuel_type_id', 'id');
    }

    public function lubricantType(): BelongsTo
    {
        return $this->belongsTo(LubricantType::class, 'lubricant_type_id', 'id');
    }

    public function getProductName(): string
    {
        if ($this->lubricant_type_id) {
            return $this->lubricantType->name ?? 'N/A';
        }
        return $this->fuelType->name ?? 'N/A';
    }
}
