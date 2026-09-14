<?php

namespace Database\Seeders;

use App\Models\Address\City;
use App\Models\Address\Province;
use App\Models\Address\Region;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Rap2hpoutre\FastExcel\FastExcel;

class AddressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = storage_path('app/psgc.xlsx');

        if (! file_exists($path)) {
            $this->command->error("File not found at {$path}");
        }

        $this->command->info('Starting PSGC Seeding...');

        $regionMap = [];
        $provinceMap = [];
        $cityMap = [];
        $barangayBuffer = [];

        (new FastExcel)->sheet(4)->import($path, function ($line) use (&$regionMap, &$provinceMap, &$cityMap, &$barangayBuffer) {
            $code = $line['10-digit PSGC'];
            $type = $line['Geographic Level'];
            
            // -------------------------------------------------------------
            // 1. REGIONS
            // -------------------------------------------------------------
            if ($type === 'Reg') {
                $regionPrefixCode = substr($code, 0, 2);

                $region = Region::create([
                    'code' => $code,
                    'correspondence_code' => $line['Correspondence Code'],
                    'name' => $line['Name'],
                    'slug' => $this->getSlug($regionPrefixCode),
                    'zone' => $this->getZone($regionPrefixCode),
                ]);

                $regionMap[$regionPrefixCode] = $region->id;
            }

            // -------------------------------------------------------------
            // 2. PROVINCES
            // -------------------------------------------------------------
            if ($type === 'Prov') {
                $regionPrefixCode = substr($code, 0, 2);
                $parentId = $regionMap[$regionPrefixCode] ?? null;

                if ($parentId) {
                    $province = Province::create([
                        'code' => $code,
                        'correspondence_code' => $line['Correspondence Code'],
                        'name' => $line['Name'],
                        'region_id' => $parentId,
                    ]);

                    $provincePrefixCode = substr($code, 0, 5);
                    $provinceMap[$provincePrefixCode] = $province->id;
                }
            }

            // -------------------------------------------------------------
            // 3. CITIES & MUNICIPALITIES
            // -------------------------------------------------------------
            if ($type === 'City' || $type === 'Mun') {
                $provincePrefixCode = substr($code, 0, 5);
                $parentId = $provinceMap[$provincePrefixCode] ?? null;

                if ($parentId) {
                    $city = City::create([
                        'code' => $code,
                        'correspondence_code' => $line['Correspondence Code'],
                        'name' => $line['Name'],
                        'province_id' => $parentId,
                    ]);

                    $cityPrefixCode = substr($code, 0, 7);
                    $cityMap[$cityPrefixCode] = $city->id;
                }
            }

            // -------------------------------------------------------------
            // 4. BARANGAYS (Batch Insert in Chunks of 1,000)
            // -------------------------------------------------------------
            if ($type === 'Bgy') {
                $cityPrefixCode = substr($code, 0, 7);
                $parentId = $cityMap[$cityPrefixCode] ?? null;
                
                if ($parentId) {
                    $barangayBuffer[] = [
                        'city_id' => $parentId,
                        'code' => $code,
                        'correspondence_code' => $line['Correspondence Code'],
                        'name' => $line['Name'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                if (count($barangayBuffer) >= 1000) {
                    DB::table('barangays')->insert($barangayBuffer);
                    $barangayBuffer = [];
                }
            }
        });

        if (! empty($barangayBuffer)) {
            DB::table('barangays')->insert($barangayBuffer);
        }
    }

    private function getSlug(string $code): string
    {
        return match($code) {
            '13' => 'ncr',
            '14' => 'car',
            '01' => 'region_1',
            '02' => 'region_2',
            '03' => 'region_3',
            '04' => 'region_4a',
            '17' => 'mimaropa',
            '05' => 'region_5',
            '06' => 'region_6',
            '18' => 'nir',
            '07' => 'region_7',
            '08' => 'region_8',
            '09' => 'region_9',
            '10' => 'region_10',
            '11' => 'region_11',
            '12' => 'region_12',
            '16' => 'region_13',
            '19' => 'barmm',
            default => 'region_4a', // Safe fallback
        };
    }

    private function getZone(string $code): string
    {
        return match($code) {
            '13' => 'metro_manila',
            '14' => 'north_luzon',
            '01' => 'north_luzon',
            '02' => 'north_luzon',
            '03' => 'north_luzon',
            '04' => 'south_luzon',
            '17' => 'south_luzon',
            '05' => 'south_luzon',
            '06' => 'visayas',
            '18' => 'visayas',
            '07' => 'visayas',
            '08' => 'visayas',
            '09' => 'mindanao',
            '10' => 'mindanao',
            '11' => 'mindanao',
            '12' => 'mindanao',
            '16' => 'mindanao',
            '19' => 'mindanao',
            default => 'metro_manila', // Safe fallback
        };
    }
}

