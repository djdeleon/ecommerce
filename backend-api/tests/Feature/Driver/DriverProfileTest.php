<?php

use App\Models\User;

test('an unauthenticated user can register as driver', function () {
    $payload = [
        'name' => 'Driver',
        'email' => 'driver@example.com',
        'password' => 'secretPassword123',
        'password_confirmation' => 'secretPassword123',
        'license_number' => 'XHX-1223'
    ];

    $response = $this->postJson(route('drivers.register'), $payload);
    $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'driver' => [
                            'license_number',
                        ],
                    ],
                    'token',
                ],
            ]);

    $user = User::where('name', $payload['name'])->first();
    expect($user->hasRole('driver'))->toBeTrue();
})->only();