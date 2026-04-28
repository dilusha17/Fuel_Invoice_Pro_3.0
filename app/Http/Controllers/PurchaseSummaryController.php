<?php

namespace App\Http\Controllers;

use App\Models\FuelCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Inertia\Inertia;

class PurchaseSummaryController extends Controller
{
    public function index()
    {
        $fuelCategories = FuelCategory::getAllCategories();

        return Inertia::render('PurchaseSummary', [
            'fuelCategories' => $fuelCategories->map(fn($c) => [
                'value' => (string) $c->id,
                'label' => $c->name,
            ])->values(),
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'from_date'          => 'required|date',
            'to_date'            => 'required|date|after_or_equal:from_date',
            'fuel_category_id'   => 'nullable|integer|exists:fuel_category,id',
        ]);

        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate   = Carbon::parse($request->to_date)->endOfDay();

        $query = DB::table('purchase')
            ->join('fuel_category', 'purchase.fuel_category_id', '=', 'fuel_category.id')
            ->join('fuel_type', 'purchase.fuel_type_id', '=', 'fuel_type.id')
            ->select(
                'purchase.id',
                'purchase.date',
                'purchase.invoice_number',
                'purchase.supplier_name',
                'fuel_category.name as fuel_category_name',
                'fuel_type.name as fuel_type_name',
                'purchase.volume',
                'purchase.unit_price',
                'purchase.amount',
                'purchase.discount',
                'purchase.invoice_amount',
                'purchase.vat_percentage',
                'purchase.vat_amount',
                'purchase.net_amount'
            )
            ->whereBetween('purchase.date', [$fromDate->toDateString(), $toDate->toDateString()]);

        if ($request->fuel_category_id) {
            $query->where('purchase.fuel_category_id', $request->fuel_category_id);
        }

        // Totals (un-paginated clone)
        $totalsQuery = clone $query;
        $totals = [
            'sum_amount'         => round((float) $totalsQuery->sum('purchase.amount'), 2),
            'sum_discount'       => round((float) $totalsQuery->sum('purchase.discount'), 2),
            'sum_invoice_amount' => round((float) $totalsQuery->sum('purchase.invoice_amount'), 2),
            'sum_vat'            => round((float) $totalsQuery->sum('purchase.vat_amount'), 2),
            'sum_net'            => round((float) $totalsQuery->sum('purchase.net_amount'), 2),
        ];

        $records = $query->orderBy('purchase.date')->paginate(20);

        return response()->json([
            'records' => $records,
            'totals'  => $totals,
        ]);
    }

    public function print(Request $request)
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date'   => 'required|date|after_or_equal:from_date',
            'fuel_category_id' => 'nullable|integer|exists:fuel_category,id',
        ]);

        $fromDate = Carbon::parse($request->from_date);
        $toDate   = Carbon::parse($request->to_date);

        $query = DB::table('purchase')
            ->join('fuel_category', 'purchase.fuel_category_id', '=', 'fuel_category.id')
            ->join('fuel_type', 'purchase.fuel_type_id', '=', 'fuel_type.id')
            ->select(
                'purchase.date',
                'purchase.invoice_number',
                'purchase.supplier_name',
                'fuel_category.name as fuel_category_name',
                'fuel_type.name as fuel_type_name',
                'purchase.amount',
                'purchase.discount',
                'purchase.invoice_amount',
                'purchase.vat_percentage',
                'purchase.vat_amount',
                'purchase.net_amount'
            )
            ->whereBetween('purchase.date', [$fromDate->toDateString(), $toDate->toDateString()])
            ->orderBy('purchase.date');

        if ($request->fuel_category_id) {
            $query->where('purchase.fuel_category_id', $request->fuel_category_id);
        }

        $records = $query->get();

        $totals = [
            'sum_amount'         => round((float) $records->sum('amount'), 2),
            'sum_discount'       => round((float) $records->sum('discount'), 2),
            'sum_invoice_amount' => round((float) $records->sum('invoice_amount'), 2),
            'sum_vat'            => round((float) $records->sum('vat_amount'), 2),
            'sum_net'            => round((float) $records->sum('net_amount'), 2),
        ];

        $settings = DB::table('settings')->first();

        $data = [
            'companyName'    => $settings->company_name,
            'companyAddress' => $settings->company_address,
            'companyPhone'   => $settings->company_contact,
            'vatRegNo'       => $settings->company_vat_no,
            'printedDate'    => now()->format('Y-m-d'),
            'fromDate'       => $fromDate,
            'toDate'         => $toDate,
            'records'        => $records,
            'totals'         => $totals,
        ];

        $pdf = Pdf::loadView('pdf.purchase-summary', $data);
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('margin-top', '10mm');
        $pdf->setOption('margin-right', '10mm');
        $pdf->setOption('margin-bottom', '10mm');
        $pdf->setOption('margin-left', '10mm');

        return $pdf->stream('purchase-summary-' . $fromDate->format('Y-m-d') . '-to-' . $toDate->format('Y-m-d') . '.pdf');
    }
}
