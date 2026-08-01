<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function customer(): User
{
    Role::create(['name' => 'Customer']);

    test()->postJson(route('register'), [
        'name'     => 'Customer Joe',
        'email'    => 'customer@example.com',
        'password' => 'securePassword123'
    ]);

    $customer = User::where('email', 'customer@example.com')->first();

    return $customer;
}

function vendor(): User
{
    Role::create(['name' => 'Vendor']);

    test()->postJson(route('register'), [
        'name'     => 'Vendor Joe',
        'email'    => 'vendor@example.com',
        'password' => 'securePassword123',
        'role'     => 'Vendor'
    ]);

    $vendor = User::where('email', 'vendor@example.com')->first();

    return $vendor;
}

function driver(): User
{
    Role::create(['name' => 'Driver']);

    test()->postJson(route('register'), [
        'name'     => 'Driver Joe',
        'email'    => 'driver@example.com',
        'password' => 'securePassword123',
        'role'     => 'Driver'
    ]);

    $driver = User::where('email', 'driver@example.com')->first();

    return $driver;
}

function actingAsRole(string $role)
{
    return test()->actingAs(strtolower($role)(), 'sanctum');
}
