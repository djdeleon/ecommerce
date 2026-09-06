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

        $this->command->info('Seeding Regions...');

        $regionMap = [];
        $provinceMap = [];
        $cityMap = [];
        $barangayBuffer = [];

        (new FastExcel)->sheet(4)->import($path, function ($line) use (&$regionMap, &$provinceMap, &$cityMap, &$barangayBuffer) {
            $code = $line['10-digit PSGC'];
            $type = $line['Geographic Level'];
            
            if ($type === 'Reg') {
                $region = Region::create([
                    'code' => $code,
                    'correspondence_code' => $line['Correspondence Code'],
                    'name' => $line['Name']
                ]);

                $regionPrefixCode = substr($code, 0, 2);
                $regionMap[$regionPrefixCode] = $region->id;
            }

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
}

