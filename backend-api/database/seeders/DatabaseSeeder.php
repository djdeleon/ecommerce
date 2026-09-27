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
        // $region = Region::find(1);
        // $regionProvinces = $region->provinces;

        // // dd(Region::all()->toArray());

        // $province = Province::find(1);
        // $provinceRegion = $province->region;
        // $provinceCities = $province->cities;

        // $city = City::find(1);
        // $cityProvince = $city->province;
        // $cityBarangays = $city->barangays;

        // $barangay = Barangay::find(1);
        // $barangayCity = $barangay->city;

        // $regions = Region::all();

        // /**
        //  * I am thinking of between 1 to 10 (inclusive) barangays is equals one sorting hub
        //  */
        // $regions->each(function ($region) {
        //     dump("{$region->name} has {$region->provinces->count()} provinces");
        //     $region->provinces->each(function ($province) use ($region) {
        //         dump("{$region->name} of {$province->name} has {$province->cities->count()} cities");
        //         $province->cities->each(function ($city) use ($region, $province) {
        //             dump("{$region->name} of {$province->name} of {$city->name} has {$city->barangays->count()} barangays");
        //         });
        //     });
        // });

        // dd(Region::count(), Province::count(), City::count(), Barangay::count());

        $this->call([
            // RoleSeeder::class,
            // UserSeeder::class,
            // VendorSeeder::class,
            // VendorTwoSeeder::class
            AddressSeeder::class,
        ]);
    }
}
