<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Purchase extends Model
{
    protected $table = 'purchase';

    protected $fillable = [
        'supplier_id',
        'tax_invoice_no',
        'date',
        'fuel_category_id',
        'fuel_type_id',
        'volume',
        'unit_price',
        'amount',
        'discount',
        'eva_allowance',
        'invoice_amount',
        'vat_percentage',
        'vat_amount',
        'net_amount',
    ];

    protected $casts = [
        'date' => 'date',
        'volume' => 'double',
        'unit_price' => 'double',
        'amount' => 'double',
        'discount' => 'double',
        'eva_allowance' => 'double',
        'invoice_amount' => 'double',
        'vat_percentage' => 'double',
        'vat_amount' => 'double',
        'net_amount' => 'double',
        'fuel_category_id' => 'integer',
        'fuel_type_id' => 'integer',
        'supplier_id' => 'integer',
    ];

    public function fuelCategory(): BelongsTo
    {
        return $this->belongsTo(FuelCategory::class, 'fuel_category_id', 'id');
    }

    public function fuelType(): BelongsTo
    {
        return $this->belongsTo(FuelType::class, 'fuel_type_id', 'id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
}
