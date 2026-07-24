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

        $query = $this->buildUnionQuery($fromDate, $toDate, $request->fuel_category_id);

        $totalsRaw = DB::query()->fromSub($query, 'combined')
            ->selectRaw('SUM(net_amount) as sum_net, SUM(vat_amount) as sum_vat')
            ->first();

        $totals = [
            'sum_net'             => round((float) ($totalsRaw->sum_net ?? 0), 2),
            'sum_vat'             => round((float) ($totalsRaw->sum_vat ?? 0), 2),
            'sum_disallowed_vat'  => 0.00,
        ];

        $paginated = $query->orderBy('date')->paginate($perPage, ['*'], 'page', $page);

        $mapped = collect($paginated->items())->map(function ($row, $index) use ($offset) {
            return [
                'id'              => $row->id,
                'serial_no'       => $offset + $index + 1,
                'invoice_date'    => Carbon::parse($row->date)->format('m/d/Y'),
                'tax_invoice_no'  => $row->tax_invoice_no ?? '',
                'tin'             => substr($row->supplier_vat_no ?? '', 0, 9),
                'supplier_name'   => $row->supplier_name ?? '',
                'description'     => $row->description,
                'net_amount'      => round((float) $row->net_amount, 2),
                'vat_amount'      => round((float) $row->vat_amount, 2),
                'disallowed_vat'  => 0.00,
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

    /**
     * Build a unioned query of fuel purchases and lubricant purchases within a date range.
     * When a fuel category filter is applied, lubricant purchases (which have no category) are excluded.
     */
    private function buildUnionQuery(Carbon $fromDate, Carbon $toDate, $fuelCategoryId = null)
    {
        $fuelQuery = DB::table('purchase')
            ->join('fuel_type', 'purchase.fuel_type_id', '=', 'fuel_type.id')
            ->leftJoin('supplier', 'purchase.supplier_id', '=', 'supplier.id')
            ->whereBetween('purchase.date', [$fromDate->toDateString(), $toDate->toDateString()])
            ->select(
                'purchase.id',
                'purchase.date',
                'purchase.tax_invoice_no',
                DB::raw("CONCAT(fuel_type.name, ' Fuel Purchase') as description"),
                'purchase.net_amount',
                'purchase.vat_amount',
                'supplier.name as supplier_name',
                'supplier.vat_no as supplier_vat_no'
            );

        if ($fuelCategoryId) {
            $fuelQuery->where('purchase.fuel_category_id', $fuelCategoryId);
        }

        if ($fuelCategoryId) {
            // A specific fuel category was requested; lubricant purchases don't belong to one.
            return $fuelQuery;
        }

        $lubricantQuery = DB::table('lubricant_purchase')
            ->leftJoin('supplier', 'lubricant_purchase.supplier_id', '=', 'supplier.id')
            ->whereNull('lubricant_purchase.deleted_at')
            ->whereBetween('lubricant_purchase.date', [$fromDate->toDateString(), $toDate->toDateString()])
            ->select(
                'lubricant_purchase.id',
                'lubricant_purchase.date',
                'lubricant_purchase.tax_invoice_no',
                DB::raw("'Lubricant Purchases' as description"),
                'lubricant_purchase.net_amount',
                'lubricant_purchase.vat_amount',
                'supplier.name as supplier_name',
                'supplier.vat_no as supplier_vat_no'
            );

        return $fuelQuery->unionAll($lubricantQuery);
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

        $query = $this->buildUnionQuery($fromDate, $toDate, $request->fuel_category_id);
        $records  = $query->orderBy('date')->get();
        $filename = 'purchase-summary-' . $fromDate->format('m-d-Y') . '-to-' . $toDate->format('m-d-Y') . '.csv';

        return new StreamedResponse(function () use ($records, $filename) {
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
                $disallowedVat = 0.00;

                $net = round((float) $row->net_amount, 2);
                $vat = round((float) $row->vat_amount, 2);

                $sumNet        += $net;
                $sumVat        += $vat;
                $sumDisallowed += $disallowedVat;

                fputcsv($handle, [
                    $index + 1,
                    Carbon::parse($row->date)->format('m/d/Y'),
                    $row->tax_invoice_no ?? '',
                    substr($row->supplier_vat_no ?? '', 0, 9),
                    $row->supplier_name ?? '',
                    $row->description,
                    $net,
                    $vat,
                    $disallowedVat,
                ]);
            }

            // Totals row
            fputcsv($handle, [
                '',
                '',
                '',
                '',
                '',
                '',
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
