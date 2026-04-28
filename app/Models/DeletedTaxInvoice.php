<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeletedTaxInvoice extends Model
{
    protected $table = 'deleted_tax_invoices';

    public $timestamps = false;

    protected $fillable = [
        'tax_invoice_no',
        'client_name',
        'reason_for_delete',
        'deleted_at',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];
}
