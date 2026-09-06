<?php

namespace Database\Seeders;

use App\Models\Address\Barangay;
use App\Models\Address\City;
use App\Models\Address\Province;
use App\Models\Address\Region;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $region = Region::find(1);
        $regionProvinces = $region->provinces;

        $province = Province::find(1);
        $provinceRegion = $province->region;
        $provinceCities = $province->cities;

        $city = City::find(1);
        $cityProvince = $city->province;
        $cityBarangays = $city->barangays;

        $barangay = Barangay::find(1);
        $barangayCity = $barangay->city;

        $this->call([
            // RoleSeeder::class,
            // UserSeeder::class,
            // VendorSeeder::class,
            // VendorTwoSeeder::class
            // AddressSeeder::class,
        ]);
    }
}
