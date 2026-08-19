<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            $user->assignRole('customer');

            $user->customer()->create([
                'shipping_address' => $data['shipping_address'],
            ]);

            $user->customer->cart()->create();

            $token = $user->createToken('auth_token')->plainTextToken;

            return [
                'user' => $user->load('vendor'),
                'token' => $token,
            ];
        });
    }
}