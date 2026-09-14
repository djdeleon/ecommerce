<?php

use App\Enums\UserRole;
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
        foreach (UserRole::cases() as $role) {
            Role::firstOrCreate([
                'name' => $role->value,
            ]);
        }
    })
    ->in('Feature');

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function () {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'vendor', 'guard_name' => 'web']);
    })
    ->in('Unit');

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

function getUserWithRole(UserRole $role): User
{
    $user = User::factory()->create([
        'name'     => "{$role->name} Joe",
        'email'    => "{$role->value}@example.com",
        'password' => 'securePassword123',
    ]);

    if ($role === UserRole::Admin) {
        return $user->assignRole($role);
    }

    $model = "App\\Models\\{$role->name}";

    $model::factory()->for($user)->create();

    return $user;
}

function actingAsRole(UserRole $role)
{
    return test()->actingAs(getUserWithRole($role), 'sanctum');
}

function pause(string $message = 'If approval of payment is successful, copy the PayPal Order ID from the Paypal Order ID terminal and paste it in the capture order test case $paypalOrderId and Press Enter to continue and move on to it...'): void 
{
    // Write directly to standard error output to bypass Pest's buffered runner output
    fwrite(STDERR, "\n\n💡 [PAUSED] " . $message);
    
    // Open the direct keyboard input stream and wait for newline
    $stream = fopen('php://stdin', 'r');
    fgets($stream);
    fclose($stream);
}
