<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, AuthService $authService)
    {
        $authService->registerUser($request->validated());

        return response()->json(['message' => 'Registration Successful.'], 201);
    }

    public function login(LoginRequest $request, AuthService $authService)
    {
        $authData = $authService->attempLogin($request->validated());

        if (!$authData) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        return response()->json([
            'message' => 'Login successful.',
            'token' => $authData['token'],
            'user' => [
                'id' => $authData['user']->id,
                'email' => $authData['user']->email,
            ]
        ]);
    }
}
