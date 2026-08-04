<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\ProductCategoryController;
use Illuminate\Support\Facades\Route;

Route::post('/api/auth/register', [AuthController::class, 'register'])->name('register');
Route::post('/api/auth/login', [AuthController::class, 'login'])->name('login');

Route::middleware(['auth:sanctum', 'role:admin'])
    ->get('/api/admin/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');

Route::middleware(['auth:sanctum', 'role:admin'])
    ->post('/api/product-category', [ProductCategoryController::class, 'store'])->name('category.store');
Route::middleware(['auth:sanctum', 'role:admin'])
    ->patch('/api/product-category/{productCategory}', [ProductCategoryController::class, 'update'])->name('category.update');
Route::middleware(['auth:sanctum', 'role:admin'])
    ->get('/api/product-category/{productCategory}', [ProductCategoryController::class, 'show'])->name('category.show');

Route::middleware(['auth:sanctum', 'role:customer'])
    ->get('/api/customer/dashboard', [CustomerController::class, 'dashboard'])->name('customer.dashboard');

Route::middleware(['auth:sanctum', 'role:vendor'])
    ->get('/api/vendor/dashboard', [VendorController::class, 'dashboard'])->name('vendor.dashboard');

Route::middleware(['auth:sanctum', 'role:driver'])
    ->get('/api/driver/dashboard', [DriverController::class, 'dashboard'])->name('driver.dashboard');