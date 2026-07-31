<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validateData = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email',
            'password' => 'required|min:8'
        ]);

        User::create([
            'name' => $validateData['name'],
            'email' => $validateData['email'],
            'password' => Hash::make($validateData['password'])
        ]);

        return response()->json(['message' => 'Registration Successful.'], 201);
    }
}
