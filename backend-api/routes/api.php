<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/api/auth/register', [AuthController::class, 'register'])->name('api.register');