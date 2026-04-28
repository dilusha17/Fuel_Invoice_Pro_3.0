<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Settings extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'settings';
    protected $primaryKey = 'id';

    protected $fillable = [
        'company_name',
        'company_address',
        'company_contact',
        'company_vat_no',
        'place_of_supply',
        'supplier_name',
    ];

    /**
     * Get settings record (should be only one)
     */
    public static function getSettings()
    {
        return self::first();
    }

    public static function getPlaceOfSupply()
    {
        return self::first()?->place_of_supply;
    }
}
