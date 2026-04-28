<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TaxInvoice extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'tax_invoice';

    protected $fillable = [
        'tax_invoice_no',
        'invoice_date',
        'client_name',
        'vehicle_no',
        'payment_method_id',
        'from_date',
        'to_date',
        'subtotal',
        'vat_percentage',
        'vat_amount',
        'total_amount',
        'created_at',
    ];

    protected $casts = [
        'invoice_date' => 'datetime',
        'from_date' => 'date',
        'to_date' => 'date',
        'payment_method_id' => 'integer',
    ];

    /**
     * Get the invoice daily records associated with this tax invoice
     */
    public function invoiceDailies(): BelongsToMany
    {
        return $this->belongsToMany(
            InvoiceDaily::class,
            'tax_invoice_invoice_nos',
            'tax_invoice_id',
            'invoice_daily_id'
        );
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }
}
