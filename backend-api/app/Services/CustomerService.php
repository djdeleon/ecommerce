<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    public function upgradeUserToVendor(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $user->assignRole('vendor');

            $user->vendor()->create([
                'shop_name' => $data['shop_name'],
                'business_tin' => $data['business_tin'],
            ]);

            return $user->load('vendor');
        });
    }
}