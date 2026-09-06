<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Address\Region;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

class AddressController extends Controller
{
    use HttpResponses;

    public function regions(): JsonResponse
    {
        $regions = Region::all();

        return $this->success(
            $regions,
            'Regions retrieved.'
        );
    }
}
