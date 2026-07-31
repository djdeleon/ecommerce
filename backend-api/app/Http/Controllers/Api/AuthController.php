<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        User::create([
            'name' => $request['name'],
            'email' => $request['email'],
            'password' => Hash::make($request['password'])
        ]);

        return response()->json(['message' => 'Registration Successful.'], 201);
    }

    public function login(LoginRequest $request, AuthService $authService)
    {
        $authData = $authService->attempLogin($request->validated());

        if (!$authData) {
            return response()->json(['message', 'Failed'], 401);
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
