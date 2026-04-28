<?php

namespace App\Http\Controllers;

use App\Models\Settings;
use App\Models\Vat;
use App\Models\FuelType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display the settings page
     */
    public function index()
    {
        // Get company details from settings table
        $settings = Settings::first();

        // Get latest VAT record
        $latestVat = Vat::orderBy('id', 'desc')->first();

        // Get all fuel types with prices
        $fuelTypes = FuelType::select('id', 'name', 'price')
            ->get()
            ->map(function ($fuelType) use ($latestVat) {
                $vatPercentage = $latestVat ? $latestVat->vat_percentage : 0;
                $netPrice = $fuelType->price / (1 + ($vatPercentage / 100));
                $vatAmount = $fuelType->price - $netPrice;

                return [
                    'id' => $fuelType->id,
                    'name' => $fuelType->name,
                    'price' => $fuelType->price,
                    'netPrice' => $netPrice,
                    'vatAmount' => $vatAmount,
                ];
            });

        return Inertia::render('Settings', [
            'companyDetails' => [
                'name' => $settings->company_name ?? '',
                'address' => $settings->company_address ?? '',
                'contact' => $settings->company_contact ?? '',
                'vatNo' => $settings->company_vat_no ?? '',
                'place_of_supply' => $settings->place_of_supply ?? '',
                'supplierName' => $settings->supplier_name ?? '',
            ],
            'currentVat' => [
                'percentage' => $latestVat ? $latestVat->vat_percentage : 0,
                'fromDate' => $latestVat ? $latestVat->from_date->format('Y-m-d') : null,
                'toDate' => $latestVat && $latestVat->to_date ? $latestVat->to_date->format('Y-m-d') : null,
            ],
            'fuelTypes' => $fuelTypes,
        ]);
    }

    /**
     * Update VAT percentage
     */
    public function updateVat(Request $request)
    {
        $request->validate([
            'vat_percentage' => 'required|numeric|min:0|max:100',
            'from_date' => 'required|date',
        ]);

        DB::beginTransaction();

        try {
            $vatPercentage = $request->vat_percentage;
            $fromDate = $request->from_date;

            // Check if there's already a record with the same from_date
            $existingOnSameDate = Vat::where('from_date', $fromDate)->first();

            if ($existingOnSameDate) {
                if ($existingOnSameDate->vat_percentage == $vatPercentage) {
                    DB::rollBack();
                    return response()->json([
                        'success' => true,
                        'message' => 'No changes needed - VAT already set to this value for this date',
                        'vat' => [
                            'percentage' => $existingOnSameDate->vat_percentage,
                            'fromDate' => $existingOnSameDate->from_date,
                            'toDate' => $existingOnSameDate->to_date,
                        ],
                    ]);
                } else {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'VAT already exists for this effective date with a different percentage',
                    ], 422);
                }
            }

            // Find the latest VAT record where from_date <= new from_date (to check for redundant updates)
            $latestVat = Vat::where('from_date', '<=', $fromDate)
                ->orderBy('from_date', 'desc')
                ->first();

            if ($latestVat && $latestVat->vat_percentage == $vatPercentage) {
                DB::rollBack();
                return response()->json([
                    'success' => true,
                    'message' => 'No changes needed - VAT already set to this value',
                    'vat' => [
                        'percentage' => $latestVat->vat_percentage,
                        'fromDate' => $latestVat->from_date,
                        'toDate' => $latestVat->to_date,
                    ],
                ]);
            }

            // Validate that new from_date is not earlier than the active record's from_date
            // (unless we're replacing it with a different value)
            $activeVat = Vat::whereNull('to_date')->first();
            if ($activeVat && $fromDate < $activeVat->from_date->format('Y-m-d')) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot set an effective date earlier than the current active period',
                ], 422);
            }

            // Close the current active record (set its to_date)
            $currentActive = Vat::whereNull('to_date')->first();
            if ($currentActive) {
                $currentActive->to_date = date('Y-m-d', strtotime($fromDate . ' -1 day'));
                $currentActive->save();
            }

            // Insert new record with to_date = NULL
            $vat = Vat::create([
                'vat_percentage' => $vatPercentage,
                'from_date' => $fromDate,
                'to_date' => null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'VAT percentage updated successfully',
                'vat' => [
                    'percentage' => $vat->vat_percentage,
                    'fromDate' => $vat->from_date,
                    'toDate' => $vat->to_date,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating VAT: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update fuel price
     */
    public function updateFuelPrice(Request $request)
    {
        $request->validate([
            'fuel_type_id' => 'required|exists:fuel_type,id',
            'price' => 'required|numeric|min:0',
            'from_date' => 'required|date',
        ]);

        DB::beginTransaction();

        try {
            $fuelTypeId = $request->fuel_type_id;
            $fuelPrice = $request->price;
            $fromDate = $request->from_date;

            // Get latest VAT record
            $latestVat = Vat::whereNull('to_date')->orderBy('from_date', 'desc')->first();
            $vatPercentage = $latestVat ? $latestVat->vat_percentage : 0;

            // Check if there's already a record with the same fuel_type_id and from_date
            $existingOnSameDate = DB::table('fuel_price_history')
                ->where('fuel_type_id', $fuelTypeId)
                ->where('from_date', $fromDate)
                ->first();

            if ($existingOnSameDate) {
                if ($existingOnSameDate->fuel_price == $fuelPrice) {
                    DB::rollBack();

                    $fuelType = FuelType::find($fuelTypeId);
                    $netPrice = $fuelType->price / (1 + ($vatPercentage / 100));
                    $vatAmount = $fuelType->price - $netPrice;

                    return response()->json([
                        'success' => true,
                        'message' => 'No changes needed - Fuel price already set to this value for this date',
                        'fuelType' => [
                            'id' => $fuelType->id,
                            'name' => $fuelType->name,
                            'price' => $fuelType->price,
                            'netPrice' => $netPrice,
                            'vatAmount' => $vatAmount,
                        ],
                    ]);
                } else {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Fuel price already exists for this fuel type & effective date with a different price',
                    ], 422);
                }
            }

            // Find the latest fuel price record for this fuel_type_id where from_date <= new from_date
            $latestFuelPrice = DB::table('fuel_price_history')
                ->where('fuel_type_id', $fuelTypeId)
                ->where('from_date', '<=', $fromDate)
                ->orderBy('from_date', 'desc')
                ->first();

            if ($latestFuelPrice && $latestFuelPrice->fuel_price == $fuelPrice) {
                DB::rollBack();

                $fuelType = FuelType::find($fuelTypeId);
                $netPrice = $fuelType->price / (1 + ($vatPercentage / 100));
                $vatAmount = $fuelType->price - $netPrice;

                return response()->json([
                    'success' => true,
                    'message' => 'No changes needed - Fuel price already set to this value',
                    'fuelType' => [
                        'id' => $fuelType->id,
                        'name' => $fuelType->name,
                        'price' => $fuelType->price,
                        'netPrice' => $netPrice,
                        'vatAmount' => $vatAmount,
                    ],
                ]);
            }

            // Validate that new from_date is not earlier than the active record's from_date
            $activeFuelPrice = DB::table('fuel_price_history')
                ->where('fuel_type_id', $fuelTypeId)
                ->whereNull('to_date')
                ->first();

            if ($activeFuelPrice && $fromDate < $activeFuelPrice->from_date) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot set an effective date earlier than the current active period',
                ], 422);
            }

            // Close the previous active record for this fuel_type_id (set its to_date)
            DB::table('fuel_price_history')
                ->where('fuel_type_id', $fuelTypeId)
                ->whereNull('to_date')
                ->update(['to_date' => date('Y-m-d', strtotime($fromDate . ' -1 day'))]);

            // Insert new record with to_date = NULL
            DB::table('fuel_price_history')->insert([
                'fuel_type_id' => $fuelTypeId,
                'fuel_price' => $fuelPrice,
                'vat_percentage' => $vatPercentage,
                'from_date' => $fromDate,
                'to_date' => null,
            ]);

            // Update fuel type price
            $fuelType = FuelType::find($fuelTypeId);
            $fuelType->price = $fuelPrice;
            $fuelType->save();

            $netPrice = $fuelType->price / (1 + ($vatPercentage / 100));
            $vatAmount = $fuelType->price - $netPrice;

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Fuel price updated successfully',
                'fuelType' => [
                    'id' => $fuelType->id,
                    'name' => $fuelType->name,
                    'price' => $fuelType->price,
                    'netPrice' => $netPrice,
                    'vatAmount' => $vatAmount,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating fuel price: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update company details
     */
    public function updateCompany(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
            'company_address' => 'nullable|string',
            'company_contact' => 'nullable|string|max:45',
            'company_vat_no' => 'nullable|string|max:45',
            'place_of_supply' => 'nullable|string|max:255',
            'supplier_name' => 'nullable|string|max:255',
        ]);

        $settings = Settings::first();
        if (!$settings) {
            $settings = Settings::create($request->only([
                'company_name', 'company_address', 'company_contact',
                'company_vat_no', 'place_of_supply', 'supplier_name',
            ]));
        } else {
            $settings->update($request->only([
                'company_name', 'company_address', 'company_contact',
                'company_vat_no', 'place_of_supply', 'supplier_name',
            ]));
        }

        return response()->json([
            'success' => true,
            'message' => 'Company details updated successfully',
            'companyDetails' => [
                'name' => $settings->company_name,
                'address' => $settings->company_address,
                'contact' => $settings->company_contact,
                'vatNo' => $settings->company_vat_no,
                'place_of_supply' => $settings->place_of_supply,
                'supplierName' => $settings->supplier_name,
            ],
        ]);
    }
}
