<?php

test('vendor can access their dashboard data', function () {
    actingAsRole('Vendor')
        ->getJson(route('vendor.dashboard'))
        ->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email'
            ]
        ]);
});