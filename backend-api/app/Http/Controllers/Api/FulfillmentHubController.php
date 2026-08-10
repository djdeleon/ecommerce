<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateFulfillmentHubRequest;
use App\Models\FulfillmentHub;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

class FulfillmentHubController extends Controller
{
    use HttpResponses;

    public function index(): JsonResponse
    {
        $fulfillmentHubs = FulfillmentHub::all();

        return $this->success(
            $fulfillmentHubs,
            'Fulfillment Hubs retrieved',
        );
    }

    public function store(CreateFulfillmentHubRequest $request): JsonResponse
    {
        $fulfillmentHub = FulfillmentHub::create($request->validated());

        return $this->success(
            $fulfillmentHub,
            'Fulfillment Hub created',
            201
        );
    }
}
