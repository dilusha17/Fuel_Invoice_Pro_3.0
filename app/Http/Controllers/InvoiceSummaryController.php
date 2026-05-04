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

        $query = TaxInvoice::with(['invoiceDailies.fuelType'])
            ->whereBetween('invoice_date', [$fromDate, $toDate]);

        if ($request->client_id) {
            $client = Client::find($request->client_id);
            if ($client) {
                $query->where('client_name', $client->client_name);
            }
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

        $invoices = $query->orderBy('invoice_date', 'desc')
                          ->orderBy('tax_invoice_no', 'desc')
                          ->paginate(20);

        // Pre-load clients keyed by client_name for fast lookup
        $clients = Client::whereNull('deleted_at')
            ->get()
            ->keyBy('client_name');

        // Track serial number across paginated results
        $offset = ($invoices->currentPage() - 1) * $invoices->perPage();

        // Transform the paginated items
        $invoices->getCollection()->transform(function ($invoice, $index) use ($clients, $offset) {
            $clientRecord = $clients->get($invoice->client_name);

            $tin = $clientRecord ? substr($clientRecord->vat_no ?? '', 0, 9) : '';
            $purchaserName = $clientRecord ? ($clientRecord->c_name ?? $invoice->client_name) : $invoice->client_name;

            $firstDaily = $invoice->invoiceDailies->first();
            $fuelTypeName = $firstDaily?->fuelType?->name ?? '';
            $description = trim($fuelTypeName) !== '' ? $fuelTypeName . ' Fuel Purchase' : 'Fuel Purchase';

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

        $query = TaxInvoice::with(['invoiceDailies.fuelType'])
            ->whereBetween('invoice_date', [$fromDate, $toDate]);

        if ($request->client_id) {
            $client = Client::find($request->client_id);
            if ($client) {
                $query->where('client_name', $client->client_name);
            }
        }

        if ($request->payment_method_id) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        $invoices = $query->orderBy('invoice_date', 'asc')
                          ->orderBy('tax_invoice_no', 'asc')
                          ->get();

        // Pre-load clients keyed by client_name for fast lookup
        $clients = Client::whereNull('deleted_at')
            ->get()
            ->keyBy('client_name');

        return new StreamedResponse(function () use ($invoices, $clients) {
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
                $clientRecord = $clients->get($invoice->client_name);

                $tin = $clientRecord ? substr($clientRecord->vat_no ?? '', 0, 9) : '';
                $purchaserName = $clientRecord ? ($clientRecord->c_name ?? $invoice->client_name) : $invoice->client_name;

                $firstDaily = $invoice->invoiceDailies->first();
                $fuelTypeName = $firstDaily?->fuelType?->name ?? '';
                $description = trim($fuelTypeName) !== '' ? $fuelTypeName . ' Fuel Purchase' : 'Fuel Purchase';

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
            'Content-Disposition' => 'attachment; filename="invoice-summary.csv"',
            'Cache-Control'       => 'no-store, no-cache',
            'Pragma'              => 'no-cache',
        ]);
    }
}
