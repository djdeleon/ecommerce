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
        $data = $request->validated();

        $fulfillmentHub = FulfillmentHub::create($data['detail_address']);
        $fulfillmentHub->address()->create($data['address']);

        $fulfillmentHub->load('address');

        return $this->success(
            $fulfillmentHub,
            'Fulfillment Hub created',
            201
        );
    }
}
