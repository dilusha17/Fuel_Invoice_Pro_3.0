<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;
use App\Models\Client;
use App\Models\DeletedTaxInvoice;

class TaxInvoiceHistoryController extends Controller
{
    /**
     * Display the Tax Invoice History page
     */
    public function index()
    {
        $clients = Client::getActiveClients();

        return Inertia::render('InvoiceHistory', [
            'clients' => $clients,
        ]);
    }

    /**
     * Get tax invoices for selected client, year, and month
     */
    public function getTaxInvoices(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string',
            'year' => 'required|string',
            'month' => 'required|string',
        ]);

        $startDate = $request->year . '-' . $request->month . '-01';
        $endDate = date('Y-m-t', strtotime($startDate)); // Last day of the month

        $taxInvoices = DB::table('tax_invoice')
            ->where('client_name', $request->client_name)
            ->whereBetween('invoice_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'id',
                'tax_invoice_no',
                'invoice_date',
                'client_name',
                'vehicle_no',
                'from_date',
                'to_date'
            )
            ->orderBy('invoice_date', 'desc')
            ->get()
            ->map(function ($invoice) {
                return [
                    'value' => $invoice->id,
                    'label' => $invoice->tax_invoice_no,
                    'invoiceDate' => date('Y-m-d', strtotime($invoice->invoice_date)),
                    'fromDate' => $invoice->from_date,
                    'toDate' => $invoice->to_date,
                    'vehicleNo' => $invoice->vehicle_no,
                ];
            });

        return response()->json([
            'success' => true,
            'invoices' => $taxInvoices,
        ]);
    }

    /**
     * Get daily invoice records for a selected tax invoice
     */
    public function getTaxInvoiceRecords(Request $request)
    {
        $request->validate([
            'tax_invoice_id' => 'required|integer',
            'payment_method_id' => 'nullable|integer',
        ]);

        // Get daily invoice records linked to this tax invoice
        $query = DB::table('tax_invoice_invoice_nos')
            ->join('invoice_daily', 'tax_invoice_invoice_nos.invoice_daily_id', '=', 'invoice_daily.id')
            ->join('vehicle', 'invoice_daily.vehicle_id', '=', 'vehicle.id')
            ->join('client', 'vehicle.client_id', '=', 'client.id')
            ->join('fuel_type', 'invoice_daily.fuel_type_id', '=', 'fuel_type.id')
            ->where('tax_invoice_invoice_nos.tax_invoice_id', $request->tax_invoice_id)
            ->whereNull('invoice_daily.deleted_at')
            ->select(
                'invoice_daily.id as id',
                'invoice_daily.serial_no as refNo',
                'client.client_name as client',
                'vehicle.vehicle_no as vehicle',
                'invoice_daily.date_added as date',
                'fuel_type.name as fuelType',
                'invoice_daily.fuel_net_price as unitPrice',
                'invoice_daily.vat_percentage as vatPercent',
                'invoice_daily.volume',
                'invoice_daily.sub_total as amountExclVat',
                'invoice_daily.Total as total'
            )
            ->orderByRaw('CAST(invoice_daily.serial_no AS UNSIGNED) ASC');

        // Get all records to calculate grand total (before pagination)
        $allRecords = $query->get();

        // Calculate grand total by summing all record totals and rounding to 2 decimal places
        $grandTotal = round($allRecords->sum('total'), 2);

        // Get payment method ID from tax_invoice
        $taxInvoice = DB::table('tax_invoice')
            ->where('id', $request->tax_invoice_id)
            ->select('payment_method_id')
            ->first();
        $paymentMethodId = $taxInvoice ? (string)$taxInvoice->payment_method_id : '';

        $invoices = $query->paginate(20);

        $records = $invoices->getCollection()->map(function ($record) {
            return [
                'id' => (string) $record->id,
                'refNo' => $record->refNo,
                'client' => $record->client,
                'vehicle' => $record->vehicle,
                'date' => date('Y-m-d', strtotime($record->date)),
                'fuelType' => $this->mapFuelType($record->fuelType),
                'unitPrice' => round($record->unitPrice, 2),
                'vatPercent' => (float) $record->vatPercent,
                'volume' => round($record->volume, 3),
                'amountExclVat' => round($record->amountExclVat, 2),
                'total' => round($record->total, 2),
            ];
        });

        // Set the transformed collection back
        $invoices->setCollection($records);

        return response()->json([
            'success' => true,
            'records' => $records,
            'current_page' => $invoices->currentPage(),
            'last_page' => $invoices->lastPage(),
            'per_page' => $invoices->perPage(),
            'total' => $invoices->total(),
            'grand_total' => $grandTotal,
            'payment_method_id' => $paymentMethodId,
        ]);
    }

    /**
     * Generate PDF for existing tax invoice from history
     */
    public function generateTaxInvoicePDF(Request $request)
    {
        $request->validate([
            'tax_invoice_id' => 'required|integer',
            'payment_method_id' => 'nullable|integer',
        ]);

        try {
            // Get tax invoice data (without payment method join first)
            $taxInvoice = DB::table('tax_invoice')
                ->where('id', $request->tax_invoice_id)
                ->select(
                    'id',
                    'tax_invoice_no',
                    'invoice_date',
                    'client_name',
                    'from_date',
                    'to_date',
                    'payment_method_id'
                )
                ->first();

            if (!$taxInvoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tax invoice not found',
                ], 404);
            }

            // Get invoice records
            $invoices = DB::table('tax_invoice_invoice_nos')
                ->join('invoice_daily', 'tax_invoice_invoice_nos.invoice_daily_id', '=', 'invoice_daily.id')
                ->join('vehicle', 'invoice_daily.vehicle_id', '=', 'vehicle.id')
                ->join('fuel_type', 'invoice_daily.fuel_type_id', '=', 'fuel_type.id')
                ->where('tax_invoice_invoice_nos.tax_invoice_id', $request->tax_invoice_id)
                ->whereNull('invoice_daily.deleted_at')
                ->select(
                    'invoice_daily.serial_no as refNo',
                    'vehicle.vehicle_no as vehicle',
                    'invoice_daily.date_added as date',
                    'fuel_type.name as fuelType',
                    'invoice_daily.fuel_net_price as unitPrice',
                    'invoice_daily.vat_percentage as vat_percentage',
                    'invoice_daily.vat_amount as vatAmount',
                    'invoice_daily.volume',
                    'invoice_daily.sub_total as amountExclVat',
                    'invoice_daily.Total as total'
                )
                ->orderByRaw('CAST(invoice_daily.serial_no AS UNSIGNED) ASC')
                ->get();

            // Get settings/company data for header
            $settings = DB::table('settings')
                ->select('company_name', 'company_address', 'company_contact', 'company_vat_no', 'place_of_supply')
                ->first();

            // Get client company details (fix: match on client_name)
            $clientCompany = DB::table('client')
                ->where('client_name', $taxInvoice->client_name)
                ->whereNull('deleted_at')
                ->select('c_name', 'address', 'vat_no', 'contact_number')
                ->first();

            // Process records for PDF table
            $recordsArray = [];

            foreach ($invoices as $record) {
                $total = (float) $record->total;
                $vatAmount = (float) $record->vatAmount;
                $vatPercent = (float) $record->vat_percentage;
                $storedSubTotal = (float) $record->amountExclVat;

                // Normalize legacy rows where sub_total was accidentally stored as /10 or /100.
                $amountExclVat = $this->resolveAmountExclVat(
                    $storedSubTotal,
                    $total,
                    $vatAmount,
                    $vatPercent,
                );

                $recordsArray[] = [
                    'refNo' => $record->refNo,
                    'vehicle' => $record->vehicle,
                    'date' => date('Y-m-d', strtotime($record->date)),
                    'fuelType' => $record->fuelType,
                    'unitPrice' => $record->unitPrice,
                    'vatPercent' => $vatPercent,
                    'volume' => $record->volume,
                    'amountExclVat' => $amountExclVat,
                    'vatAmount' => $vatAmount,
                    'total' => $total,
                ];
            }

            // Get VAT percentage from the last invoice record (not current system VAT)
            $vatPercentage = $invoices->isNotEmpty() ? $invoices->last()->vat_percentage : 0;
            // Totals: direct sum of stored sub_total and vat_amount columns, rounded to nearest whole number.
            $subtotal = (int) round($invoices->sum('amountExclVat'), 0);
            $vatAmount = (int) round($invoices->sum('vatAmount'), 0);
            $grandTotal = $subtotal + $vatAmount;

            $totalInWords = $this->convertNumberToWords($grandTotal) . ' Rupees Only';

            // Update the tax invoice record with new calculated values BEFORE generating PDF
            $updateData = [
                'subtotal' => $subtotal,
                'vat_percentage' => $vatPercentage,
                'vat_amount' => $vatAmount,
                'total_amount' => $grandTotal,
                'updated_at' => now()
            ];

            // Update payment method if provided
            if ($request->has('payment_method_id') && $request->payment_method_id) {
                $updateData['payment_method_id'] = $request->payment_method_id;
            }

            DB::table('tax_invoice')
                ->where('id', $request->tax_invoice_id)
                ->update($updateData);

            // Now get the updated payment method name for PDF
            $paymentMethodName = DB::table('payment_method')
                ->where('id', $request->has('payment_method_id') && $request->payment_method_id
                    ? $request->payment_method_id
                    : $taxInvoice->payment_method_id)
                ->value('name');

            // Prepare PDF data
            $pdfData = [
                'companyName' => $settings->company_name,
                'companyAddress' => $settings->company_address,
                'companyPhone' => $settings->company_contact,
                'companyVatNo' => $settings->company_vat_no,
                'placeOfSupply' => $settings->place_of_supply ?? '',
                'printedDateTime' => date('Y-m-d', strtotime($taxInvoice->invoice_date)),
                'clientName' => $clientCompany->c_name ?? '',
                'clientAddress' => $clientCompany->address ?? '',
                'clientPhone' => $clientCompany->contact_number ?? '',
                'clientVatNo' => $clientCompany->vat_no ?? '',
                'fromDate' => date('Y-m-d', strtotime($taxInvoice->from_date)),
                'toDate' => date('Y-m-d', strtotime($taxInvoice->to_date)),
                'taxInvoiceNumber' => $taxInvoice->tax_invoice_no,
                'paymentMode' => $paymentMethodName ?? 'N/A',
                'vatPercentage' => $vatPercentage,
                'records' => $recordsArray,
                'subtotal' => $subtotal,
                'vatAmount' => $vatAmount,
                'grandTotal' => $grandTotal,
                'totalInWords' => $totalInWords,
            ];

            // Generate PDF
            $pdf = Pdf::loadView('pdf.tax-invoice-history', $pdfData);
            $pdf->set_option('isPhpEnabled', true); // Allow inline PHP for page numbers
            $pdf->setPaper('A4', 'portrait');

            // Sanitize filename by replacing invalid characters
            $safeFilename = str_replace(['/', '\\'], '-', $taxInvoice->tax_invoice_no);
            return $pdf->stream('tax-invoice-' . $safeFilename . '.pdf');
        } catch (\Exception $e) {
            Log::error('PDF Generation Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Map fuel type names to display format
     */
    private function mapFuelType($fuelType)
    {
        $mapping = [
            'Auto Diesel' => 'AD',
            'Super Diesel' => 'SD',
            'Petrol 92' => 'P92',
            'Petrol 95' => 'P95',
        ];

        return $mapping[$fuelType] ?? $fuelType;
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
    private function convertNumberToWords($number)
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

    /**
     * Check whether the given tax invoice is the last one for its client.
     * "Last" is determined by comparing the trailing 5 numeric digits of
     * each invoice number — the invoice with the highest value is the last.
     */
    public function checkIsLastInvoice(Request $request)
    {
        $request->validate([
            'tax_invoice_id' => 'required|integer',
        ]);

        $taxInvoice = DB::table('tax_invoice')
            ->where('id', $request->tax_invoice_id)
            ->select('id', 'tax_invoice_no', 'client_name')
            ->first();

        if (!$taxInvoice) {
            return response()->json(['success' => false, 'message' => 'Invoice not found.'], 404);
        }

        $allInvoices = DB::table('tax_invoice')
            ->where('client_name', $taxInvoice->client_name)
            ->select('id', 'tax_invoice_no')
            ->get();

        // Extract the last 5 digits from an invoice number string
        $lastFiveDigits = function (string $invoiceNo): int {
            preg_match_all('/\d/', $invoiceNo, $matches);
            $digits = implode('', $matches[0]);
            return (int) substr($digits, -5);
        };

        $selectedValue = $lastFiveDigits($taxInvoice->tax_invoice_no);

        $maxValue = 0;
        foreach ($allInvoices as $inv) {
            $v = $lastFiveDigits((string) $inv->tax_invoice_no);
            if ($v > $maxValue) {
                $maxValue = $v;
            }
        }

        return response()->json([
            'success' => true,
            'is_last' => $selectedValue === $maxValue,
        ]);
    }

    /**
     * Delete a tax invoice (only if it is the last one for the client).
     * Records the deletion in deleted_tax_invoices.
     */
    public function deleteTaxInvoice(Request $request)
    {
        $request->validate([
            'tax_invoice_id'    => 'required|integer',
            'reason_for_delete' => 'required|string|max:500',
        ]);

        $taxInvoice = DB::table('tax_invoice')
            ->where('id', $request->tax_invoice_id)
            ->select('id', 'tax_invoice_no', 'client_name')
            ->first();

        if (!$taxInvoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.',
            ], 404);
        }

        // Verify this is still the last invoice using last-5-digits logic
        $allInvoices = DB::table('tax_invoice')
            ->where('client_name', $taxInvoice->client_name)
            ->select('id', 'tax_invoice_no')
            ->get();

        $lastFiveDigits = function (string $invoiceNo): int {
            preg_match_all('/\d/', $invoiceNo, $matches);
            $digits = implode('', $matches[0]);
            return (int) substr($digits, -5);
        };

        $selectedValue = $lastFiveDigits($taxInvoice->tax_invoice_no);
        $maxValue = 0;
        foreach ($allInvoices as $inv) {
            $v = $lastFiveDigits((string) $inv->tax_invoice_no);
            if ($v > $maxValue) {
                $maxValue = $v;
            }
        }

        if ($selectedValue !== $maxValue) {
            return response()->json([
                'success'  => false,
                'is_last'  => false,
                'message'  => 'This is not the last invoice for this client. Only the last invoice can be deleted.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Archive to deleted_tax_invoices
            DeletedTaxInvoice::create([
                'tax_invoice_no'    => $taxInvoice->tax_invoice_no,
                'client_name'       => $taxInvoice->client_name,
                'reason_for_delete' => $request->reason_for_delete,
                'deleted_at'        => now(),
            ]);

            // Remove linking records
            DB::table('tax_invoice_invoice_nos')
                ->where('tax_invoice_id', $taxInvoice->id)
                ->delete();

            // Remove the tax invoice
            DB::table('tax_invoice')
                ->where('id', $taxInvoice->id)
                ->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Invoice deleted successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete Tax Invoice Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice.',
            ], 500);
        }
    }

    /**
     * Return all deleted tax invoices.
     */
    public function getDeletedTaxInvoices()
    {
        $records = DB::table('deleted_tax_invoices')
            ->select('id', 'tax_invoice_no', 'client_name', 'deleted_at', 'reason_for_delete')
            ->where('deleted_at', '>=', now()->subDays(365))
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(function ($row) {
                return [
                    'id'              => $row->id,
                    'taxInvoiceNo'    => $row->tax_invoice_no,
                    'clientName'      => $row->client_name,
                    'deletedAt'       => $row->deleted_at
                        ? date('Y-m-d H:i', strtotime($row->deleted_at))
                        : null,
                    'reasonForDelete' => $row->reason_for_delete,
                ];
            });

        return response()->json([
            'success' => true,
            'records' => $records,
        ]);
    }
}
