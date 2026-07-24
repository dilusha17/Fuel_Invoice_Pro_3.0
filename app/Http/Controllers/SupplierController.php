<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    /**
     * Display the suppliers page
     */
    public function index()
    {
        $suppliers = Supplier::orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'vatNo' => $s->vat_no,
                'type' => $s->type,
            ]);

        return Inertia::render('Suppliers', [
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Get suppliers filtered by type, for dropdown selection
     */
    public function getSuppliersByType(Request $request)
    {
        $request->validate([
            'type' => 'required|in:fuel,lubricant',
        ]);

        $suppliers = Supplier::where('type', $request->type)
            ->orderBy('name')
            ->select('id as value', 'name as label', 'vat_no as vatNo')
            ->get();

        return response()->json([
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Store a new supplier
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'vat_no' => 'nullable|string|max:45',
            'type' => 'required|in:fuel,lubricant',
        ]);

        $existing = Supplier::where('name', $request->name)
            ->where('type', $request->type)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A supplier with this name and type already exists.',
            ], 422);
        }

        $supplier = Supplier::create([
            'name' => $request->name,
            'vat_no' => $request->vat_no,
            'type' => $request->type,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Supplier created successfully',
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'vatNo' => $supplier->vat_no,
                'type' => $supplier->type,
            ],
        ]);
    }

    /**
     * Update a supplier
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'vat_no' => 'nullable|string|max:45',
            'type' => 'required|in:fuel,lubricant',
        ]);

        $supplier = Supplier::findOrFail($id);

        $existing = Supplier::where('name', $request->name)
            ->where('type', $request->type)
            ->where('id', '!=', $id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A supplier with this name and type already exists.',
            ], 422);
        }

        $supplier->update([
            'name' => $request->name,
            'vat_no' => $request->vat_no,
            'type' => $request->type,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Supplier updated successfully',
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'vatNo' => $supplier->vat_no,
                'type' => $supplier->type,
            ],
        ]);
    }

    /**
     * Delete a supplier (soft delete)
     */
    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Supplier deleted successfully',
        ]);
    }
}
