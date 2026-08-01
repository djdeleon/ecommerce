<?php

test('admin can access their dashboard data', function () {
    actingAsRole('Admin')
        ->getJson(route('admin.dashboard'))
        ->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email'
            ]
        ]);
});