<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Models\Client;
use App\Models\FuelCategory;

class ClientDetailsController extends Controller
{
    /**
     * Display the client details page
     */
    public function index()
    {
        // Fetch all active clients using cached method
        $client = Client::where(function($query) {
                $query->whereNull('deleted_at')
                      ->orWhere('deleted_at', '0000-00-00 00:00:00');
            })
            ->select(
                'id',
                'client_name as clientName',
                'c_name as companyName',
                'nick_name as nickName',
                'address',
                'contact_number as contact',
                'vat_no as vatNo'
            )
            ->get();

        // Fetch fuel categories
        $fuelCategories = FuelCategory::getAllCategories();

        return Inertia::render('ClientDetails', [
            'clients' => $client,
            'fuelCategories' => $fuelCategories,
        ]);
    }

    /**
     * Get vehicles for a specific client
     */
    public function getVehicles(Request $request)
    {
        $request->validate([
            'client_id' => 'required|integer',
        ]);

        Log::info('Fetching vehicles for client_id: ' . $request->client_id);

        $vehicles = DB::table('vehicle')
            ->join('fuel_category', 'vehicle.fuel_category_id', '=', 'fuel_category.id')
            ->where('vehicle.client_id', $request->client_id)
            ->whereNull('vehicle.deleted_at')
            ->select(
                'vehicle.id as id',
                'vehicle.client_id as clientId',
                'vehicle.vehicle_no as vehicleNo',
                'vehicle.type',
                'fuel_category.name as fuelCategory'
            )
            ->get();

        Log::info('Found ' . $vehicles->count() . ' vehicles');
        Log::info('Vehicles data: ' . json_encode($vehicles));

        return response()->json([
            'success' => true,
            'vehicles' => $vehicles,
            'count' => $vehicles->count(),
        ]);
    }

