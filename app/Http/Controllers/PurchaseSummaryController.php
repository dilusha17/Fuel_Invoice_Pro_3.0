<?php

namespace App\Http\Controllers;

use App\Models\FuelCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        $page     = (int) $request->input('page', 1);
        $perPage  = 20;
        $offset   = ($page - 1) * $perPage;

        $settings     = DB::table('settings')->first();
        $tin          = substr($settings->supplier_vat_no ?? '', 0, 9);
        $supplierName = $settings->supplier_name ?? '';

        $query = DB::table('purchase')
            ->join('fuel_category', 'purchase.fuel_category_id', '=', 'fuel_category.id')
            ->join('fuel_type', 'purchase.fuel_type_id', '=', 'fuel_type.id')
            ->select(
                'purchase.id',
                'purchase.date',
                'purchase.invoice_number',
                'fuel_type.name as fuel_type_name',
                'purchase.discount',
                'purchase.vat_percentage',
                'purchase.vat_amount',
                'purchase.net_amount'
            )
            ->whereBetween('purchase.date', [$fromDate->toDateString(), $toDate->toDateString()]);

        if ($request->fuel_category_id) {
            $query->where('purchase.fuel_category_id', $request->fuel_category_id);
        }

        // Totals — separate query with ONLY aggregate selects (avoids ONLY_FULL_GROUP_BY)
        $totalsBaseQuery = DB::table('purchase')
            ->join('fuel_category', 'purchase.fuel_category_id', '=', 'fuel_category.id')
            ->join('fuel_type', 'purchase.fuel_type_id', '=', 'fuel_type.id')
            ->whereBetween('purchase.date', [$fromDate->toDateString(), $toDate->toDateString()]);

        if ($request->fuel_category_id) {
            $totalsBaseQuery->where('purchase.fuel_category_id', $request->fuel_category_id);
        }

        $totalsRaw = $totalsBaseQuery->selectRaw(
            'SUM(purchase.net_amount) as sum_net,
             SUM(purchase.vat_amount) as sum_vat,
             SUM(purchase.discount / (100 + purchase.vat_percentage) * purchase.vat_percentage) as sum_disallowed_vat'
        )->first();

        $totals = [
            'sum_net'             => round((float) ($totalsRaw->sum_net ?? 0), 2),
            'sum_vat'             => round((float) ($totalsRaw->sum_vat ?? 0), 2),
            'sum_disallowed_vat'  => round((float) ($totalsRaw->sum_disallowed_vat ?? 0), 2),
        ];

        $paginated = $query->orderBy('purchase.date')->paginate($perPage);

        $mapped = collect($paginated->items())->map(function ($row, $index) use ($offset, $tin, $supplierName) {
            $disallowedVat = ($row->vat_percentage > 0)
                ? round($row->discount / (100 + $row->vat_percentage) * $row->vat_percentage, 2)
                : 0.00;

            return [
                'id'              => $row->id,
                'serial_no'       => $offset + $index + 1,
                'invoice_date'    => Carbon::parse($row->date)->format('m/d/Y'),
                'tax_invoice_no'  => $row->invoice_number ?? '',
                'tin'             => $tin,
                'supplier_name'   => $supplierName,
                'description'     => $row->fuel_type_name . ' Fuel Purchase',
                'net_amount'      => round((float) $row->net_amount, 2),
                'vat_amount'      => round((float) $row->vat_amount, 2),
                'disallowed_vat'  => $disallowedVat,
            ];
        });

        return response()->json([
            'records' => [
                'data'         => $mapped,
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
            'totals'  => $totals,
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $request->validate([
            'from_date'        => 'required|date',
            'to_date'          => 'required|date|after_or_equal:from_date',
            'fuel_category_id' => 'nullable|integer|exists:fuel_category,id',
        ]);

        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate   = Carbon::parse($request->to_date)->endOfDay();

        $settings     = DB::table('settings')->first();
        $tin          = substr($settings->supplier_vat_no ?? '', 0, 9);
        $supplierName = $settings->supplier_name ?? '';

        $query = DB::table('purchase')
            ->join('fuel_category', 'purchase.fuel_category_id', '=', 'fuel_category.id')
            ->join('fuel_type', 'purchase.fuel_type_id', '=', 'fuel_type.id')
            ->select(
                'purchase.date',
                'purchase.invoice_number',
                'fuel_type.name as fuel_type_name',
                'purchase.discount',
                'purchase.vat_percentage',
                'purchase.vat_amount',
                'purchase.net_amount'
            )
            ->whereBetween('purchase.date', [$fromDate->toDateString(), $toDate->toDateString()])
            ->orderBy('purchase.date');

        if ($request->fuel_category_id) {
            $query->where('purchase.fuel_category_id', $request->fuel_category_id);
        }

        $records  = $query->get();
        $filename = 'purchase-summary-' . $fromDate->format('m-d-Y') . '-to-' . $toDate->format('m-d-Y') . '.csv';

        return new StreamedResponse(function () use ($records, $tin, $supplierName, $filename) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Serial No',
                'Invoice Date',
                'Tax Invoice No',
                "Supplier's TIN",
                'Name of the Supplier',
                'Description',
                'Value of purchase',
                'VAT Amount',
                'Disallowed VAT Amount',
            ]);

            $sumNet          = 0.0;
            $sumVat          = 0.0;
            $sumDisallowed   = 0.0;

            foreach ($records as $index => $row) {
                $disallowedVat = ($row->vat_percentage > 0)
                    ? round($row->discount / (100 + $row->vat_percentage) * $row->vat_percentage, 2)
                    : 0.00;

                $net = round((float) $row->net_amount, 2);
                $vat = round((float) $row->vat_amount, 2);

                $sumNet        += $net;
                $sumVat        += $vat;
                $sumDisallowed += $disallowedVat;

                fputcsv($handle, [
                    $index + 1,
                    Carbon::parse($row->date)->format('m/d/Y'),
                    $row->invoice_number ?? '',
                    $tin,
                    $supplierName,
                    $row->fuel_type_name . ' Fuel Purchase',
                    $net,
                    $vat,
                    $disallowedVat,
                ]);
            }

            // Totals row
            fputcsv($handle, [
                '', '', '', '', '', 'Total',
                round($sumNet, 2),
                round($sumVat, 2),
                round($sumDisallowed, 2),
            ]);

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
        ]);
    }
}
