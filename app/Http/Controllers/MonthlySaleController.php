<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class MonthlySaleController extends Controller
{
    /**
     * Display the monthly sale page
     */
    public function index()
    {
        $recentEntries = DB::table('monthly_income')
            ->select('year', 'month', 'income', 'vat_percentage', 'vat_amount', 'net_amount')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($record) {
                return [
                    'year'           => $record->year,
                    'month'          => str_pad($record->month, 2, '0', STR_PAD_LEFT),
                    'income'         => (float) $record->income,
                    'vat_percentage' => (float) ($record->vat_percentage ?? 0),
                    'vat_amount'     => (float) ($record->vat_amount ?? 0),
                    'net_amount'     => (float) ($record->net_amount ?? 0),
                ];
            });

        $currentVat = DB::table('vat')
            ->orderBy('from_date', 'desc')
            ->first();

        return Inertia::render('MonthlySale', [
            'recentEntries' => $recentEntries,
            'vatPercentage' => $currentVat ? (float) $currentVat->vat_percentage : 15,
        ]);
    }

    /**
     * Return the 5 most recent monthly income entries as JSON
     */
    public function getRecentEntries()
    {
        $recentEntries = DB::table('monthly_income')
            ->select('year', 'month', 'income', 'vat_percentage', 'vat_amount', 'net_amount')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($record) {
                return [
                    'year'           => $record->year,
                    'month'          => str_pad($record->month, 2, '0', STR_PAD_LEFT),
                    'income'         => (float) $record->income,
                    'vat_percentage' => (float) ($record->vat_percentage ?? 0),
                    'vat_amount'     => (float) ($record->vat_amount ?? 0),
                    'net_amount'     => (float) ($record->net_amount ?? 0),
                ];
            });

        return response()->json(['success' => true, 'data' => $recentEntries]);
    }

    /**
     * Store monthly sale record with VAT calculation
     */
    public function store(Request $request)
    {
        $request->validate([
            'year'   => 'required|integer|min:2000|max:2100',
            'month'  => 'required|integer|min:1|max:12',
            'income' => 'required|numeric|min:0',
        ]);

        try {
            $existing = DB::table('monthly_income')
                ->where('year', $request->year)
                ->where('month', $request->month)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Monthly sale for this month already exists.',
                ]);
            }

            // Get current VAT percentage
            $currentVat = DB::table('vat')
                ->orderBy('from_date', 'desc')
                ->first();

            $vatPercentage = $currentVat ? (float) $currentVat->vat_percentage : 0;
            $income        = (float) $request->income;
            $vatAmount     = round($income * ($vatPercentage / (100 + $vatPercentage)), 2);
            $netAmount     = round($income - $vatAmount, 2);

            DB::table('monthly_income')->insert([
                'year'           => $request->year,
                'month'          => $request->month,
                'income'         => round($income, 2),
                'vat_percentage' => round($vatPercentage, 2),
                'vat_amount'     => $vatAmount,
                'net_amount'     => $netAmount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Monthly sale saved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save monthly sale: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retrieve monthly sale record
     */
    public function show(Request $request)
    {
        $request->validate([
            'year'  => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $record = DB::table('monthly_income')
            ->where('year', $request->year)
            ->where('month', $request->month)
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'No record found for this period',
            ], 404);
        }

        $income = (float) $record->income;

        // Use stored VAT values if available (new records), else calculate (legacy records)
        if (!empty($record->vat_percentage) || !empty($record->vat_amount)) {
            $vatPercentage = (float) ($record->vat_percentage ?? 0);
            $vatAmount     = (float) ($record->vat_amount ?? 0);
            $netAmount     = (float) ($record->net_amount ?? 0);
        } else {
            $currentVat    = DB::table('vat')->orderBy('from_date', 'desc')->first();
            $vatPercentage = $currentVat ? (float) $currentVat->vat_percentage : 15;
            $vatAmount     = round($income * ($vatPercentage / (100 + $vatPercentage)), 2);
            $netAmount     = round($income - $vatAmount, 2);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'income'         => $income,
                'vatPercentage'  => $vatPercentage,
                'vatAmount'      => $vatAmount,
                'netAmount'      => $netAmount,
            ],
        ]);
    }

    /**
     * Generate PDF for monthly sale (POST, used by frontend)
     */
    public function generatePDF(Request $request)
    {
        $request->validate([
            'year'  => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $record = DB::table('monthly_income')
            ->where('year', $request->year)
            ->where('month', $request->month)
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'No record found for this period',
            ], 404);
        }

        return $this->buildPdf((int) $request->year, (int) $request->month, $record);
    }

    /**
     * View PDF for monthly sale (GET route with clean URL)
     */
    public function viewPDF($year, $month)
    {
        if (!is_numeric($year) || !is_numeric($month) || $month < 1 || $month > 12) {
            abort(404);
        }

        $year  = (int) $year;
        $month = (int) $month;

        $record = DB::table('monthly_income')
            ->where('year', $year)
            ->where('month', $month)
            ->first();

        if (!$record) {
            abort(404, 'No record found for this period');
        }

        return $this->buildPdf($year, $month, $record);
    }

    private function buildPdf(int $year, int $month, object $record)
    {
        $settings = DB::table('settings')->first();

        $income = (float) $record->income;

        if (!empty($record->vat_percentage) || !empty($record->vat_amount)) {
            $vatPercentage = (float) ($record->vat_percentage ?? 0);
            $vatAmount     = (float) ($record->vat_amount ?? 0);
            $netAmount     = (float) ($record->net_amount ?? 0);
        } else {
            $currentVat    = DB::table('vat')->orderBy('from_date', 'desc')->first();
            $vatPercentage = $currentVat ? (float) $currentVat->vat_percentage : 18;
            $vatAmount     = round($income * ($vatPercentage / (100 + $vatPercentage)), 2);
            $netAmount     = round($income - $vatAmount, 2);
        }

        $monthNames = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December',
        ];

        $data = [
            'companyName'    => $settings->company_name,
            'companyAddress' => $settings->company_address,
            'companyPhone'   => $settings->company_contact,
            'vatRegNo'       => $settings->company_vat_no,
            'printedDate'    => now()->format('Y-m-d'),
            'year'           => $year,
            'monthName'      => $monthNames[$month],
            'totalIncome'    => $income,
            'vatPercentage'  => $vatPercentage,
            'vatAmount'      => $vatAmount,
            'netAmount'      => $netAmount,
        ];

        $pdf = Pdf::loadView('pdf.monthly-sale', $data);
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('margin-top', '18mm');
        $pdf->setOption('margin-right', '10mm');
        $pdf->setOption('margin-bottom', '10mm');
        $pdf->setOption('margin-left', '10mm');

        return $pdf->stream('monthly-sale-' . $monthNames[$month] . '-' . $year . '.pdf');
    }
}
