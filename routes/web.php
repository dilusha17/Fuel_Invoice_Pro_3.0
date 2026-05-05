<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Http\Controllers\DailyInvoiceController;
use App\Http\Controllers\ManageInvoiceController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\MonthlySaleController;
use App\Http\Controllers\PurchaseSummaryController;
use App\Http\Controllers\VatBalanceController;
use App\Http\Controllers\ClientDetailsController;
use App\Http\Controllers\TaxInvoiceController;
use App\Http\Controllers\TaxInvoiceHistoryController;
use App\Http\Controllers\InvoiceSummaryController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\PurchaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Authentication Routes
Route::get('/login', fn () => Inertia::render('Login'))->name('login');
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'name' => ['required', 'string'],
        'password' => ['required', 'string'],
    ]);

    // Find the user first
    $user = \App\Models\User::where('name', $credentials['name'])->first();

    // Check if user exists
    if (!$user) {
        return back()->withErrors([
            'name' => 'Invalid User Name',
        ])->onlyInput('name');
    }

    // Check if account has expired
    if ($user->expired_at && now()->isAfter($user->expired_at)) {
        return back()->withErrors([
            'name' => 'Your User Account has expired. Please contact the support team',
        ])->onlyInput('name');
    }

    // Check if remember token is expired (if exists)
    if ($user->remember_token && $user->remember_token_expires_at) {
        if (now()->isAfter($user->remember_token_expires_at)) {
            // Clear expired remember token
            $user->update([
                'remember_token' => null,
                'remember_token_expires_at' => null,
            ]);
        }
    }

    // Verify password
    if (!\Illuminate\Support\Facades\Hash::check($credentials['password'], $user->password)) {
        return back()->withErrors([
            'password' => 'Password is Incorrect',
        ])->onlyInput('name');
    }

    // Login the user
    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    // If remember me is checked, set token expiration to 7 days
    if ($request->boolean('remember')) {
        $user->update([
            'remember_token_expires_at' => now()->addDays(7),
        ]);
    }

    return redirect()->intended(route('dashboard'));
})->name('login.store');

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect()->route('login');
})->name('logout');

// Main Application Routes (Protected by auth middleware)
Route::middleware(['auth'])->group(function () {
    Route::get('/', [DailyInvoiceController::class, 'index'])->name('home');
    Route::get('/dashboard', [DailyInvoiceController::class, 'index'])->name('dashboard');
    Route::get('/manage', [ManageInvoiceController::class, 'index'])->name('manage');
    Route::get('/tax-invoice', [TaxInvoiceController::class, 'index'])->name('tax-invoice');
    Route::get('/invoice-summary', [InvoiceSummaryController::class, 'index'])->name('invoice-summary');
    Route::get('/history', [TaxInvoiceHistoryController::class, 'index'])->name('history');
    Route::get('/monthly-sale', [MonthlySaleController::class, 'index'])->name('monthly-sale');
    Route::get('/purchase-summary', [PurchaseSummaryController::class, 'index'])->name('purchase-summary');
    Route::get('/vat-balance', [VatBalanceController::class, 'index'])->name('vat-balance');
    Route::get('/clients', [ClientDetailsController::class, 'index'])->name('clients');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    Route::get('/purchase', [PurchaseController::class, 'index'])->name('purchase');
});

