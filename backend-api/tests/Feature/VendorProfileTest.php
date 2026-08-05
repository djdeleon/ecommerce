<?php

use App\Models\User;

test('an unauthenticated user can register as vendor', function () {
    $vendorPayload = [
        'name' => 'Vendor',
        'email' => 'vendor@example.com',
        'password' => 'secretPassword123',
        'shop_name' => 'Vendor Shop',
        'business_tin' => 'business 123'
    ];
    
    $response = $this->postJson(route('vendor.register'), $vendorPayload);
    $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'vendor' => [
                            'shop_name',
                            'business_tin',
                        ],
                    ],
                    'token',
                ],
            ]);

    $user = User::where('name', $vendorPayload['name'])->first();
    expect($user->hasRole('vendor'))->toBeTrue();
});

test('a registered customer can upgrade as vendor', function () {
    $vendorPayload = [
        'shop_name' => 'Vendor Shop',
        'business_tin' => 'business 123'
    ];

    actingAsRole(Roles::Customer)
        ->postJson(route('customer.vendor-upgrade'), $vendorPayload)
        ->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'name',
                'email',
                'vendor' => [
                    'shop_name',
                    'business_tin'
                ],
            ]
        ]);
});