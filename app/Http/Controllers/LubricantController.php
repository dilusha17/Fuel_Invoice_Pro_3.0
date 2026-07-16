<?php

namespace App\Http\Controllers;

use App\Models\LubricantType;
use App\Models\Vat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LubricantController extends Controller
{
    public function getLubricantTypes()
    {
        $latestVat = Vat::whereNull('to_date')->orderBy('from_date', 'desc')->first();
        $vatPercentage = $latestVat ? $latestVat->vat_percentage : 0;

        $lubricantTypes = LubricantType::select('id', 'name', 'price')
            ->orderBy('name')
            ->get()
            ->map(function ($type) use ($vatPercentage) {
                $netPrice = $type->price / (1 + ($vatPercentage / 100));
                $vatAmount = $type->price - $netPrice;

                return [
                    'id' => $type->id,
                    'name' => $type->name,
                    'price' => $type->price,
                    'netPrice' => $netPrice,
                    'vatAmount' => $vatAmount,
                ];
            });

        return response()->json($lubricantTypes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'from_date' => 'sometimes|date',
        ]);

        DB::beginTransaction();

        try {
            $latestVat = Vat::whereNull('to_date')->orderBy('from_date', 'desc')->first();
            $vatPercentage = $latestVat ? $latestVat->vat_percentage : 0;

            $lubricantType = LubricantType::create([
                'fuel_category_id' => 3,
                'name' => $request->name,
                'price' => $request->price,
            ]);

            $fromDate = $request->input('from_date', now()->format('Y-m-d'));

            DB::table('lubricant_price_history')->insert([
                'lubricant_type_id' => $lubricantType->id,
                'price' => $request->price,
                'vat_percentage' => $vatPercentage,
                'from_date' => $fromDate,
                'to_date' => null,
            ]);

            $netPrice = $lubricantType->price / (1 + ($vatPercentage / 100));
            $vatAmount = $lubricantType->price - $netPrice;

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lubricant type created successfully',
                'lubricantType' => [
                    'id' => $lubricantType->id,
                    'name' => $lubricantType->name,
                    'price' => $lubricantType->price,
                    'netPrice' => $netPrice,
                    'vatAmount' => $vatAmount,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating lubricant type: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $lubricantType = LubricantType::findOrFail($id);
        $lubricantType->update(['name' => $request->name]);

        $latestVat = Vat::whereNull('to_date')->orderBy('from_date', 'desc')->first();
        $vatPercentage = $latestVat ? $latestVat->vat_percentage : 0;
        $netPrice = $lubricantType->price / (1 + ($vatPercentage / 100));
        $vatAmount = $lubricantType->price - $netPrice;

        return response()->json([
            'success' => true,
            'message' => 'Lubricant type updated successfully',
            'lubricantType' => [
                'id' => $lubricantType->id,
                'name' => $lubricantType->name,
                'price' => $lubricantType->price,
                'netPrice' => $netPrice,
                'vatAmount' => $vatAmount,
            ],
        ]);
    }

    public function destroy($id)
    {
        $lubricantType = LubricantType::findOrFail($id);
        $lubricantType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lubricant type deleted successfully',
        ]);
    }

    public function getPrice($lubricant_type_id, Request $request)
    {
        $lubricantType = LubricantType::find($lubricant_type_id);

        if (!$lubricantType) {
            return response()->json(['error' => 'Lubricant type not found'], 404);
        }

        $invoiceDate = $request->input('invoice_date', now()->format('Y-m-d'));

        $priceHistory = DB::table('lubricant_price_history')
            ->where('lubricant_type_id', $lubricant_type_id)
            ->where('from_date', '<=', $invoiceDate)
            ->where(function ($query) use ($invoiceDate) {
                $query->whereNull('to_date')
                    ->orWhere('to_date', '>=', $invoiceDate);
            })
            ->orderBy('from_date', 'desc')
            ->first();

        if (!$priceHistory) {
            return response()->json([
                'error' => 'No price configured for this lubricant type and date',
            ], 404);
        }

        return response()->json([
            'price' => $priceHistory->price,
        ]);
    }

    public function updatePrice(Request $request)
    {
        $request->validate([
            'lubricant_type_id' => 'required|exists:lubricant_type,id',
            'price' => 'required|numeric|min:0',
            'from_date' => 'required|date',
        ]);

        DB::beginTransaction();

        try {
            $lubricantTypeId = $request->lubricant_type_id;
            $price = $request->price;
            $fromDate = $request->from_date;

            $latestVat = Vat::whereNull('to_date')->orderBy('from_date', 'desc')->first();
            $vatPercentage = $latestVat ? $latestVat->vat_percentage : 0;

            // Check duplicate on same date
            $existingOnSameDate = DB::table('lubricant_price_history')
                ->where('lubricant_type_id', $lubricantTypeId)
                ->where('from_date', $fromDate)
                ->first();

            if ($existingOnSameDate) {
                DB::rollBack();
                $lubricantType = LubricantType::find($lubricantTypeId);
                $netPrice = $lubricantType->price / (1 + ($vatPercentage / 100));
                $vatAmount = $lubricantType->price - $netPrice;

                return response()->json([
                    'success' => $existingOnSameDate->price == $price,
                    'message' => $existingOnSameDate->price == $price
                        ? 'No changes needed - Price already set to this value for this date'
                        : 'Price already exists for this lubricant type & effective date with a different price',
                    'lubricantType' => [
                        'id' => $lubricantType->id,
                        'name' => $lubricantType->name,
                        'price' => $lubricantType->price,
                        'netPrice' => $netPrice,
                        'vatAmount' => $vatAmount,
                    ],
                ], $existingOnSameDate->price == $price ? 200 : 422);
            }

            // Search for closest future from_date
            $futureRecord = DB::table('lubricant_price_history')
                ->where('lubricant_type_id', $lubricantTypeId)
                ->where('from_date', '>', $fromDate)
                ->orderBy('from_date', 'asc')
                ->first();

            // Search for closest past from_date
            $pastRecord = DB::table('lubricant_price_history')
                ->where('lubricant_type_id', $lubricantTypeId)
                ->where('from_date', '<', $fromDate)
                ->orderBy('from_date', 'desc')
                ->first();

            if (!$futureRecord) {
                // No future dates: this is the newest price
                // Update past closest record's to_date to effective date - 1
                if ($pastRecord) {
                    DB::table('lubricant_price_history')
                        ->where('id', $pastRecord->id)
                        ->update(['to_date' => date('Y-m-d', strtotime($fromDate . ' -1 day'))]);
                }

                // Insert new record as active (to_date = NULL)
                DB::table('lubricant_price_history')->insert([
                    'lubricant_type_id' => $lubricantTypeId,
                    'price' => $price,
                    'vat_percentage' => $vatPercentage,
                    'from_date' => $fromDate,
                    'to_date' => null,
                ]);

                // Update lubricant_type current price
                $lubricantType = LubricantType::find($lubricantTypeId);
                $lubricantType->price = $price;
                $lubricantType->save();
            } else {
                // Has future dates
                // Update past closest record's to_date if exists
                if ($pastRecord) {
                    DB::table('lubricant_price_history')
                        ->where('id', $pastRecord->id)
                        ->update(['to_date' => date('Y-m-d', strtotime($fromDate . ' -1 day'))]);
                }

                // Insert new record with to_date = closest future from_date - 1
                DB::table('lubricant_price_history')->insert([
                    'lubricant_type_id' => $lubricantTypeId,
                    'price' => $price,
                    'vat_percentage' => $vatPercentage,
                    'from_date' => $fromDate,
                    'to_date' => date('Y-m-d', strtotime($futureRecord->from_date . ' -1 day')),
                ]);

                $lubricantType = LubricantType::find($lubricantTypeId);
            }

            $netPrice = $lubricantType->price / (1 + ($vatPercentage / 100));
            $vatAmount = $lubricantType->price - $netPrice;

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lubricant price updated successfully',
                'lubricantType' => [
                    'id' => $lubricantType->id,
                    'name' => $lubricantType->name,
                    'price' => $lubricantType->price,
                    'netPrice' => $netPrice,
                    'vatAmount' => $vatAmount,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating lubricant price: ' . $e->getMessage(),
            ], 500);
        }
    }
}
