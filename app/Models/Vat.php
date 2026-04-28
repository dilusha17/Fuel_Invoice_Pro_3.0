<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Vat extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'vat';
    protected $primaryKey = 'id';

    protected $fillable = [
        'vat_percentage',
        'from_date',
        'to_date',
    ];

    protected $casts = [
        'vat_percentage' => 'double',
        'from_date' => 'date',
        'to_date' => 'date',
    ];

    /**
     * Get the current active VAT percentage
     */
    public static function getCurrentVatPercentage(): float
    {
        $today = Carbon::today();

        $vat = self::where('from_date', '<=', $today)
            ->where(function($query) use ($today) {
                $query->where('to_date', '>', $today);
            })
            ->orderBy('from_date', 'desc')
            ->first();

        return $vat ? $vat->vat_percentage : 0.0;
    }

}
