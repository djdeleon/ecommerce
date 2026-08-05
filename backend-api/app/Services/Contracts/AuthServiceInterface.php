<?php

namespace App\Services\Contracts;

use App\Models\User;

interface AuthServiceInterface
{
    public function registerUser(array $data): User;
    public function attemptLogin(array $credentials): ?array;
}