// API Routes (Protected by auth middleware)
Route::middleware(['auth'])->group(function () {
    // API Routes for Invoice Form
    Route::prefix('api/invoice')->group(function () {
        Route::get('/vehicles/{client_id}', [DailyInvoiceController::class, 'getVehiclesByClient'])->name('api.vehicles');
        Route::get('/fuel-types/{vehicle_id}', [DailyInvoiceController::class, 'getFuelTypesByVehicle'])->name('api.fuel-types');
        Route::get('/fuel-price/{fuel_type_id}', [DailyInvoiceController::class, 'getFuelTypePrice'])->name('api.fuel-price');
        Route::get('/vat', [DailyInvoiceController::class, 'getCurrentVat'])->name('api.vat');
        Route::post('/store', [DailyInvoiceController::class, 'storeInvoice'])->name('api.invoice.store');
        Route::get('/list', [ManageInvoiceController::class, 'getInvoices'])->name('api.invoice.list');
        Route::get('/details/{id}', [ManageInvoiceController::class, 'getInvoiceDetails'])->name('api.invoice.details');
        Route::put('/update/{id}', [ManageInvoiceController::class, 'updateInvoice'])->name('api.invoice.update');
        Route::delete('/delete/{id}', [ManageInvoiceController::class, 'deleteInvoice'])->name('api.invoice.delete');
        Route::get('/deleted-list', [ManageInvoiceController::class, 'getDeletedInvoices'])->name('api.invoice.deleted-list');
        Route::post('/recover/{id}', [ManageInvoiceController::class, 'recoverInvoice'])->name('api.invoice.recover');

        // Backward compatibility - redirect to TaxInvoiceController
        Route::post('/tax-records', [TaxInvoiceController::class, 'getTaxInvoiceRecords'])->name('api.invoice.tax-records');
        Route::get('/next-tax-invoice-number/{client_id}', [TaxInvoiceController::class, 'getNextTaxInvoiceNumber'])->name('api.invoice.next-tax-number');
        Route::get('/payment-methods', [TaxInvoiceController::class, 'getPaymentMethods'])->name('api.invoice.payment-methods');
        Route::post('/generate-tax-invoice-pdf', [TaxInvoiceController::class, 'generateTaxInvoicePDF'])->name('api.invoice.generate-tax-pdf');
    });

    // API Routes for Settings
    Route::prefix('api/settings')->group(function () {
        Route::post('/update-vat', [SettingsController::class, 'updateVat'])->name('api.settings.update-vat');
        Route::post('/update-fuel-price', [SettingsController::class, 'updateFuelPrice'])->name('api.settings.update-fuel-price');
        Route::post('/update-company', [SettingsController::class, 'updateCompany'])->name('api.settings.update-company');
    });

    // API Routes for Purchase
    Route::prefix('api/purchase')->group(function () {
        Route::get('/fuel-types/{category_id}', [PurchaseController::class, 'getFuelTypesByCategory'])->name('api.purchase.fuel-types');
        Route::get('/fuel-price/{fuel_type_id}', [PurchaseController::class, 'getFuelPrice'])->name('api.purchase.fuel-price');
        Route::post('/store', [PurchaseController::class, 'store'])->name('api.purchase.store');
    });

    // API Routes for Invoice History (backward compatibility)
    Route::prefix('api/history')->group(function () {
        Route::post('/tax-invoices', [TaxInvoiceHistoryController::class, 'getTaxInvoices'])->name('api.history.tax-invoices');
        Route::post('/tax-invoice-records', [TaxInvoiceHistoryController::class, 'getTaxInvoiceRecords'])->name('api.history.tax-invoice-records');
        Route::post('/generate-tax-invoice-pdf', [TaxInvoiceHistoryController::class, 'generateTaxInvoicePDF'])->name('api.history.generate-tax-invoice-pdf');
    });

    // API Routes for Tax Invoice (New dedicated routes)
    Route::prefix('api/tax-invoice')->group(function () {
        // For creating new tax invoices
        Route::post('/records', [TaxInvoiceController::class, 'getTaxInvoiceRecords'])->name('api.tax-invoice.records');
        Route::get('/next-number/{client_id}', [TaxInvoiceController::class, 'getNextTaxInvoiceNumber'])->name('api.tax-invoice.next-number');
        Route::post('/generate-pdf', [TaxInvoiceController::class, 'generateTaxInvoicePDF'])->name('api.tax-invoice.generate-pdf');
    });

    // API Routes for Tax Invoice History
    Route::prefix('api/tax-invoice-history')->group(function () {
        Route::post('/list', [TaxInvoiceHistoryController::class, 'getTaxInvoices'])->name('api.tax-invoice-history.list');
        Route::post('/records', [TaxInvoiceHistoryController::class, 'getTaxInvoiceRecords'])->name('api.tax-invoice-history.records');
        Route::post('/generate-pdf', [TaxInvoiceHistoryController::class, 'generateTaxInvoicePDF'])->name('api.tax-invoice-history.generate-pdf');
        Route::post('/check-last', [TaxInvoiceHistoryController::class, 'checkIsLastInvoice'])->name('api.tax-invoice-history.check-last');
        Route::delete('/delete', [TaxInvoiceHistoryController::class, 'deleteTaxInvoice'])->name('api.tax-invoice-history.delete');
        Route::get('/deleted', [TaxInvoiceHistoryController::class, 'getDeletedTaxInvoices'])->name('api.tax-invoice-history.deleted');
    });

    // API Routes for Invoice Summary
    Route::prefix('api/invoice-summary')->group(function () {
        Route::get('/search', [InvoiceSummaryController::class, 'search'])->name('api.invoice-summary.search');
        Route::get('/export-csv', [InvoiceSummaryController::class, 'exportCsv'])->name('api.invoice-summary.export-csv');
    });

    // API Routes for Monthly Sale
    Route::prefix('api/monthly-sale')->group(function () {
        Route::post('/store', [MonthlySaleController::class, 'store'])->name('api.monthly-sale.store');
        Route::post('/show', [MonthlySaleController::class, 'show'])->name('api.monthly-sale.show');
        Route::post('/generate-pdf', [MonthlySaleController::class, 'generatePDF'])->name('api.monthly-sale.generate-pdf');
    });

    // Direct PDF view route for Monthly Sale
    Route::get('/monthly-sale/pdf/{year}/{month}', [MonthlySaleController::class, 'viewPDF'])->name('monthly-sale.view-pdf');

    // API Routes for Purchase Summary
    Route::prefix('api/purchase-summary')->group(function () {
        Route::get('/search', [PurchaseSummaryController::class, 'search'])->name('api.purchase-summary.search');
        Route::get('/export-csv', [PurchaseSummaryController::class, 'exportCsv'])->name('api.purchase-summary.export-csv');
    });

    // API Routes for VAT Balance
    Route::prefix('api/vat-balance')->group(function () {
        Route::post('/generate', [VatBalanceController::class, 'generate'])->name('api.vat-balance.generate');
        Route::post('/print', [VatBalanceController::class, 'print'])->name('api.vat-balance.print');
    });

    // API Routes for Client Details
    Route::prefix('api/clients')->group(function () {
        Route::post('/vehicles', [ClientDetailsController::class, 'getVehicles'])->name('api.clients.vehicles');
        Route::post('/store-client', [ClientDetailsController::class, 'storeClient'])->name('api.clients.store-client');
        Route::post('/store-vehicle', [ClientDetailsController::class, 'storeVehicle'])->name('api.clients.store-vehicle');
        Route::put('/update-client/{id}', [ClientDetailsController::class, 'updateClient'])->name('api.clients.update-client');
        Route::put('/update-vehicle/{id}', [ClientDetailsController::class, 'updateVehicle'])->name('api.clients.update-vehicle');
        Route::delete('/delete-client/{id}', [ClientDetailsController::class, 'deleteClient'])->name('api.clients.delete-client');
        Route::delete('/delete-vehicle/{id}', [ClientDetailsController::class, 'deleteVehicle'])->name('api.clients.delete-vehicle');
    });
});

// Admin Routes (Protected by admin middleware)
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    // Web routes (Inertia pages)
    Route::get('/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::get('/users/create', [UserController::class, 'create'])->name('admin.users.create');
    Route::post('/users', [UserController::class, 'store'])->name('admin.users.store');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('admin.users.edit');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');

    // API routes for AJAX requests
    Route::get('/api/users', [UserController::class, 'getUsers'])->name('admin.api.users.list');
});

// Test route for debugging vehicles
Route::get('/test-vehicles/{client_id}', function($client_id) {
    $vehicles = DB::table('vehicle')
        ->join('fuel_category', 'vehicle.fuel_category_id', '=', 'fuel_category.id')
        ->where('vehicle.client_id', $client_id)
        ->whereNull('vehicle.deleted_at')
        ->select(
            'vehicle.id as id',
            'vehicle.client_id as clientId',
            'vehicle.vehicle_no as vehicleNo',
            'vehicle.type',
            'fuel_category.name as fuelCategory'
        )
        ->get();

    return response()->json([
        'client_id' => $client_id,
        'count' => $vehicles->count(),
        'vehicles' => $vehicles
    ]);
});

Route::fallback(fn () => Inertia::render('NotFound'));

