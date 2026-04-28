<?php

namespace App\Http\Controllers;

use App\Models\FuelCategory;
use App\Models\FuelType;
use App\Models\Purchase;
use App\Models\Settings;
use App\Models\Vat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    /**
     * Display the purchase entry page.
     */
    public function index()
    {
        $settings = Settings::first();
        $fuelCategories = FuelCategory::getAllCategories();
        $currentVat = Vat::whereNull('to_date')->orderBy('from_date', 'desc')->first();

        return Inertia::render('Purchase', [
            'supplierName' => $settings->supplier_name ?? '',
            'fuelCategories' => $fuelCategories->map(fn($c) => [
                'value' => (string) $c->id,
                'label' => $c->name,
            ])->values(),
            'currentVat' => [
                'percentage' => $currentVat ? $currentVat->vat_percentage : 0,
            ],
        ]);
    }

    /**
     * Get fuel price from fuel_price_history for a given fuel type and date.
     */
    public function getFuelPrice(int $fuel_type_id, Request $request)
    {
        $purchaseDate = $request->input('purchase_date', now()->format('Y-m-d'));

        $priceHistory = DB::table('fuel_price_history')
            ->where('fuel_type_id', $fuel_type_id)
            ->where('from_date', '<=', $purchaseDate)
            ->where(function ($query) use ($purchaseDate) {
                $query->whereNull('to_date')
                      ->orWhere('to_date', '>=', $purchaseDate);
            })
            ->orderBy('from_date', 'desc')
            ->first();

        if (!$priceHistory) {
            return response()->json([
                'error' => 'No fuel price configured for this fuel type and date'
            ], 404);
        }

        return response()->json([
            'price' => $priceHistory->fuel_price
        ]);
    }

    /**
     * Return fuel types for a given fuel category.
     */
    public function getFuelTypesByCategory(int $category_id)
    {
        $fuelTypes = FuelType::where('fuel_category_id', $category_id)
            ->select('id as value', 'name as label', 'price')
            ->get()
            ->map(fn($ft) => [
                'value' => (string) $ft->value,
                'label' => $ft->label,
                'price' => $ft->price,
            ]);

        return response()->json($fuelTypes);
    }

    /**
     * Store a new purchase record.
     */
    public function store(Request $request)
    {
        $request->validate([
            'supplier_name'   => 'nullable|string|max:255',
            'invoice_number'  => 'nullable|string|max:100',
            'date'            => 'required|date',
            'fuel_category_id'=> 'required|integer|exists:fuel_category,id',
            'fuel_type_id'    => 'required|integer|exists:fuel_type,id',
            'volume'          => 'required|numeric|min:0',
            'unit_price'      => 'required|numeric|min:0',
            'amount'          => 'required|numeric|min:0',
            'discount'        => 'nullable|numeric|min:0',
            'invoice_amount'  => 'required|numeric|min:0',
            'vat_percentage'  => 'required|numeric|min:0',
            'vat_amount'      => 'required|numeric|min:0',
            'net_amount'      => 'required|numeric|min:0',
        ]);

        $purchase = Purchase::create([
            'supplier_name'    => $request->supplier_name,
            'invoice_number'   => $request->invoice_number,
            'date'             => $request->date,
            'fuel_category_id' => $request->fuel_category_id,
            'fuel_type_id'     => $request->fuel_type_id,
            'volume'           => $request->volume,
            'unit_price'       => $request->unit_price,
            'amount'           => $request->amount,
            'discount'         => $request->discount ?? 0,
            'invoice_amount'   => $request->invoice_amount,
            'vat_percentage'   => $request->vat_percentage,
            'vat_amount'       => $request->vat_amount,
            'net_amount'       => $request->net_amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Purchase record saved successfully',
            'purchase' => $purchase,
        ]);
    }
}
