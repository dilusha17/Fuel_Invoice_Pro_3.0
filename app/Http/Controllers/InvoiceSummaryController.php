<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\PaymentMethod;
use App\Models\TaxInvoice;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceSummaryController extends Controller
{
    public function index()
    {
        $clients = Client::orderBy('id')
            ->select('id as value', 'client_name as label')
            ->get();

        $paymentMethods = PaymentMethod::orderBy('name')
            ->select('id as value', 'name as label')
            ->get();

        return Inertia::render('InvoiceSummary', [
            'clients' => $clients,
            'paymentMethods' => $paymentMethods
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'client_id' => 'nullable|exists:client,id',
            'payment_method_id' => 'nullable|exists:payment_method,id',
        ]);

        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate = Carbon::parse($request->to_date)->endOfDay();

        $query = TaxInvoice::with(['client', 'invoiceDailies.fuelType', 'invoiceDailies.lubricantType'])
            ->whereBetween('invoice_date', [$fromDate, $toDate]);

        if ($request->client_id) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->payment_method_id) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        // Calculate totals using a clone of the query logic
        $totalsQuery = clone $query;
        $totals = [
            'sum_net' => $totalsQuery->sum('subtotal'),
            'sum_vat' => $totalsQuery->sum('vat_amount'),
            'sum_total' => $totalsQuery->sum('total_amount'),
        ];

        $invoices = $query->orderByRaw('CAST(RIGHT(tax_invoice_no, 5) AS UNSIGNED) ASC')
                          ->orderBy('id', 'asc')
                          ->paginate(20);

        // Track serial number across paginated results
        $offset = ($invoices->currentPage() - 1) * $invoices->perPage();

        // Transform the paginated items
        $invoices->getCollection()->transform(function ($invoice, $index) use ($offset) {
            $clientRecord = $invoice->client;

            $tin = $clientRecord ? substr($clientRecord->vat_no ?? '', 0, 9) : '';
            $purchaserName = $clientRecord ? ($clientRecord->c_name ?? '') : '';

            $firstDaily = $invoice->invoiceDailies->first();
            $isLubricant = $firstDaily && $firstDaily->lubricant_type_id !== null;
            $productName = $isLubricant && $firstDaily ? $firstDaily->getProductName() : '';
            // A tax invoice may bundle multiple different fuel types, so fuel
            // purchases are described generically; lubricant purchases keep
            // the specific product name since each invoice covers one lubricant.
            $description = $isLubricant && trim($productName) !== '' && $productName !== 'N/A'
                ? $productName . ' Purchase'
                : 'Fuel Purchase';

            return [
                'id'             => $invoice->id,
                'serial_no'      => $offset + $index + 1,
                'invoice_date'   => Carbon::parse($invoice->invoice_date)->format('m/d/Y'),
                'tax_invoice_no' => $invoice->tax_invoice_no,
                'tin'            => $tin,
                'purchaser_name' => $purchaserName,
                'description'    => $description,
                'subtotal'       => $invoice->subtotal,
                'vat_amount'     => $invoice->vat_amount,
            ];
        });

        return response()->json([
            'invoices' => $invoices,
            'totals' => $totals
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'client_id' => 'nullable|exists:client,id',
            'payment_method_id' => 'nullable|exists:payment_method,id',
        ]);

        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate = Carbon::parse($request->to_date)->endOfDay();

        $query = TaxInvoice::with(['client', 'invoiceDailies.fuelType', 'invoiceDailies.lubricantType'])
            ->whereBetween('invoice_date', [$fromDate, $toDate]);

        if ($request->client_id) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->payment_method_id) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        $invoices = $query->orderByRaw('CAST(RIGHT(tax_invoice_no, 5) AS UNSIGNED) ASC')
                          ->orderBy('id', 'asc')
                          ->get();

        $filename = 'invoice-summary-' . $fromDate->format('m-d-Y') . '-to-' . $toDate->format('m-d-Y') . '.csv';

        return new StreamedResponse(function () use ($invoices) {
            $handle = fopen('php://output', 'w');

            // CSV header row
            fputcsv($handle, [
                'Serial No',
                'Invoice Date',
                'Tax Invoice No',
                "Purchaser's TIN",
                'Name of the Purchaser',
                'Description',
                'Value of supply',
                'VAT Amount',
            ]);

            $sumSubtotal = 0;
            $sumVat = 0;

            foreach ($invoices as $index => $invoice) {
                $clientRecord = $invoice->client;

                $tin = $clientRecord ? substr($clientRecord->vat_no ?? '', 0, 9) : '';
                $purchaserName = $clientRecord ? ($clientRecord->c_name ?? '') : '';

                $firstDaily = $invoice->invoiceDailies->first();
                $isLubricantItem = $firstDaily && $firstDaily->lubricant_type_id !== null;
                $productName = $isLubricantItem && $firstDaily ? $firstDaily->getProductName() : '';
                $description = $isLubricantItem && trim($productName) !== '' && $productName !== 'N/A'
                    ? $productName . ' Purchase'
                    : 'Fuel Purchase';

                $sumSubtotal += $invoice->subtotal;
                $sumVat += $invoice->vat_amount;

                fputcsv($handle, [
                    $index + 1,
                    Carbon::parse($invoice->invoice_date)->format('m/d/Y'),
                    $invoice->tax_invoice_no,
                    $tin,
                    $purchaserName,
                    $description,
                    $invoice->subtotal,
                    $invoice->vat_amount,
                ]);
            }

            // Total row
            fputcsv($handle, [
                '',
                '',
                '',
                '',
                '',
                '',
                $sumSubtotal,
                $sumVat,
            ]);

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control'       => 'no-store, no-cache',
            'Pragma'              => 'no-cache',
        ]);
    }
}
