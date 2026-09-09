<?php

namespace App\DataObjects;

readonly class Coordinate
{
    public function __construct(
        public float $lat,
        public float $lon
    ) {}
}