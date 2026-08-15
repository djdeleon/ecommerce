<?php

use App\Models\User;
use App\Models\Vendor;
use App\Models\Warehouse;

test('unauthorized users cannot view or manage warehouses', function (string $role) {
    $randomUser = User::factory()->create();
    $randomUser->assignRole($role);

    $this->actingAs($randomUser, 'sanctum')
        ->getJson(route('warehouses.index'))
        ->assertForbidden();

    $this->actingAs($randomUser, 'sanctum')
        ->postJson(route('warehouses.store'), ['address' => 'Illegal Depot'])
        ->assertForbidden();
})->with([
    'customer role' => 'customer',
    'driver role' => 'driver',
]);

describe('admin warehouse management', function () {
    it('can view all warehouses across the platform globally', function () {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $warehouses = Warehouse::factory(20)->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson(route('warehouses.index'))
            ->assertOk()
            ->assertJsonCount(15, 'data.data')
            ->assertJsonPath('data.total', 20)
            ->assertJsonFragment(['id' => $warehouses->first()->id]);
    });

    it('can create a warehouse for any specific vendors', function () {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $vendor = Vendor::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson(route('warehouses.store'), [
                'vendor_id' => $vendor->id,
                'address' => 'Warehouse 123 St.'
            ])
            ->assertCreated();
        
        expect($vendor->warehouses->count())->toBe(1);
    });
});

describe('vendor warehouse management', function () {
    it('can view the list of its warehouses', function () {
        $vendor = Vendor::factory()
            ->hasWarehouses(20)
            ->create();
        
        $otherWarehouse = Warehouse::factory()->create();

        $this->actingAs($vendor->user, 'sanctum')
            ->getJson(route('warehouses.index'))
            ->assertOk()
            ->assertJsonCount(15, 'data.data')
            ->assertJsonPath('data.total', 20)
            ->assertJsonFragment(['id' => $vendor->warehouses->first()->id])
            ->assertJsonMissing(['id' => $otherWarehouse->id]);
    });

    it('can create its own warehouse', function () {
        $vendor = Vendor::factory()->create();

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson(route('warehouses.store'), [
                'address' => 'Warehouse 123 St.'
            ])
            ->assertCreated();
        
        $this->assertDatabaseHas('warehouses', ['address' => $vendor->warehouses()->first()->address]);
    });
});