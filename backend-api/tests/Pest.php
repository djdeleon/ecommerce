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
    ->beforeEach(function () {
        foreach (Roles::cases() as $role) {
            Role::firstOrCreate([
                'name' => $role->value,
            ]);
        }
    })
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

enum Roles: string
{
    case Admin = 'admin';
    case Customer = 'customer';
    case Vendor = 'vendor';
    case Driver = 'driver';
}

function getUserWithRole(Roles $role)
{
    $data = [
        'name'     => "{$role->name} Joe",
        'email'    => "{$role->value}@example.com",
        'password' => 'securePassword123',
    ];

    $data = array_merge($data, $role->value !== 'Customer' ? ['role' => $role->value] : []);

    test()->postJson(route('register'), $data);

    $user = User::where('email', "{$role->value}@example.com")->first();

    return $user;
}

function actingAsRole(Roles $role)
{
    return test()->actingAs(getUserWithRole($role), 'sanctum');
}
