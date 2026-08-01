<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::create(['name' => 'Customer']);
    Role::create(['name' => 'Vendor']);
    Role::create(['name' => 'Driver']);
    Role::create(['name' => 'Admin']);
});


it('returns validation errors if registration fields are missing', function () {
    $response = $this->postJson(route('register'), []);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
});

it('saves a user to the database and hashes their password upon successful registration', function () {
    $user = [
        'name'     => 'david',
        'email'    => 'customer@example.com',
        'password' => 'securePassword123'
    ];

    $response = $this->postJson(route('register'), $user);

    $response->assertStatus(201)
            ->assertJsonPath('message', 'Registration Successful.');

    $this->assertDatabaseHas('users', [
        'email' => $user['email']
    ]);

    $user = User::where('email', $user['email'])->first();
    expect($user->password)->not->toBe($user['email']);
});

it('assigns a default Customer role if no role is explicitly provided', function () {
    $this->postJson(route('register'), [
        'name'     => 'Customer Joe',
        'email'    => 'default@example.com',
        'password' => 'securePassword123'
    ]);

    $user = User::where('email', 'default@example.com')->first();
    expect($user->hasRole('Customer'))->toBeTrue();
});

it('assigns the explicitly requested role like Vendor or Driver', function () {
    $this->postJson(route('register'), [
        'name'     => 'Super Merchant',
        'email'    => 'vendor@example.com',
        'password' => 'securePassword123',
        'role'     => 'Vendor'
    ]);

    $user = User::where('email', 'vendor@example.com')->first();
    expect($user->hasRole('Vendor'))->toBeTrue();
});

it('rejects registration attempt with an unauthorized or invalid user role', function () {
    $response = $this->postJson(route('register'), [
        'name'     => 'Hacker',
        'email'    => 'hacker@example.com',
        'password' => 'securePassword123',
        'role'     => 'Hacker'
    ]);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
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

    $response = $this->postJson(route('register'), $user);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
});

it('returns validation errors if login fields are missing', function () {
    $response = $this->postJson(route('login'), []);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
});

it('successfully authenticates a user with correct credentials and returns a token', function () {
    User::factory()->create([
        'email' => 'login-test@example.com',
        'password' => Hash::make('secretPassword123')
    ]);

    $response = $this->postJson(route('login'), [
        'email' => 'login-test@example.com',
        'password' => 'secretPassword123'
    ]);

    $response->assertStatus(200)
            ->assertjsonStructure([
                'message',
                'token',
                'user' => ['id', 'email']
            ]);
});

describe('returns an unauthorized error code if credentials do not match', function () {
    it('returns an unauthorized error code if password do not match', function () {
        User::factory()->create([
            'email' => 'wrong-pass@example.com',
            'password' => Hash::make('correctPassword')
        ]);
    
        $response = $this->postJson(route('login'), [
            'email' => 'wrong-pass@example.com',
            'password' => 'badPassword'
        ]);
    
        $response->assertStatus(401)
                ->assertJsonPath('message', 'Invalid credentials.');
    });

    it('returns an unauthorized error code if email do not match', function () {
        User::factory()->create([
            'email' => 'wrong-email@example.com',
            'password' => Hash::make('secretPassword123')
        ]);

        $response = $this->postJson(route('login'), [
            'email' => 'correct-email@example.com',
            'password' => 'secretPassword123'
        ]);

        $response->assertStatus(401)
                ->assertJsonPath('message', 'Invalid credentials.');
    });
});