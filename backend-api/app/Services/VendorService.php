<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class VendorService
{
    public function registerNewVendor(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
    
            $user->assignRole('vendor');
    
            $user->vendor()->create([
                'shop_name' => $data['shop_name'],
                'business_tin' => $data['business_tin'],
            ]);
    
            $token = $user->createToken('auth_token')->plainTextToken;
    
            return [
                'user' => $user->load('vendor'),
                'token' => $token,
            ];
        });
    }
}