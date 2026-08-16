<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class DriverService
{
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            $user->assignRole('driver');
    
            $user->driver()->create([
                'license_number' => $data['license_number'],
            ]);
    
            $token = $user->createToken('auth_token')->plainTextToken;
    
            return [
                'user' => $user->load('driver'),
                'token' => $token,
            ];
        });
    }
}