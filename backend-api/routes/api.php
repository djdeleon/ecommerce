<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CartItemController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\FulfillmentHubController;
use App\Http\Controllers\Api\InventoryStockController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PayPalWebhookController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VariantController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\XenditWebhookController;
use App\Http\Middleware\SetPostgreUserContext;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->name('register');
    Route::post('login', [AuthController::class, 'login'])->name('login');

    Route::post('vendor/register', [VendorController::class, 'register'])->name('vendor.register');
    Route::post('drivers/register', [DriverController::class, 'register'])->name('drivers.register');

    Route::post('customers/register', [CustomerController::class, 'register'])->name('customers.register');
    
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

        Route::post('users/vendors/upgrade', [UserController::class, 'upgrade'])->name('users.vendor-upgrade');

        Route::get('carts', [CartController::class, 'index'])->name('carts.index');
        Route::post('cart-items', [CartItemController::class, 'store'])->name('cart-items.store');

        Route::post('checkouts', [CheckoutController::class, 'store'])->name('checkouts.store');

        Route::post('orders/place', [OrderController::class, 'place'])->name('orders.place');
        
        Route::post('orders/stripe/place', [OrderController::class, 'stripePlace'])->name('orders.stripe-place');

        Route::post('orders/xendit/place', [OrderController::class, 'xenditPlace'])->name('orders.xendit-place');

        Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    });

    Route::middleware('role:admin|vendor')->group(function () {
        Route::get('warehouses', [WarehouseController::class, 'index'])->name('warehouses.index');
        Route::post('warehouses', [WarehouseController::class, 'store'])->name('warehouses.store');

        Route::get('inventory/stocks', [InventoryStockController::class, 'index'])->name('inventory-stocks.index');
    });

    Route::middleware('role:vendor')->group(function () {
        Route::get('vendor/dashboard', [VendorController::class, 'dashboard'])->name('vendor.dashboard');

        Route::prefix('products')->controller(ProductController::class)->group(function () {
            Route::post('', 'store')->name('products.store');
            Route::put('{product}', 'update')->name('products.update');

            Route::post('{product}/variants', [VariantController::class, 'store'])->name('variants.store');
            Route::put('{product}/variants/{variant}', [VariantController::class, 'update'])->name('variants.update');
        });

        Route::post('vendor/product-variant/{variant}/stock', [InventoryStockController::class, 'store'])->name('inventory-stocks.store');
    });

    Route::middleware('role:driver')->group(function () {
        Route::prefix('driver')->controller(DriverController::class)->group(function () {
            Route::get('dashboard', [DriverController::class, 'dashboard'])->name('drivers.dashboard');

            Route::get('vehicles', [VehicleController::class, 'index'])->name('driver-vehicles.index');
            Route::get('vehicles/create', [VehicleController::class, 'create'])->name('driver-vehicles.create');
            Route::post('vehicles', [VehicleController::class, 'store'])->name('driver-vehicles.store');
            Route::patch('vehicles/{vehicle}/active', [VehicleController::class, 'active'])->name('driver-vehicles.active');
        });
    });
});

Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])->name('stripe.webhook');
Route::post('/xendit/webhook', [XenditWebhookController::class, 'handle'])->name('xendit.webhook');
Route::post('/paypal/webhook', [PayPalWebhookController::class, 'handle'])->name('paypal.webhook');