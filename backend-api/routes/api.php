<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use Illuminate\Support\Facades\Route;

Route::post('/api/auth/register', [AuthController::class, 'register'])->name('register');
Route::post('/api/auth/login', [AuthController::class, 'login'])->name('login');

Route::middleware(['auth:sanctum', 'role:Customer'])
    ->get('/api/customer/dashbaord', [CustomerController::class, 'dashboard'])->name('customer.dashboard');