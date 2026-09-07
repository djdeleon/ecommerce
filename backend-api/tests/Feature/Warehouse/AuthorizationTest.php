<?php

use App\Models\Address\Region;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Warehouse;
use Database\Factories\Address\AddressFactory;
use Illuminate\Testing\Fluent\AssertableJson;

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
        $address = AddressFactory::luzon();

        $payload = [
            'detail_address' => [
                'vendor_id' => $vendor->id,
                'name' => 'Vendor Warehouse A',
                'contact_number'   => '09171234567',
            ],
            'address' => $address,
        ];

        $this->actingAs($admin, 'sanctum')
            ->postJson(route('warehouses.store'), $payload)
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

        $address = AddressFactory::luzon();

        $payload = [
            'detail_address' => [
                'vendor_id' => $vendor->id,
                'name' => 'Vendor Warehouse A',
                'contact_number'   => '09171234567',
            ],
            'address' => $address,
        ];

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson(route('warehouses.store'), $payload)
            ->assertCreated()
            ->assertJson(fn (AssertableJson $json) => 
                $json->has('data', fn (AssertableJson $json) => 
                    $json->where('name', 'Vendor Warehouse A')
                        ->where('vendor_id', $vendor->id)
                        ->where('id', $vendor->warehouses[0]->id)
                        ->where('contact_number', '09171234567')
                        ->has('address', fn (AssertableJson $json) => 
                            $json->where('id', $vendor->warehouses[0]->address->id)
                                ->where('addressable_type', 'App\\Models\\Warehouse')
                                ->where('addressable_id', $vendor->warehouses[0]->id)
                                ->where('region_id', $vendor->warehouses[0]->address->region_id)
                                ->where('province_id', $vendor->warehouses[0]->address->province_id)
                                ->where('city_id', $vendor->warehouses[0]->address->city_id)
                                ->where('barangay_id', $vendor->warehouses[0]->address->barangay_id)
                                ->etc() // Ignores timestamps like created_at/updated_at if they fluctuate
                        )
                        ->etc()
                )
                ->where('message', 'Warehouse created')
                ->etc()
            );

        expect($vendor->warehouses)->toHaveCount(1);
    });
});