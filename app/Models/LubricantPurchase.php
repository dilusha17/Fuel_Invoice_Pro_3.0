<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LubricantPurchase extends Model
{
    use SoftDeletes;

    protected $table = 'lubricant_purchase';

    protected $fillable = [
        'supplier_id',
        'tax_invoice_no',
        'date',
        'net_amount',
        'vat_percentage',
        'vat_amount',
        'total_amount',
    ];

    protected $casts = [
        'date' => 'date',
        'net_amount' => 'double',
        'vat_percentage' => 'double',
        'vat_amount' => 'double',
        'total_amount' => 'double',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(LubricantPurchaseItem::class, 'lubricant_purchase_id', 'id');
    }
}
