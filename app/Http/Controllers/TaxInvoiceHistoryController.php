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
            ->leftJoin('fuel_type', 'invoice_daily.fuel_type_id', '=', 'fuel_type.id')
            ->leftJoin('lubricant_type', 'invoice_daily.lubricant_type_id', '=', 'lubricant_type.id')
            ->where('tax_invoice_invoice_nos.tax_invoice_id', $request->tax_invoice_id)
            ->whereNull('invoice_daily.deleted_at')
            ->select(
                'invoice_daily.id as id',
                'invoice_daily.serial_no as refNo',
                'client.client_name as client',
                'vehicle.vehicle_no as vehicle',
                'invoice_daily.date_added as date',
                DB::raw('COALESCE(lubricant_type.name, fuel_type.name) as fuelType'),
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
                'fuelType' => $record->fuelType,
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
                ->leftJoin('fuel_type', 'invoice_daily.fuel_type_id', '=', 'fuel_type.id')
                ->leftJoin('lubricant_type', 'invoice_daily.lubricant_type_id', '=', 'lubricant_type.id')
                ->where('tax_invoice_invoice_nos.tax_invoice_id', $request->tax_invoice_id)
                ->whereNull('invoice_daily.deleted_at')
                ->select(
                    'invoice_daily.serial_no as refNo',
                    'vehicle.vehicle_no as vehicle',
                    'invoice_daily.date_added as date',
                    DB::raw('COALESCE(lubricant_type.name, fuel_type.name) as fuelType'),
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
            $subtotal = round($invoices->sum('amountExclVat'), 2);
            $vatAmount = round($invoices->sum('vatAmount'), 2);
            $grandTotal = round($subtotal + $vatAmount, 2);

            $totalInWords = $this->convertAmountToWords($grandTotal);

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
                'companyVatNo' => substr($settings->company_vat_no ?? '', 0, 9),
                'placeOfSupply' => $settings->place_of_supply ?? '',
                'printedDateTime' => date('Y-m-d', strtotime($taxInvoice->invoice_date)),
                'clientName' => $clientCompany->c_name ?? '',
                'clientAddress' => $clientCompany->address ?? '',
                'clientPhone' => $clientCompany->contact_number ?? '',
                'clientVatNo' => substr($clientCompany->vat_no ?? '', 0, 9),
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
            return $pdf->stream($safeFilename . '.pdf');
        } catch (\Exception $e) {
            Log::error('PDF Generation Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            $message = 'Failed to generate PDF: ' . $e->getMessage();

            // The PDF is opened via a real <form> navigation (target=_blank) so
            // the browser's native PDF viewer keeps the Content-Disposition
            // filename on its own Download button, so this error can no longer
            // be inspected as a fetch() response — render a plain page instead
            // of a bare JSON dump for whichever tab lands here.
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], 500);
            }

            return response(
                '<!DOCTYPE html><html><head><meta charset="utf-8"><title>PDF Generation Failed</title></head>'
                . '<body style="font-family: Arial, sans-serif; text-align: center; padding: 4rem 2rem;">'
                . '<h2>Failed to Generate PDF</h2>'
                . '<p>' . e($message) . '</p>'
                . '<p>You can close this tab and try again from the Invoice History page.</p>'
                . '</body></html>',
                500
            )->header('Content-Type', 'text/html');
        }
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
     * Convert an LKR amount (rupees + cents) to words
     */
    private function convertAmountToWords(float $amount): string
    {
        $rupees = (int) floor(round($amount, 2));
        $cents = (int) round((round($amount, 2) - $rupees) * 100);

        if ($cents >= 100) {
            $rupees += 1;
            $cents -= 100;
        }

        $words = $this->convertNumberToWords($rupees) . ' Rupees';

        if ($cents > 0) {
            $words .= ' and ' . $this->convertNumberToWords($cents) . ' Cents';
        }

        return $words . ' Only';
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
     * Check whether the given tax invoice is the single most recently
     * created invoice system-wide. Invoice numbering is a global sequence
     * (not per-client — see getNextTaxInvoiceNumber), so "last" is simply
     * whichever row has the highest id, matching that same logic.
     */
    public function checkIsLastInvoice(Request $request)
    {
        $request->validate([
            'tax_invoice_id' => 'required|integer',
        ]);

        $taxInvoice = DB::table('tax_invoice')
            ->where('id', $request->tax_invoice_id)
            ->select('id')
            ->first();

        if (!$taxInvoice) {
            return response()->json(['success' => false, 'message' => 'Invoice not found.'], 404);
        }

        $latestId = DB::table('tax_invoice')->max('id');

        return response()->json([
            'success' => true,
            'is_last' => $taxInvoice->id === $latestId,
        ]);
    }

    /**
     * Delete a tax invoice (only if it is the single most recently created
     * invoice system-wide). Records the deletion in deleted_tax_invoices.
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

        $latestId = DB::table('tax_invoice')->max('id');

        if ($taxInvoice->id !== $latestId) {
            return response()->json([
                'success'  => false,
                'is_last'  => false,
                'message'  => 'This is not the last invoice. Only the last invoice can be deleted.',
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
