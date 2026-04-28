<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class VatBalanceController extends Controller
{
    public function index()
    {
        return Inertia::render('VatBalance');
    }

    public function generate(Request $request)
    {
        $request->validate([
            'from_year'  => 'required|integer|min:2000|max:2100',
            'from_month' => 'required|integer|min:1|max:12',
            'to_year'    => 'required|integer|min:2000|max:2100',
            'to_month'   => 'required|integer|min:1|max:12',
        ]);

        $fromYear  = (int) $request->from_year;
        $fromMonth = (int) $request->from_month;
        $toYear    = (int) $request->to_year;
        $toMonth   = (int) $request->to_month;

        // Date range for purchase table
        $startDate = sprintf('%04d-%02d-01', $fromYear, $fromMonth);
        $endDate   = date('Y-m-t', strtotime(sprintf('%04d-%02d-01', $toYear, $toMonth)));

        // Purchase totals
        $purchaseTotals = DB::table('purchase')
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('
                ROUND(SUM(invoice_amount), 2) as total_purchase_amount,
                ROUND(SUM(net_amount), 2) as purchase_net_amount,
                ROUND(SUM(vat_amount), 2) as purchase_vat_amount
            ')
            ->first();

        // Sale totals — filter by year×100+month range
        $fromPeriod = $fromYear * 100 + $fromMonth;
        $toPeriod   = $toYear * 100 + $toMonth;

        $saleTotals = DB::table('monthly_income')
            ->selectRaw('
                ROUND(SUM(income), 2) as total_sale,
                ROUND(SUM(COALESCE(net_amount, 0)), 2) as sale_net_amount,
                ROUND(SUM(COALESCE(vat_amount, 0)), 2) as sale_vat_amount
            ')
            ->whereRaw('(year * 100 + month) BETWEEN ? AND ?', [$fromPeriod, $toPeriod])
            ->first();

        $purchaseVatAmount = (float) ($purchaseTotals->purchase_vat_amount ?? 0);
        $saleVatAmount     = (float) ($saleTotals->sale_vat_amount ?? 0);
        $balance           = round($saleVatAmount - $purchaseVatAmount, 2);

        return response()->json([
            'success' => true,
            'data'    => [
                'total_purchase_amount' => (float) ($purchaseTotals->total_purchase_amount ?? 0),
                'purchase_net_amount'   => (float) ($purchaseTotals->purchase_net_amount ?? 0),
                'purchase_vat_amount'   => $purchaseVatAmount,
                'total_sale'            => (float) ($saleTotals->total_sale ?? 0),
                'sale_net_amount'       => (float) ($saleTotals->sale_net_amount ?? 0),
                'sale_vat_amount'       => $saleVatAmount,
                'balance'               => $balance,
            ],
        ]);
    }

    public function print(Request $request)
    {
        $request->validate([
            'from_year'  => 'required|integer|min:2000|max:2100',
            'from_month' => 'required|integer|min:1|max:12',
            'to_year'    => 'required|integer|min:2000|max:2100',
            'to_month'   => 'required|integer|min:1|max:12',
        ]);

        $fromYear  = (int) $request->from_year;
        $fromMonth = (int) $request->from_month;
        $toYear    = (int) $request->to_year;
        $toMonth   = (int) $request->to_month;

        $startDate = sprintf('%04d-%02d-01', $fromYear, $fromMonth);
        $endDate   = date('Y-m-t', strtotime(sprintf('%04d-%02d-01', $toYear, $toMonth)));

        $purchaseTotals = DB::table('purchase')
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('
                ROUND(SUM(invoice_amount), 2) as total_purchase_amount,
                ROUND(SUM(net_amount), 2) as purchase_net_amount,
                ROUND(SUM(vat_amount), 2) as purchase_vat_amount
            ')
            ->first();

        $fromPeriod = $fromYear * 100 + $fromMonth;
        $toPeriod   = $toYear * 100 + $toMonth;

        $saleTotals = DB::table('monthly_income')
            ->selectRaw('
                ROUND(SUM(income), 2) as total_sale,
                ROUND(SUM(COALESCE(net_amount, 0)), 2) as sale_net_amount,
                ROUND(SUM(COALESCE(vat_amount, 0)), 2) as sale_vat_amount
            ')
            ->whereRaw('(year * 100 + month) BETWEEN ? AND ?', [$fromPeriod, $toPeriod])
            ->first();

        $monthNames = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December',
        ];

        $purchaseVatAmount = (float) ($purchaseTotals->purchase_vat_amount ?? 0);
        $saleVatAmount     = (float) ($saleTotals->sale_vat_amount ?? 0);
        $balance           = round($saleVatAmount - $purchaseVatAmount, 2);

        $settings = DB::table('settings')->first();

        $data = [
            'companyName'          => $settings->company_name,
            'companyAddress'       => $settings->company_address,
            'companyPhone'         => $settings->company_contact,
            'vatRegNo'             => $settings->company_vat_no,
            'printedDate'          => now()->format('Y-m-d'),
            'fromPeriod'           => $monthNames[$fromMonth] . ' ' . $fromYear,
            'toPeriod'             => $monthNames[$toMonth] . ' ' . $toYear,
            'totalPurchaseAmount'  => (float) ($purchaseTotals->total_purchase_amount ?? 0),
            'purchaseNetAmount'    => (float) ($purchaseTotals->purchase_net_amount ?? 0),
            'purchaseVatAmount'    => $purchaseVatAmount,
            'totalSale'            => (float) ($saleTotals->total_sale ?? 0),
            'saleNetAmount'        => (float) ($saleTotals->sale_net_amount ?? 0),
            'saleVatAmount'        => $saleVatAmount,
            'balance'              => $balance,
        ];

        $pdf = Pdf::loadView('pdf.vat-balance', $data);
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('margin-top', '10mm');
        $pdf->setOption('margin-right', '10mm');
        $pdf->setOption('margin-bottom', '10mm');
        $pdf->setOption('margin-left', '10mm');

        return $pdf->stream('vat-balance-report.pdf');
    }
}
