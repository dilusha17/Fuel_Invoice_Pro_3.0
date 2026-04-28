<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxInvoiceInvoiceNo extends Model
{
    use HasFactory;

    protected $table = 'tax_invoice_invoice_nos';

    public $timestamps = false;

    protected $fillable = [
        'tax_invoice_id',
        'invoice_daily_id',
        'updated_at',
    ];

    /**
     * Get the tax invoice that owns this record
     */
    public function taxInvoice()
    {
        return $this->belongsTo(TaxInvoice::class, 'tax_invoice_id');
    }

    /**
     * Get the invoice daily that owns this record
     */
    public function invoiceDaily()
    {
        return $this->belongsTo(InvoiceDaily::class, 'invoice_daily_id');
    }
}
