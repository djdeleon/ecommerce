<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\DriverController;
use Illuminate\Support\Facades\Route;

Route::post('/api/auth/register', [AuthController::class, 'register'])->name('register');
Route::post('/api/auth/login', [AuthController::class, 'login'])->name('login');

Route::middleware(['auth:sanctum', 'role:Customer'])
    ->get('/api/customer/dashbaord', [CustomerController::class, 'dashboard'])->name('customer.dashboard');

Route::middleware(['auth:sanctum', 'role:Vendor'])
    ->get('/api/vendor/dashbaord', [VendorController::class, 'dashboard'])->name('vendor.dashboard');

Route::middleware(['auth:sanctum', 'role:Driver'])
    ->get('/api/driver/dashbaord', [DriverController::class, 'dashboard'])->name('driver.dashboard');