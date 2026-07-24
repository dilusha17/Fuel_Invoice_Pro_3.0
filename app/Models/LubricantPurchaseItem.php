<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LubricantPurchaseItem extends Model
{
    protected $table = 'lubricant_purchase_item';

    protected $fillable = [
        'lubricant_purchase_id',
        'lubricant_type_id',
        'lubricant_type_name',
        'quantity',
        'unit_price',
        'amount',
    ];

    protected $casts = [
        'quantity' => 'double',
        'unit_price' => 'double',
        'amount' => 'double',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function lubricantPurchase(): BelongsTo
    {
        return $this->belongsTo(LubricantPurchase::class, 'lubricant_purchase_id', 'id');
    }

    public function lubricantType(): BelongsTo
    {
        return $this->belongsTo(LubricantType::class, 'lubricant_type_id', 'id');
    }
}
