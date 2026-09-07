<?php

use App\Enums\UserRole;
use App\Models\Address\Region;
use App\Models\User;
use App\Models\Vendor;

/**
 * need a VendorAddress as well?
 * - I think WarehouseAddress
 * - we can apply polymorphism
 * - I think for the warehouses, it is going to be a one-to-one
 * - - we are just going to put all the details about address in a warehouse_addresses table
 * - - because a vendor can already have multiple warehouses
 */

test('a vendor can have multiple warehouses with full psgc addresses', function () {
    $vendor = Vendor::factory()->hasWarehouses()->create();

    $region = Region::create([
        'code' => '0700000000',
        'correspondence_code' => '070000000',
        'name' => 'Central Visayas',
        'slug' => 'region_7',
    ]);

    $province = $region->provinces()->create([
        'code' => '0722000000',
        'correspondence_code' => '072200000',
        'name' => 'Cebu',
    ]);


    $city = $province->cities()->create([
        'code' => '0722170000',
        'correspondence_code' => '072217000',
        'name' => 'Cebu City',
    ]);

    $barangay = $city->barangays()->create([
        'code' => '0722170010',
        'correspondence_code' => '072217001',
        'name' => 'Lahug',
    ]);

    $payload = [
        'recipient_name' => 'John Doe',
        'phone_number'   => '09171234567',
        'region_id'      => $region->id,
        'province_id'    => $province->id,
        'city_id'        => $city->id,
        'barangay_id'    => $barangay->id,
        'street_address' => 'Apas St, near IT Park',
        'zip_code'       => '6000',
        'is_default'     => true,
        'label'          => 'Home',
    ];

    $vendor->warehouses[0]->warehouseAddress()->create($payload);


    dd($vendor->warehouses[0]->warehouseAddress->addressable->warehouseAddress);
})->skip();

test('an unauthenticated user can register as vendor', function () {
    $vendorPayload = [
        'name' => 'Vendor',
        'email' => 'vendor@example.com',
        'password' => 'secretPassword123',
        'password_confirmation' => 'secretPassword123',
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

    actingAsRole(UserRole::Customer)
        ->postJson(route('users.vendor-upgrade'), $vendorPayload)
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

test('a registered vendor is unauthorized to access customer vendor upgrade', function () {
    $user = User::factory()->create();
    $user->assignRole('vendor');
    $user->vendor()->create([
        'shop_name' => 'Original Shop',
        'business_tin' => '123'
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson(route('users.vendor-upgrade'), [
            'shop_name' => 'New Shop',
            'business_tin' => '456'
        ])
        ->assertStatus(403);
});

describe('validation tests for customer vendor upgrade', function () {
    it('fails if required vendor fields are missing', function () {
        actingAsRole(UserRole::Customer)
            ->postJson(route('users.vendor-upgrade'), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['shop_name', 'business_tin']);
    });
    
    it('fails if shop_name or business_tin is already taken', function () {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $user->vendor()->create([
            'shop_name' => 'Original Shop',
            'business_tin' => '123'
        ]);
    
        $this->actingAs($user, 'sanctum')
            ->postJson(route('users.vendor-upgrade'), [
                'shop_name' => 'Original Shop',
                'business_tin' => '123'
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['shop_name', 'business_tin']);
    });
});

describe('validation tests for vendor registration', function () {
    it('fails if required vendor fields are missing', function () {
        $this->postJson(route('vendor.register'), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'shop_name', 'business_tin']);
    });
    
    it('fails if shop_name or business_tin is already taken', function () {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $user->vendor()->create([
            'shop_name' => 'Vendor Shop',
            'business_tin' => '123'
        ]);

        $this->postJson(route('vendor.register'), [
                'name' => 'New Vendor',
                'email' => 'vendor@example.com',
                'password' => 'secretPassword123',
                'shop_name' => 'Vendor Shop',
                'business_tin' => '123'
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['shop_name', 'business_tin']);
    });
});

test('relationship data access for user and vendor', function () {
    $user = User::factory()->create([
        'name' => 'Vendor',
    ]);
    $user->assignRole('customer');
    $user->vendor()->create([
        'shop_name' => 'Vendor Shop',
        'business_tin' => '123'
    ]);

    $vendor = Vendor::all()->first();

    expect($user->vendor->shop_name)->toBe('Vendor Shop');
    expect($vendor->user->name)->toBe('Vendor');
});