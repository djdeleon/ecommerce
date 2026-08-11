<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait HttpResponses
{
    protected function success(mixed $data, ?string $message = null, int $code = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'message' => $message,
        ], $code);
    }

    protected function error(?string $message = null, int $code = 400, mixed $errors = null): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}