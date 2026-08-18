<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateVehicleRequest;
use App\Http\Requests\UpdateActiveVehicleRequest;
use App\Models\Vehicle;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    use HttpResponses;

    public function index(Request $request): JsonResponse
    {
        $vehicles = $request->user()->driver->vehicles;

        return $this->success(
            $vehicles,
            'Driver Vehicles is retrived'
        );
    }
    
    public function create(): JsonResponse
    {
        $types = Vehicle::getTypeOptions();

        return $this->success(
            $types,
            'Vehicle Types is retrived'
        );
    }

    public function store(CreateVehicleRequest $request): JsonResponse
    {
        $vehicle = $request->user()->driver->vehicles()->create($request->validated());

        return $this->success(
            $vehicle,
            'Driver Vehicle created',
            201
        );
    }

    public function active(UpdateActiveVehicleRequest $request, Vehicle $vehicle): JsonResponse
    {
        $request->user()->driver()->update([
            'active_vehicle_id' => $vehicle->id
        ]);

        return $this->success(
            $request->user()->driver,
            'Driver Vehicle activated',
        );
    }
}
