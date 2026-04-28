<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class CashSaleController extends Controller
{
    /**
     * Display the cash sale page
     */
    public function index()
    {
        // Fetch recent 5 monthly income records ordered by year and month descending
        $recentEntries = DB::table('monthly_income')
            ->select('year', 'month', 'income')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($record) {
                return [
                    'year' => $record->year,
                    'month' => str_pad($record->month, 2, '0', STR_PAD_LEFT),
                    'income' => (float)$record->income,
                ];
            });

        // Get current VAT percentage from the latest record
        $currentVat = DB::table('vat')
            ->orderBy('from_date', 'desc')
            ->first();

        return Inertia::render('CashSale', [
            'recentEntries' => $recentEntries,
            'vatPercentage' => $currentVat ? (float)$currentVat->vat_percentage : 15,
        ]);
    }

    /**
     * Store monthly income record
     */
    public function store(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'income' => 'required|numeric|min:0',
        ]);

        try {
            // Check if record already exists for this year and month
            $existing = DB::table('monthly_income')
                ->where('year', $request->year)
                ->where('month', $request->month)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cash sale for this month already exists.',
                ]);
            }

            // Insert new record
            DB::table('monthly_income')->insert([
                'year' => $request->year,
                'month' => $request->month,
                'income' => $request->income,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Monthly income saved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save monthly income: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retrieve monthly income record
     */
    public function show(Request $request)
    {
        $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $record = DB::table('monthly_income')
            ->where('year', $request->year)
            ->where('month', $request->month)
            ->first();

        if ($record) {
            // Get current VAT percentage
            $currentVat = DB::table('vat')
                ->orderBy('from_date', 'desc')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'income' => (float)$record->income,
                    'vatPercentage' => $currentVat ? (float)$currentVat->vat_percentage : 15,
                ],
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'No record found for this period',
            ], 404);
        }
    }

    /**
     * Generate PDF for cash sale
     */
    public function generatePDF(Request $request)
    {
        $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        // Get monthly income record
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

        // Get company settings
        $settings = DB::table('settings')->first();

        // Get current VAT percentage
        $currentVat = DB::table('vat')
            ->orderBy('from_date', 'desc')
            ->first();

        $vatPercentage = $currentVat ? (float)$currentVat->vat_percentage : 18;

        // Calculate VAT and Cash Sale
        $totalIncome = (float)$record->income;
        $vatAmount = $totalIncome * ($vatPercentage / (100 + $vatPercentage));
        $cashSale = $totalIncome - $vatAmount;

        // Month names
        $monthNames = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        $data = [
            'companyName' => $settings->company_name,
            'companyAddress' => $settings->company_address,
            'companyPhone' => $settings->company_contact,
            'vatRegNo' => $settings->company_vat_no,
            'printedDate' => now()->format('Y-m-d'),
            'year' => $request->year,
            'monthName' => $monthNames[$request->month],
            'totalIncome' => $totalIncome,
            'vatAmount' => $vatAmount,
            'cashSale' => $cashSale,
        ];

        $pdf = Pdf::loadView('pdf.cash-sale', $data);
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('margin-top', '18mm');
        $pdf->setOption('margin-right', '10mm');
        $pdf->setOption('margin-bottom', '10mm');
        $pdf->setOption('margin-left', '10mm');

        return $pdf->stream('cash-sale-' . $monthNames[$request->month] . '-' . $request->year . '.pdf');
    }

    /**
     * View PDF for cash sale (GET route with clean URL)
     */
    public function viewPDF($year, $month)
    {
        // Validate parameters
        if (!is_numeric($year) || !is_numeric($month) || $month < 1 || $month > 12) {
            abort(404);
        }

        $year = (int) $year;
        $month = (int) $month;

        // Get monthly income record
        $record = DB::table('monthly_income')
            ->where('year', $year)
            ->where('month', $month)
            ->first();

        if (!$record) {
            abort(404, 'No record found for this period');
        }

        // Get company settings
        $settings = DB::table('settings')->first();

        // Get current VAT percentage
        $currentVat = DB::table('vat')
            ->orderBy('from_date', 'desc')
            ->first();

        $vatPercentage = $currentVat ? (float)$currentVat->vat_percentage : 18;

        // Calculate VAT and Cash Sale
        $totalIncome = (float)$record->income;
        $vatAmount = $totalIncome * ($vatPercentage / (100 + $vatPercentage));
        $cashSale = $totalIncome - $vatAmount;

        // Month names
        $monthNames = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        $data = [
            'companyName' => $settings->company_name,
            'companyAddress' => $settings->company_address,
            'companyPhone' => $settings->company_contact,
            'vatRegNo' => $settings->company_vat_no,
            'printedDate' => now()->format('Y-m-d'),
            'year' => $year,
            'monthName' => $monthNames[$month],
            'totalIncome' => $totalIncome,
            'vatAmount' => $vatAmount,
            'cashSale' => $cashSale,
        ];

        $pdf = Pdf::loadView('pdf.cash-sale', $data);
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('margin-top', '18mm');
        $pdf->setOption('margin-right', '10mm');
        $pdf->setOption('margin-bottom', '10mm');
        $pdf->setOption('margin-left', '10mm');

        $filename = 'cash-sale-' . $monthNames[$month] . '-' . $year . '.pdf';

        return $pdf->stream($filename);
    }
}
