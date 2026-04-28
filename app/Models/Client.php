<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'client';
    protected $primaryKey = 'id';

    protected $fillable = [
        'client_name',
        'c_name',
        'nick_name',
        'address',
        'vat_no',
        'contact_number',
        'created_at',
        'deleted_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get all active clients
     */
    public static function getActiveClients()
    {
        return self::whereNull('deleted_at')
            ->select('id as value', 'client_name as label')
            ->get();
    }

    /**
     * Get vehicles for this client
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class, 'client_id', 'id');
    }


}
