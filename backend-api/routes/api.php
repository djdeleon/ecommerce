<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FulfillmentHubController;
use App\Http\Controllers\Api\InventoryStockController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\VariantController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Middleware\SetPostgreUserContext;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->name('register');
    Route::post('login', [AuthController::class, 'login'])->name('login');

    Route::post('vendor/register', [VendorController::class, 'register'])->name('vendor.register');
    
    Route::get('fulfillment-hub', [FulfillmentHubController::class, 'index'])->name('fulfillment-hubs.index');
});

Route::middleware(['auth:sanctum', SetPostgreUserContext::class])->group(function () {
    Route::middleware('role:admin')->group(function () {
        Route::get('admin/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');

        Route::prefix('category')->controller(CategoryController::class)->group(function () {
            Route::get('', 'index')->name('category.index');
            Route::post('', 'store')->name('category.store');
            Route::get('{category}', 'show')->name('category.show');
            Route::patch('{category}', 'update')->name('category.update');
            Route::delete('{category}', 'destroy')->name('category.destroy');
        });

        Route::post('fulfillment-hub', [FulfillmentHubController::class, 'store'])->name('fulfillment-hubs.store');
    });

    Route::middleware('role:customer')->group(function () {
        Route::get('customer/dashboard', [CustomerController::class, 'dashboard'])->name('customer.dashboard');

        Route::post('customer/vendors', [CustomerController::class, 'upgrade'])->name('customer.vendor-upgrade');
    });

    Route::middleware('role:vendor')->group(function () {
        Route::get('vendor/dashboard', [VendorController::class, 'dashboard'])->name('vendor.dashboard');

        Route::prefix('products')->controller(ProductController::class)->group(function () {
            Route::post('', 'store')->name('products.store');
            Route::put('{product}', 'update')->name('products.update');

            Route::post('{product}/variants', [VariantController::class, 'store'])->name('variants.store');
            Route::put('{product}/variants/{variant}', [VariantController::class, 'update'])->name('variants.update');
        });

        Route::post('{vendor}/warehouses', [WarehouseController::class, 'store'])->name('warehouses.store');

        Route::post('vendor/product-variant/{variant}/stock', [InventoryStockController::class, 'store'])->name('inventory-stocks.store');
    });

    Route::middleware('role:driver')->group(function () {
        Route::get('driver/dashboard', [DriverController::class, 'dashboard'])->name('driver.dashboard');
    });
});