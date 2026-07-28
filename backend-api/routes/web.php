<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/api', function () {
    return 'Hello Mattie Boy!';
});

Route::get('/api/test-connection', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Hello from Laravel Backend!',
        'timestamp' => now()
    ]);
});