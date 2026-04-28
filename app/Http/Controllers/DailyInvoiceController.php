<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Vehicle;
use App\Models\FuelType;
use App\Models\Vat;
use App\Models\InvoiceDaily;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DailyInvoiceController extends Controller
{
    /**
     * Display the invoice form with initial data
     */
    public function index()
    {
        $clients = Client::getActiveClients();
        $vatPercentage = Vat::getCurrentVatPercentage();

        return Inertia::render('Index', [
            'clients' => $clients,
            'initialVatPercentage' => $vatPercentage,
        ]);
    }

    /**
     * Get vehicles for a specific client
     */
    public function getVehiclesByClient($client_id)
    {
        $vehicles = Vehicle::where('client_id', $client_id)
            ->whereNull('deleted_at')
            ->select('id as value', 'vehicle_no as label', 'fuel_category_id')
            ->get();

        return response()->json([
            'vehicles' => $vehicles
        ]);
    }

    /**
     * Get fuel types for a specific vehicle
     */
    public function getFuelTypesByVehicle($vehicle_id)
    {
        $vehicle = Vehicle::select('id', 'fuel_category_id')->find($vehicle_id);

        if (!$vehicle) {
            return response()->json(['error' => 'Vehicle not found'], 404);
        }

        $fuelTypes = FuelType::where('fuel_category_id', $vehicle->fuel_category_id)
            ->select('id as value', 'name as label', 'price')
            ->get()
            ->map(function ($fuelType) {
                $fuelType->price = $fuelType->price;
                return $fuelType;
            });

        return response()->json([
            'fuelTypes' => $fuelTypes,
            'fuelCategoryId' => $vehicle->fuel_category_id
        ]);
    }

    /**
     * Get price for a specific fuel type on a specific date
     */
    public function getFuelTypePrice($fuel_type_id, Request $request)
    {
        $fuelType = FuelType::where('id', $fuel_type_id)->first();

        if (!$fuelType) {
            return response()->json(['error' => 'Fuel type not found'], 404);
        }

        // Get invoice_date from request (defaults to today if not provided)
        $invoiceDate = $request->input('invoice_date', now()->format('Y-m-d'));

        // Find the fuel price applicable for the given date
        $fuelPriceHistory = DB::table('fuel_price_history')
            ->where('fuel_type_id', $fuel_type_id)
            ->where('from_date', '<=', $invoiceDate)
            ->where(function($query) use ($invoiceDate) {
                $query->whereNull('to_date')
                      ->orWhere('to_date', '>=', $invoiceDate);
            })
            ->orderBy('from_date', 'desc')
            ->first();

        if (!$fuelPriceHistory) {
            return response()->json([
                'error' => 'No fuel price configured for this fuel type and invoice date'
            ], 404);
        }

        return response()->json([
            'price' => $fuelPriceHistory->fuel_price
        ]);
    }

    /**
     * Get current VAT percentage for a specific date
     */
    public function getCurrentVat(Request $request)
    {
        // Get invoice_date from request (defaults to today if not provided)
        $invoiceDate = $request->input('invoice_date', now()->format('Y-m-d'));

        // Find the VAT applicable for the given date
        $vat = Vat::where('from_date', '<=', $invoiceDate)
            ->where(function($query) use ($invoiceDate) {
                $query->whereNull('to_date')
                      ->orWhere('to_date', '>=', $invoiceDate);
            })
            ->orderBy('from_date', 'desc')
            ->first();

        if (!$vat) {
            return response()->json([
                'error' => 'No VAT configured for this invoice date'
            ], 404);
        }

        return response()->json([
            'vatPercentage' => $vat->vat_percentage
        ]);
    }

    /**
     * Store a new daily invoice
     */
    public function storeInvoice(Request $request)
    {
        $request->validate([
            'serial_no' => 'required|string|max:15',
            'date_added' => 'required|date',
            'vehicle_id' => 'required|exists:vehicle,id',
            'fuel_type_id' => 'required|exists:fuel_type,id',
            'volume' => 'required|numeric|min:0',
            'fuel_net_price' => 'required|numeric|min:0',
            'sub_total' => 'required|numeric|min:0',
            'vat_percentage' => 'required|numeric|min:0',
            'vat_amount' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
        ]);

        $invoice = InvoiceDaily::create([
            'serial_no' => $request->serial_no,
            'date_added' => $request->date_added,
            'vehicle_id' => $request->vehicle_id,
            'fuel_type_id' => $request->fuel_type_id,
            'volume' => round($request->volume, 3),
            'fuel_net_price' => round($request->fuel_net_price, 2),
            'sub_total' => round($request->sub_total, 2),
            'vat_percentage' => round($request->vat_percentage, 2),
            'vat_amount' => round($request->vat_amount, 2),
            'Total' => round($request->total, 2),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invoice saved successfully',
            'invoice_id' => $invoice->id
        ], 201);
    }

}
