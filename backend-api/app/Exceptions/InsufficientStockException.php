<?php

namespace App\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public function __construct(string $message = 'Cannot reserve more stock than is currently available.')
    {
        parent::__construct($message, 422);
    }
}
