<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\InvoiceDaily;
use App\Models\PaymentMethod;
use App\Models\Settings;
use App\Models\TaxInvoice;
use App\Models\TaxInvoiceInvoiceNo;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Inertia\Inertia;
use NumberFormatter;

class TaxInvoiceController extends Controller
{
    /**
     * Display the Tax Invoice page
     */
    public function index()
    {
        $clients = Client::getActiveClients();

        return Inertia::render('TaxInvoice', [
            'clients' => $clients,
        ]);
    }
    /**
     * Get all active payment methods
     */
    public function getPaymentMethods()
    {
        $paymentMethods = PaymentMethod::orderBy('name', 'asc')
            ->get()
            ->map(function ($method) {
                return [
                    'value' => (string) $method->id,
                    'label' => $method->name,
                ];
            });

        return response()->json([
            'success' => true,
            'payment_methods' => $paymentMethods,
        ]);
    }

    /**
     * Get tax invoice records based on filters (for creating new tax invoice)
     */
    public function getTaxInvoiceRecords(Request $request)
    {
        $request->validate([
            'client_id' => 'required',
            'vehicle_id' => 'nullable',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
        ]);

        // Parse dates to ensure proper format and add time boundaries
        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate = Carbon::parse($request->to_date)->endOfDay();

        $query = InvoiceDaily::with(['vehicle.client', 'fuelType'])
            ->whereHas('vehicle', function ($q) use ($request) {
                $q->where('client_id', $request->client_id);
            })
            ->where('date_added', '>=', $fromDate)
            ->where('date_added', '<=', $toDate)
            ->whereNull('deleted_at'); // Exclude soft-deleted records

        // Filter by specific vehicle if not "all"
        if ($request->vehicle_id && $request->vehicle_id !== 'all') {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        // Calculate grand total for ALL matching records (before pagination), rounding to 2 decimal places
        $grandTotal = round($query->get()->sum('Total'), 2);

        // Paginate results with 20 records per page
        $invoices = $query->orderByRaw('CAST(serial_no AS UNSIGNED) ASC')
            ->paginate(20);

        $records = $invoices->map(function ($invoice) {
            return [
                'id' => $invoice->id,
                'refNo' => $invoice->serial_no,
                'client' => $invoice->vehicle->client->client_name ?? 'N/A',
                'vehicle' => $invoice->vehicle->vehicle_no ?? 'N/A',
                'date' => $invoice->date_added->format('Y-m-d'),
                'fuelType' => $invoice->fuelType->name ?? 'N/A',
                'unitPrice' => round($invoice->fuel_net_price, 2),
                'vatPercent' => $invoice->vat_percentage,
                'volume' => round($invoice->volume, 3),
                'total' => round($invoice->Total, 2),
                'amountExclVat' => round($invoice->sub_total, 2),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $records,
            'current_page' => $invoices->currentPage(),
            'last_page' => $invoices->lastPage(),
            'per_page' => $invoices->perPage(),
            'total' => $invoices->total(),
            'count' => $records->count(),
            'grand_total' => $grandTotal,
        ]);
    }

    /**
     * Generate next tax invoice number for a client
     */
    public function getNextTaxInvoiceNumber(Request $request, $client_id)
    {
        $client = Client::find($client_id);
        if (!$client) {
            return response()->json([
                'success' => false,
                'message' => 'Client not found'
            ], 404);
        }

        $nickname = $client->nick_name ?? 'TAX';
        $invoiceDate = $request->input('invoice_date') ? Carbon::parse($request->input('invoice_date')) : Carbon::now();
        $yearMonth = $invoiceDate->format('y') . strtoupper($invoiceDate->format('M'));
        $prefix = $yearMonth . '_' . $nickname;
        $latestInvoice = TaxInvoice::where('client_name', $client->client_name)
            ->orderBy('id', 'DESC')
            ->first();
        if ($latestInvoice) {
            $lastNumber = (int) substr($latestInvoice->tax_invoice_no, -5);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }
        $formattedNumber = str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
        $taxInvoiceNumber = $prefix . '_' . $formattedNumber;
        return response()->json([
            'success' => true,
            'tax_invoice_number' => $taxInvoiceNumber,
        ]);
    }

    /**
     * Generate and view tax invoice PDF (create new tax invoice)
     */
    public function generateTaxInvoicePDF(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:client,id',
            'vehicle_id' => 'nullable',
            'from_date' => 'required|date',
            'to_date' => 'required|date',
            'tax_invoice_number' => 'required|string',
            'invoice_date' => 'required|date',
            'payment_method' => 'required|numeric|exists:payment_method,id',
        ]);

        // Get client details
        $client = Client::find($request->client_id);
        if (!$client) {
            return response()->json(['success' => false, 'message' => 'Client not found'], 404);
        }

        // Parse dates to ensure proper format and add time boundaries
        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate = Carbon::parse($request->to_date)->endOfDay();

        // Get invoice records
        $query = InvoiceDaily::with(['vehicle.client', 'fuelType'])
            ->whereHas('vehicle', function ($q) use ($request) {
                $q->where('client_id', $request->client_id);
            })
            ->where('date_added', '>=', $fromDate)
            ->where('date_added', '<=', $toDate)
            ->whereNull('deleted_at'); // Exclude soft-deleted records

        if ($request->vehicle_id && $request->vehicle_id !== 'all') {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        $invoices = $query->orderByRaw('CAST(serial_no AS UNSIGNED) ASC')
            ->get();

        $records = $invoices->map(function ($invoice) {
            $total = (float) $invoice->Total;
            $vatAmount = (float) $invoice->vat_amount;
            $vatPercent = (float) $invoice->vat_percentage;
            $storedSubTotal = (float) $invoice->sub_total;

            // Normalize legacy rows where sub_total was accidentally stored as /10 or /100.
            $amountExclVat = $this->resolveAmountExclVat(
                $storedSubTotal,
                $total,
                $vatAmount,
                $vatPercent,
            );

            return [
                'refNo' => $invoice->serial_no,
                'vehicle' => $invoice->vehicle->vehicle_no ?? 'N/A',
                'date' => $invoice->date_added->format('Y-m-d'),
                'fuelType' => $invoice->fuelType->name ?? 'N/A',
                'unitPrice' => $invoice->fuel_net_price,
                'vatPercent' => $vatPercent,
                'vatAmount' => $vatAmount,
                'volume' => $invoice->volume,
                'total' => $total,
                'amountExclVat' => $amountExclVat,
            ];
        });


        // Get VAT percentage from the last invoice record (not current system VAT)
        $vatPercentage = $invoices->isNotEmpty() ? $invoices->last()->vat_percentage : 0;
        // Calculate totals from normalized record values.
        $subtotal = round($records->sum('amountExclVat'), 0);
        $vatAmount = round($subtotal * ($vatPercentage / 100), 0);
        $grandTotal = $subtotal + $vatAmount;

        // Get settings for header company info
        $settings = Settings::first();
        $placeOfSupply = Settings::getPlaceOfSupply();

        // Convert Total to Words
        $totalInWords = $this->convertNumberToWords($grandTotal) . ' Rupees Only';

        // Get payment method label
        $paymentMethodId = (int) $request->payment_method;
        $paymentMethodObj = PaymentMethod::find($paymentMethodId);
        $paymentMethodLabel = $paymentMethodObj ? $paymentMethodObj->name : 'Cash';

        // Prepare PDF data
        $data = [
            'companyName' => $settings->company_name ?? '',
            'companyAddress' => $settings->company_address ?? '',
            'companyPhone' => $settings->company_contact ?? '',
            'companyVatNo' => $settings->company_vat_no ?? '',
            'clientName' => $client->c_name ?? '',
            'clientAddress' => $client->address ?? '',
            'clientPhone' => $client->contact_number ?? '',
            'clientVatNo' => $client->vat_no ?? '',
            'taxInvoiceNumber' => $request->tax_invoice_number,
            'printedDateTime' => $request->invoice_date,
            'fromDate' => $request->from_date,
            'toDate' => $request->to_date,
            'records' => $records,
            'subtotal' => $subtotal,
            'vatPercentage' => $vatPercentage,
            'vatAmount' => $vatAmount,
            'grandTotal' => $grandTotal,
            'totalInWords' => $totalInWords,
            'paymentMode' => $paymentMethodLabel,
            'placeOfSupply' => $placeOfSupply,
        ];
        // (Removed duplicate and misplaced lines)

        // Check for duplicate tax invoice number before saving
        $existingInvoice = TaxInvoice::where('tax_invoice_no', $request->tax_invoice_number)->first();
        if ($existingInvoice) {
            return response()->json([
                'success' => false,
                'message' => 'Tax invoice number already exists. Please refresh the page and try again.',
                'should_refresh' => true,
            ], 409);
        }

        // Save tax invoice to database using Eloquent
        $taxInvoice = TaxInvoice::create([
            'tax_invoice_no' => $request->tax_invoice_number,
            'invoice_date' => $request->invoice_date,
            'client_name' => $client->client_name ?? '',
            'vehicle_no' => $request->vehicle_id === 'all' ? 'All Vehicles' : ($invoices->first()->vehicle->vehicle_no ?? 'N/A'),
            'payment_method_id' => $paymentMethodId,
            'from_date' => $request->from_date,
            'to_date' => $request->to_date,
            'subtotal' => $subtotal,
            'vat_percentage' => $vatPercentage,
            'vat_amount' => $vatAmount,
            'total_amount' => $grandTotal,
            'created_at' => now(),
        ]);

        // Store all invoice IDs in tax_invoice_invoice_nos table using Eloquent
        $invoiceNos = $invoices->map(function ($invoice) use ($taxInvoice) {
            return [
                'tax_invoice_id' => $taxInvoice->id,
                'invoice_daily_id' => $invoice->id,
            ];
        })->toArray();

        if (!empty($invoiceNos)) {
            TaxInvoiceInvoiceNo::insert($invoiceNos);
        }

        // Generate PDF
        $pdf = Pdf::loadView('pdf.tax-invoice', $data);
        $pdf->set_option('isPhpEnabled', true); // Allow inline PHP for page numbers
        $pdf->setPaper('A4', 'portrait');

        // Sanitize filename by replacing invalid characters
        $safeFilename = str_replace(['/', '\\'], '-', $request->tax_invoice_number);

        // Return PDF for inline viewing (opens in browser)
        return $pdf->stream('Tax_Invoice_' . $safeFilename . '.pdf');
    }

    /**
     * Resolve amount excluding VAT for a record.
     * Handles historical rows where sub_total was saved at /10 or /100 scale.
     */
    private function resolveAmountExclVat(float $storedSubTotal, float $total, float $vatAmount, float $vatPercent): float
    {
        $fromVat = round($total - $vatAmount, 2);
        $fromRate = $vatPercent > 0
            ? round($total / (1 + ($vatPercent / 100)), 2)
            : round($total, 2);

        $expected = abs($fromVat - $fromRate) <= 1 ? $fromVat : $fromRate;

        $candidates = [
            round($storedSubTotal, 2),
            round($storedSubTotal * 10, 2),
            round($storedSubTotal * 100, 2),
            $fromVat,
        ];

        $best = $candidates[0];
        $bestDiff = abs($best - $expected);

        foreach ($candidates as $candidate) {
            $diff = abs($candidate - $expected);
            if ($diff < $bestDiff) {
                $best = $candidate;
                $bestDiff = $diff;
            }
        }

        return $best;
    }

    /**
     * Convert number to words
     */

    public function convertNumberToWords($number)
    {
        $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        $teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        if ($number == 0) {
            return 'Zero';
        }

        $words = '';

        // Billion (1,000,000,000)
        if ($number >= 1000000000) {
            $billions = floor($number / 1000000000);
            $words .= $this->convertNumberToWords($billions) . ' Billion ';
            $number %= 1000000000;
        }

        // Million (1,000,000)
        if ($number >= 1000000) {
            $millions = floor($number / 1000000);
            $words .= $this->convertNumberToWords($millions) . ' Million ';
            $number %= 1000000;
        }

        // // Crores (10,000,000)
        // if ($number >= 10000000) {
        //     $crores = floor($number / 10000000);
        //     $words .= $this->convertNumberToWords($crores) . ' Crore ';
        //     $number %= 10000000;

        // // Lakhs (100,000)
        // if ($number >= 100000) {
        //     $lakhs = floor($number / 100000);
        //     $words .= $this->convertNumberToWords($lakhs) . ' Lakh ';
        //     $number %= 100000;
        // }

        // Thousands (1,000)
        if ($number >= 1000) {
            $thousands = floor($number / 1000);
            $words .= $this->convertNumberToWords($thousands) . ' Thousand ';
            $number %= 1000;
        }

        // Hundreds (100)
        if ($number >= 100) {
            $hundreds = floor($number / 100);
            $words .= $ones[$hundreds] . ' Hundred ';
            $number %= 100;
        }

        // Tens and ones
        if ($number >= 20) {
            $tensDigit = floor($number / 10);
            $onesDigit = $number % 10;
            $words .= $tens[$tensDigit];
            if ($onesDigit > 0) {
                $words .= ' ' . $ones[$onesDigit];
            }
        } elseif ($number >= 10) {
            $words .= $teens[$number - 10];
        } elseif ($number > 0) {
            $words .= $ones[$number];
        }

        return trim($words);
    }
}
