<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LubricantPriceHistory extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'lubricant_price_history';

    protected $fillable = [
        'lubricant_type_id',
        'price',
        'vat_percentage',
        'from_date',
        'to_date',
    ];

    protected $casts = [
        'price' => 'double',
        'vat_percentage' => 'double',
        'from_date' => 'date',
        'to_date' => 'date',
    ];

    public function lubricantType(): BelongsTo
    {
        return $this->belongsTo(LubricantType::class, 'lubricant_type_id', 'id');
    }
}
