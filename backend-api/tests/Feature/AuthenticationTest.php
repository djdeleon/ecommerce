<?php

test('it returns validation errors if registration fields are missing', function () {
    $response = $this->postJson(route('api.register'), []);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
});