<?php

namespace App\Http\Controllers;

use App\Models\FuelCategory;
use App\Models\FuelType;
use App\Models\LubricantPurchase;
use App\Models\LubricantPurchaseItem;
use App\Models\LubricantType;
use App\Models\Purchase;
use App\Models\Supplier;
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
        $fuelCategories = FuelCategory::where('id', '!=', 3)->select('id', 'name')->get();
        $currentVat = Vat::whereNull('to_date')->orderBy('from_date', 'desc')->first();
        $vatPercentage = $currentVat ? $currentVat->vat_percentage : 0;

        $fuelSuppliers = Supplier::where('type', 'fuel')
            ->orderBy('name')
            ->select('id as value', 'name as label')
            ->get();

        $lubricantSuppliers = Supplier::where('type', 'lubricant')
            ->orderBy('name')
            ->select('id as value', 'name as label')
            ->get();

        $lubricantTypes = LubricantType::select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn($type) => [
                'value' => (string) $type->id,
                'label' => $type->name,
            ]);

        return Inertia::render('Purchase', [
            'fuelCategories' => $fuelCategories->map(fn($c) => [
                'value' => (string) $c->id,
                'label' => $c->name,
            ])->values(),
            'fuelSuppliers' => $fuelSuppliers,
            'lubricantSuppliers' => $lubricantSuppliers,
            'lubricantTypes' => $lubricantTypes,
            'currentVat' => [
                'percentage' => $vatPercentage,
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
     * Store a new fuel purchase record.
     */
    public function store(Request $request)
    {
        $request->validate([
            'supplier_id'     => 'required|integer|exists:supplier,id',
            'tax_invoice_no'  => 'nullable|string|max:100',
            'date'            => 'required|date',
            'fuel_category_id'=> 'required|integer|exists:fuel_category,id',
            'fuel_type_id'    => 'required|integer|exists:fuel_type,id',
            'volume'          => 'required|numeric|min:0',
            'unit_price'      => 'required|numeric|min:0',
            'amount'          => 'required|numeric|min:0',
            'discount'        => 'nullable|numeric|min:0',
            'eva_allowance'   => 'nullable|numeric|min:0',
            'invoice_amount'  => 'required|numeric|min:0',
            'vat_percentage'  => 'required|numeric|min:0',
            'vat_amount'      => 'required|numeric|min:0',
            'net_amount'      => 'required|numeric|min:0',
        ]);

        $purchase = Purchase::create([
            'supplier_id'      => $request->supplier_id,
            'tax_invoice_no'   => $request->tax_invoice_no,
            'date'             => $request->date,
            'fuel_category_id' => $request->fuel_category_id,
            'fuel_type_id'     => $request->fuel_type_id,
            'volume'           => $request->volume,
            'unit_price'       => $request->unit_price,
            'amount'           => $request->amount,
            'discount'         => $request->discount ?? 0,
            'eva_allowance'    => $request->eva_allowance ?? 0,
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

    /**
     * Store a new lubricant purchase record with multiple line items.
     */
    public function storeLubricantPurchase(Request $request)
    {
        $request->validate([
            'supplier_id'    => 'required|integer|exists:supplier,id',
            'tax_invoice_no' => 'nullable|string|max:100',
            'date'           => 'required|date',
            'vat_percentage' => 'required|numeric|min:0',
            'vat_amount'     => 'required|numeric|min:0',
            'total_amount'   => 'required|numeric|min:0',
            'items'          => 'required|array|min:1',
            'items.*.lubricant_type_id' => 'required|integer|exists:lubricant_type,id',
            'items.*.quantity'          => 'required|numeric|min:0.001',
            'items.*.unit_price'        => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            $vatPercentage = $request->vat_percentage;

            // Recompute the net amount server-side from items for integrity.
            // VAT amount and total are user-adjustable, so they are trusted from the request.
            $netAmount = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $lubricantType = LubricantType::find($item['lubricant_type_id']);
                $amount = round($item['quantity'] * $item['unit_price'], 2);
                $netAmount += $amount;

                $itemsData[] = [
                    'lubricant_type_id'   => $item['lubricant_type_id'],
                    'lubricant_type_name' => $lubricantType->name ?? '',
                    'quantity'            => $item['quantity'],
                    'unit_price'          => $item['unit_price'],
                    'amount'              => $amount,
                ];
            }

            $netAmount = round($netAmount, 2);
            $vatAmount = round($request->vat_amount, 2);
            $totalAmount = round($request->total_amount, 2);

            $lubricantPurchase = LubricantPurchase::create([
                'supplier_id'    => $request->supplier_id,
                'tax_invoice_no' => $request->tax_invoice_no,
                'date'           => $request->date,
                'net_amount'     => $netAmount,
                'vat_percentage' => $vatPercentage,
                'vat_amount'     => $vatAmount,
                'total_amount'   => $totalAmount,
            ]);

            foreach ($itemsData as $itemData) {
                $itemData['lubricant_purchase_id'] = $lubricantPurchase->id;
                LubricantPurchaseItem::create($itemData);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lubricant purchase record saved successfully',
                'lubricantPurchase' => $lubricantPurchase->load('items'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to save lubricant purchase: ' . $e->getMessage(),
            ], 500);
        }
    }
}