    /**
     * Store a new client
     */
    public function storeClient(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
            'c_name' => 'required|string|max:255',
            'nick_name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'contact_number' => 'required|string|max:20',
            'vat_no' => 'required|string|max:50',
        ]);

        try {
            // Check for duplicate client name
            $existingClientByName = DB::table('client')
                ->where('client_name', $request->client_name)
                ->first();

            if ($existingClientByName) {
                return response()->json([
                    'success' => false,
                    'message' => 'A client with this name already exists.',
                ], 422);
            }

            // Check for duplicate nick name
            $existingClientByNickName = DB::table('client')
                ->where('nick_name', $request->nick_name)
                ->first();

            if ($existingClientByNickName) {
                return response()->json([
                    'success' => false,
                    'message' => 'A client with this nick name already exists.',
                ], 422);
            }

            $clientId = DB::table('client')->insertGetId([
                'client_name' => $request->client_name,
                'c_name' => $request->c_name,
                'nick_name' => $request->nick_name,
                'address' => $request->address,
                'contact_number' => $request->contact_number,
                'vat_no' => $request->vat_no,
                'created_at' => now(),
            ]);

            $client = DB::table('client')
                ->where('id', $clientId)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Client created successfully.',
                'client' => [
                    'id' => $client->id,
                    'clientName' => $client->client_name,
                    'companyName' => $client->c_name,
                    'nickName' => $client->nick_name,
                    'address' => $client->address,
                    'contact' => $client->contact_number,
                    'vatNo' => $client->vat_no,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create client: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a new vehicle
     */
    public function storeVehicle(Request $request)
    {
        $request->validate([
            'client_id' => 'required|integer|exists:client,id',
            'vehicle_no' => 'required|string|max:15',
            'type' => 'required|string|max:50',
            'fuel_category_id' => 'required|integer|exists:fuel_category,id',
        ]);

        try {
            // Check for duplicate vehicle number
            $existingVehicle = DB::table('vehicle')
                ->where('vehicle_no', $request->vehicle_no)
                ->first();

            if ($existingVehicle) {
                return response()->json([
                    'success' => false,
                    'message' => 'A vehicle with this number already exists.',
                ], 422);
            }

            $vehicleId = DB::table('vehicle')->insertGetId([
                'client_id' => $request->client_id,
                'vehicle_no' => $request->vehicle_no,
                'type' => $request->type,
                'fuel_category_id' => $request->fuel_category_id,
                'created_at' => now(),
            ]);

            $vehicle = DB::table('vehicle')
                ->join('fuel_category', 'vehicle.fuel_category_id', '=', 'fuel_category.id')
                ->where('vehicle.id', $vehicleId)
                ->select(
                    'vehicle.id',
                    'vehicle.client_id',
                    'vehicle.vehicle_no',
                    'vehicle.type',
                    'fuel_category.name as fuel_category_name'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Vehicle created successfully.',
                'vehicle' => [
                    'id' => $vehicle->id,
                    'clientId' => $vehicle->client_id,
                    'vehicleNo' => $vehicle->vehicle_no,
                    'type' => $vehicle->type,
                    'fuelCategory' => $vehicle->fuel_category_name,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create vehicle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a client
     */
    public function updateClient(Request $request, $id)
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
            'c_name' => 'required|string|max:255',
            'nick_name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'contact_number' => 'required|string|max:20',
            'vat_no' => 'required|string|max:50',
        ]);

        try {
            // Check if client exists
            $client = DB::table('client')->where('id', $id)->first();
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found.',
                ], 404);
            }

            // Check for duplicate client name (excluding current client)
            $existingClientByName = DB::table('client')
                ->where('client_name', $request->client_name)
                ->where('id', '!=', $id)
                ->first();

            if ($existingClientByName) {
                return response()->json([
                    'success' => false,
                    'message' => 'A client with this name already exists.',
                ], 422);
            }

            // Check for duplicate nick name (excluding current client)
            $existingClientByNickName = DB::table('client')
                ->where('nick_name', $request->nick_name)
                ->where('id', '!=', $id)
                ->first();

            if ($existingClientByNickName) {
                return response()->json([
                    'success' => false,
                    'message' => 'A client with this nick name already exists.',
                ], 422);
            }

            DB::table('client')->where('id', $id)->update([
                'client_name' => $request->client_name,
                'c_name' => $request->c_name,
                'nick_name' => $request->nick_name,
                'address' => $request->address,
                'contact_number' => $request->contact_number,
                'vat_no' => $request->vat_no,
            ]);

            $client = DB::table('client')
                ->where('id', $id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Client updated successfully.',
                'client' => [
                    'id' => $client->id,
                    'clientName' => $client->client_name,
                    'companyName' => $client->c_name,
                    'nickName' => $client->nick_name,
                    'address' => $client->address,
                    'contact' => $client->contact_number,
                    'vatNo' => $client->vat_no,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update client: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a vehicle
     */
    public function updateVehicle(Request $request, $id)
    {
        $request->validate([
            'client_id' => 'required|integer|exists:client,id',
            'vehicle_no' => 'required|string|max:15',
            'type' => 'required|string|max:50',
            'fuel_category_id' => 'required|integer|exists:fuel_category,id',
        ]);

        try {
            // Check if vehicle exists
            $vehicle = DB::table('vehicle')->where('id', $id)->first();
            if (!$vehicle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vehicle not found.',
                ], 404);
            }

            // Check for duplicate vehicle number (excluding current vehicle)
            $existingVehicle = DB::table('vehicle')
                ->where('vehicle_no', $request->vehicle_no)
                ->where('id', '!=', $id)
                ->first();

            if ($existingVehicle) {
                return response()->json([
                    'success' => false,
                    'message' => 'A vehicle with this number already exists.',
                ], 422);
            }

            DB::table('vehicle')->where('id', $id)->update([
                'client_id' => $request->client_id,
                'vehicle_no' => $request->vehicle_no,
                'type' => $request->type,
                'fuel_category_id' => $request->fuel_category_id,
            ]);

            $vehicle = DB::table('vehicle')
                ->join('fuel_category', 'vehicle.fuel_category_id', '=', 'fuel_category.id')
                ->where('vehicle.id', $id)
                ->select(
                    'vehicle.id',
                    'vehicle.client_id',
                    'vehicle.vehicle_no',
                    'vehicle.type',
                    'fuel_category.name as fuel_category_name'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Vehicle updated successfully.',
                'vehicle' => [
                    'id' => $vehicle->id,
                    'clientId' => $vehicle->client_id,
                    'vehicleNo' => $vehicle->vehicle_no,
                    'type' => $vehicle->type,
                    'fuelCategory' => $vehicle->fuel_category_name,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update vehicle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a client (soft delete)
     */
    public function deleteClient($id)
    {
        try {
            DB::beginTransaction();

            $updated = DB::table('client')
                ->where('id', $id)
                ->update(['deleted_at' => now()]);

            DB::table('vehicle')
                ->where('client_id', $id)
                ->update(['deleted_at' => now()]);

            DB::commit();

            if ($updated) {
                return response()->json([
                    'success' => true,
                    'message' => 'Client deleted successfully',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found',
                ], 404);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete client: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a vehicle (soft delete)
     */
    public function deleteVehicle($id)
    {
        try {
            $updated = DB::table('vehicle')
                ->where('id', $id)
                ->update(['deleted_at' => now()]);

            if ($updated) {
                return response()->json([
                    'success' => true,
                    'message' => 'Vehicle deleted successfully',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Vehicle not found',
                ], 404);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete vehicle: ' . $e->getMessage(),
            ], 500);
        }
    }
}
