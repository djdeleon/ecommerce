<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyLogisticsWebhook
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $providedSignature = $request->header('X-Logistics-Signature');

        if (! $providedSignature) {
            return response()->json([
                'error' => 'Signature header missing.'
            ], Response::HTTP_UNAUTHORIZED);
        }

        $rawPayload = $request->getContent();

        $secret = config('services.logistics.webhook_secret');
        $expectedSignature = hash_hmac('sha256', $rawPayload, $secret);

        if (! hash_equals($expectedSignature, $providedSignature)) {
            return response()->json([
                'error' => 'Invalid cryptographic signature validation.'
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}
