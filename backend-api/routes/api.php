<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\CategoryController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->name('register');
    Route::post('login', [AuthController::class, 'login'])->name('login');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::middleware('role:admin')->group(function () {
        Route::get('admin/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');

        Route::prefix('category')->controller(CategoryController::class)->group(function () {
            Route::post('', 'store')->name('category.store');
            Route::get('{category}', 'show')->name('category.show');
            Route::patch('{category}', 'update')->name('category.update');
            Route::delete('{category}', 'destroy')->name('category.destroy');
        });
    });

    Route::middleware('role:customer')->group(function () {
        Route::get('customer/dashboard', [CustomerController::class, 'dashboard'])->name('customer.dashboard');
    });

    Route::middleware('role:vendor')->group(function () {
        Route::get('vendor/dashboard', [VendorController::class, 'dashboard'])->name('vendor.dashboard');
    });

    Route::middleware('role:driver')->group(function () {
        Route::get('driver/dashboard', [DriverController::class, 'dashboard'])->name('driver.dashboard');
    });
});