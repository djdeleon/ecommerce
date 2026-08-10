<?php

use App\Models\FulfillmentHub;
use App\Models\User;

test('platform admin can create a fulfillment hub', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user, 'sanctum')
        ->postJson(route('fulfillment-hubs.store'), [
            'name' => 'Fulfillment Hub A'
        ])
        ->assertCreated();
    
    $this->assertDatabaseHas('fulfillment_hubs', ['name' => 'Fulfillment Hub A']);
});

test('authenticated user can retrieve platform distribution hubs', function () {
    $user = User::factory()->create();
    FulfillmentHub::factory()->create(['name' => 'Central Hub']);
    FulfillmentHub::factory()->create(['name' => 'Distribution Depot']);

    $this->actingAs($user, 'sanctum')
        ->getJson(route('fulfillment-hubs.index'))
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment(['name' => 'Central Hub'])
        ->assertJsonFragment(['name' => 'Distribution Depot']);
});