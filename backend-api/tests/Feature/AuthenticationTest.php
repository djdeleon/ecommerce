<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

uses(RefreshDatabase::class);

it('returns validation errors if registration fields are missing', function () {
    $response = $this->postJson(route('api.register'), []);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
});

it('saves a user to the database and hashes their password upon successful registration', function () {
    $user = [
        'name'     => 'david',
        'email'    => 'customer@example.com',
        'password' => 'securePassword123'
    ];

    $response = $this->postJson(route('api.register'), $user);

    $response->assertStatus(201)
            ->assertJsonPath('message', 'Registration Successful.');

    $this->assertDatabaseHas('users', [
        'email' => $user['email']
    ]);

    $user = User::where('email', $user['email'])->first();
    expect($user->password)->not->toBe($user['email']);
});

it('returns an error if the given email already exists', function () {
    User::factory()->create([
        'email' => 'duplicate@example.com'
    ]);

    $user = [
        'name'     => 'david',
        'email'    => 'duplicate@example.com',
        'password' => 'securePassword123'
    ];

    $response = $this->postJson(route('api.register'), $user);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
});