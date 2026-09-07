<?php

namespace Database\Factories\Address;

use App\Models\Address\Barangay;
use App\Models\Address\City;
use App\Models\Address\Province;
use App\Models\Address\Region;
use Illuminate\Support\Facades\Http;

class AddressFactory
{
    protected static array $regions = [];
    protected static Region $activeRegion;
    protected static array $provinces = [];
    protected static Province $activeProvince;
    protected static array $cities = [];
    protected static City $activeCity;
    protected static array $barangays = [];
    protected static Barangay $activeBarangay;
    protected static array $addresses = [];

    public static function region($slug = 'region_3'): self
    {
        if (! array_key_exists($slug, self::$regions)) {
            // LUZON
            if ($slug === 'region_3') {
                self::$regions[$slug] = Region::create([
                    'code' => '0300000000',
                    'correspondence_code' => '030000000',
                    'name' => 'Central Luzon (Region III)',
                    'slug' => $slug,
                ]);

                $region = self::$regions[$slug];
                self::$addresses['region_id'] = $region->id;

                // $province = $region->provinces()->create([
                //     'code' => '0314000000',
                //     'correspondence_code' => '031400000',
                //     'name' => 'Bulacan',
                // ]);

                // self::$addresses['province_id'] = $province->id;

                // $city = $province->cities()->create([
                //     'code' => '0314220000',
                //     'correspondence_code' => '031422000',
                //     'name' => 'City of San Jose del Monte',
                // ]);

                // self::$addresses['city_id'] = $city->id;

                // $barangay = $city->barangays()->create([
                //     'code' => '0314220220',
                //     'correspondence_code' => '031422022',
                //     'name' => 'Tungkong Mangga',
                // ]);

                // self::$addresses['barangay_id'] = $barangay->id;
                
                self::$addresses['street_address'] = 'Garnet Street, Pleasant Hills, San Manuel';
                self::$addresses['latitude'] = '8.4860705';
                self::$addresses['longitude'] = '124.656805';
                self::$addresses['zip_code'] = '3023';
            }
    
            // VISAYAS
            if (! array_key_exists($slug, self::$regions)) {
                if ($slug === 'region_6') {
                    self::$regions[$slug] = Region::create([
                        'code' => '0600000000',
                        'correspondence_code' => '060000000',
                        'name' => 'Region VI (Western Visayas)',
                        'slug' => $slug,
                    ]);
                }
            }
    
            // MINDANAO
            if (! array_key_exists($slug, self::$regions)) {
                if ($slug === 'region_10') {
                    self::$regions[$slug] = Region::create([
                        'code' => '1000000000',
                        'correspondence_code' => '100000000',
                        'name' => 'Region X (Northern Mindanao)',
                        'slug' => 'region_10',
                    ]);
                }
            }
        }

        self::$activeRegion = self::$regions[$slug];

        return new static();
    }

    public function province($name = 'bulacan'): self
    {
        if (self::$activeRegion->slug === 'region_3') {
            if (! array_key_exists('bulacan', self::$provinces) && $name === 'bulacan') {
                self::$provinces[$name] = self::$activeRegion->provinces()->create([
                    'code' => '0314000000',
                    'correspondence_code' => '031400000',
                    'name' => 'Bulacan',
                ]);
            } else if (! array_key_exists('pampanga', self::$provinces) && $name === 'pampanga') {
                self::$provinces[$name] = self::$activeRegion->provinces()->create([
                    'code' => '0354000000',
                    'correspondence_code' => '035400000',
                    'name' => 'Pampanga',
                ]);
            } else if (! array_key_exists('nueve_ecija', self::$provinces) && $name === 'nueve_ecija') {
                self::$provinces[$name] = self::$activeRegion->provinces()->create([
                    'code' => '0349000000',
                    'correspondence_code' => '034900000',
                    'name' => 'Nueva Ecija',
                ]);
            }
        }

        self::$activeProvince = self::$provinces[$name];

        return new static();
    }

    public function city($name = 'san_jose_del_monte'): static
    {
        if (self::$activeRegion->slug === 'region_3' && self::$activeProvince->name === 'Bulacan') {
            if (! array_key_exists('malolos', self::$cities) && $name === 'malolos') {
                self::$cities[$name] = self::$activeProvince->cities()->create([
                    'code' => '0301410000',
                    'correspondence_code' => '031410000',
                    'name' => 'City of Malolos',
                ]);
            } else if (! array_key_exists('meycauayan', self::$cities) && $name === 'meycauayan') {
                self::$cities[$name] = self::$activeProvince->cities()->create([
                    'code' => '0301412000',
                    'correspondence_code' => '031412000',
                    'name' => 'City of Meycauayan',
                ]);
            } else if (! array_key_exists('san_jose_del_monte', self::$cities) && $name === 'san_jose_del_monte') {
                self::$cities[$name] = self::$activeProvince->cities()->create([
                    'code' => '0301420000',
                    'correspondence_code' => '031420000',
                    'name' => 'City of San Jose del Monte',
                ]);
            }
        }

        self::$activeCity = self::$cities[$name];

        return new static();
    }

    public function barangay($name = 'muzon_proper'): self
    {
        if (self::$activeRegion->slug === 'region_3' && self::$activeProvince->name === 'Bulacan' && self::$activeCity->name = 'City of San Jose del Monte') {
            if (! array_key_exists('Muzon Proper', self::$barangays) && $name === 'muzon_proper') {
                self::$barangays[$name] = self::$activeCity->barangays()->create([
                    'code' => '0301420007',
                    'correspondence_code' => '031420007',
                    'name' => 'Muzon Proper',
                ]);
            } else if (! array_key_exists('Muzon Proper', self::$barangays) && $name === 'poblacion') {
                self::$barangays[$name] = self::$activeCity->barangays()->create([
                    'code' => '0301420008',
                    'correspondence_code' => '031420008',
                    'name' => 'Poblacion',
                ]);
            } else if (! array_key_exists('Muzon Proper', self::$barangays) && $name === 'santo_cristo') {
                self::$barangays[$name] = self::$activeCity->barangays()->create([
                    'code' => '0301420009',
                    'correspondence_code' => '031420009',
                    'name' => 'Santo Cristo',
                ]);
            }
        }

        self::$activeBarangay = self::$barangays[$name];

        return new static();
    }

    public static function luzon($region = 'region_1'): array
    {
        $addresses = [];

        $query = [
            'street_address' => ''
        ];

        if ($region === 'region_1') {
            $region = Region::create([
                'code' => '0100000000',
                'correspondence_code' => '010000000',
                'name' => 'Ilocos Region (Region I)',
                'slug' => 'region_1',
            ]);

            $addresses['region_id'] = $region->id;

            $province = $region->provinces()->create([
                'code' => '0105500000',
                'correspondence_code' => '010550000',
                'name' => 'Pangasinan',
            ]);

            $addresses['province_id'] = $province->id;
            $query['province_name'] = $province->name;

            $city = $province->cities()->create([
                'code' => '0105518000',
                'correspondence_code' => '015518000',
                'name' => 'City of Dagupan',
            ]);

            $addresses['city_id'] = $city->id;
            $query['city_name'] = $city->name;

            $barangay = $city->barangays()->create([
                'code' => '0105518002',
                'correspondence_code' => '015518002',
                'name' => 'Bacayao Sur',
            ]);

            $addresses['barangay_id'] = $barangay->id;
        }

        if ($region === 'region_2') {
            $region = Region::create([
                'code' => '0200000000',
                'correspondence_code' => '020000000',
                'name' => 'Cagayan Valley (Region II)',
                'slug' => 'region_2',
            ]);

            $addresses['region_id'] = $region->id;

            $province = $region->provinces()->create([
                'code' => '0201500000',
                'correspondence_code' => '021500000',
                'name' => 'Cagayan',
            ]);

            $addresses['province_id'] = $province->id;
            $query['province_name'] = $province->name;

            $city = $province->cities()->create([
                'code' => '0201529000',
                'correspondence_code' => '021529000',
                'name' => 'City of Tuguegarao',
            ]);

            $addresses['city_id'] = $city->id;
            $query['city_name'] = $city->name;

            $barangay = $city->barangays()->create([
                'code' => '0201529004',
                'correspondence_code' => '021529004',
                'name' => 'Centro 01 (Poblacion)',
            ]);

            $addresses['barangay_id'] = $barangay->id;
        }

        if ($region === 'region_3') {
            $region = Region::create([
                'code' => '0300000000',
                'correspondence_code' => '030000000',
                'name' => 'Central Luzon (Region III)',
                'slug' => 'region_3',
            ]);

            $addresses['region_id'] = $region->id;

            $province = $region->provinces()->create([
                'code' => '0301400000',
                'correspondence_code' => '031400000',
                'name' => 'Bulacan',
            ]);

            $addresses['province_id'] = $province->id;
            $query['province_name'] = $province->name;

            $city = $province->cities()->create([
                'code' => '0301420000',
                'correspondence_code' => '031420000',
                'name' => 'City of San Jose del Monte',
            ]);

            $addresses['city_id'] = $city->id;
            $query['city_name'] = $city->name;

            $barangay = $city->barangays()->create([
                'code' => '0301420007',
                'correspondence_code' => '031420007',
                'name' => 'Muzon Proper',
            ]);

            $addresses['barangay_id'] = $barangay->id;
        }

        $addressQuery = array_filter([
            $query['street_address'],
            $query['city_name'],
            $query['province_name'],
            'Philippines'
        ]);

        
        $fullAddress = implode(', ', $addressQuery);

        $response = Http::withHeaders([
            'User-Agent' => 'EcommercePortfolioApp/1.0' // Required by Nominatim policy
        ])->get('https://nominatim.openstreetmap.org/search', [
            'q' => $fullAddress,
            'format' => 'json',
            'limit' => 1,
        ]);

        if ($response->successful() && !empty($response->json())) {
            $data = $response->json()[0];
            $addresses['latitude'] = (float) $data['lat'];
            $addresses['longitude'] = (float) $data['lon'];
        }

        return $addresses;
    }

    public static function visayas($region = 'region_6'): array
    {
        $addresses = [];
        $query = [
            'street_address' => ''
        ];

        if ($region === 'region_6') {
            $region = Region::create([
                'code' => '0600000000',
                'correspondence_code' => '060000000',
                'name' => 'Western Visayas (Region VI)',
                'slug' => 'region_6',
            ]);

            $addresses['region_id'] = $region->id;

            $province = $region->provinces()->create([
                'code' => '0604500000',
                'correspondence_code' => '064500000',
                'name' => 'Iloilo',
            ]);

            $addresses['province_id'] = $province->id;
            $query['province_name'] = $province->name;

            $city = $province->cities()->create([
                'code' => '0604520000',
                'correspondence_code' => '064520000',
                'name' => 'City of Iloilo',
            ]);

            $addresses['city_id'] = $city->id;
            $query['city_name'] = $city->name;

            $barangay = $city->barangays()->create([
                'code' => '0604520015',
                'correspondence_code' => '064520015',
                'name' => 'City Proper (Poblacion)',
            ]);

            $addresses['barangay_id'] = $barangay->id;

        }
        
        if ($region === 'region_7') {
            $region = Region::create([
                'code' => '0700000000',
                'correspondence_code' => '070000000',
                'name' => 'Central Visayas (Region VII)',
                'slug' => 'region_7',
            ]);

            $addresses['region_id'] = $region->id;

            $province = $region->provinces()->create([
                'code' => '0702200000',
                'correspondence_code' => '072200000',
                'name' => 'Cebu',
            ]);

            $addresses['province_id'] = $province->id;
            $query['province_name'] = $province->name;

            $city = $province->cities()->create([
                'code' => '0703060000',
                'correspondence_code' => '073060000',
                'name' => 'City of Cebu',
            ]);

            $addresses['city_id'] = $city->id;
            $query['city_name'] = $city->name;

            $barangay = $city->barangays()->create([
                'code' => '070306060', // Note: Check standard DB length constraints for shortened sub-blocks
                'correspondence_code' => '073060060',
                'name' => 'Parian',
            ]);

            $addresses['barangay_id'] = $barangay->id;
        }
        
        if ($region === 'region_8') {
            $region = Region::create([
                'code' => '0800000000',
                'correspondence_code' => '080000000',
                'name' => 'Eastern Visayas (Region VIII)',
                'slug' => 'region_8',
            ]);

            $addresses['region_id'] = $region->id;

            $province = $region->provinces()->create([
                'code' => '0803700000',
                'correspondence_code' => '083700000',
                'name' => 'Leyte',
            ]);

            $addresses['province_id'] = $province->id;
            $query['province_name'] = $province->name;

            $city = $province->cities()->create([
                'code' => '0803747000',
                'correspondence_code' => '083747000',
                'name' => 'City of Tacloban',
            ]);

            $addresses['city_id'] = $city->id;
            $query['city_name'] = $city->name;

            $barangay = $city->barangays()->create([
                'code' => '0803747043',
                'correspondence_code' => '083747043',
                'name' => 'Barangay 52',
            ]);

            $addresses['barangay_id'] = $barangay->id;
        }

        $addressQuery = array_filter([
            $query['street_address'],
            $query['city_name'],
            $query['province_name'],
            'Philippines'
        ]);

        
        $fullAddress = implode(', ', $addressQuery);

        $response = Http::withHeaders([
            'User-Agent' => 'EcommercePortfolioApp/1.0' // Required by Nominatim policy
        ])->get('https://nominatim.openstreetmap.org/search', [
            'q' => $fullAddress,
            'format' => 'json',
            'limit' => 1,
        ]);

        if ($response->successful() && !empty($response->json())) {
            $data = $response->json()[0];
            $addresses['latitude'] = (float) $data['lat'];
            $addresses['longitude'] = (float) $data['lon'];
        }

        return $addresses;
    }

    public static function mindanao($region = 'region_6'): array
    {
        $addresses = [];
        $query = [
            'street_address' => ''
        ];


        if ($region === 'region_9') {
            $region = Region::create([
                'code' => '0900000000',
                'correspondence_code' => '090000000',
                'name' => 'Zamboanga Peninsula (Region IX)',
                'slug' => 'region_9',
            ]);

            $addresses['region_id'] = $region->id;

            $province = $region->provinces()->create([
                'code' => '0907300000',
                'correspondence_code' => '097300000',
                'name' => 'Zamboanga del Sur',
            ]);

            $addresses['province_id'] = $province->id;
            $query['province_name'] = $province->name;

            $city = $province->cities()->create([
                'code' => '0907322000',
                'correspondence_code' => '097322000',
                'name' => 'City of Pagadian',
            ]);

            $addresses['city_id'] = $city->id;
            $query['city_name'] = $city->name;

            $barangay = $city->barangays()->create([
                'code' => '0907322047',
                'correspondence_code' => '097322047',
                'name' => 'San Jose',
            ]);

            $addresses['barangay_id'] = $barangay->id;

        }
        
        if ($region === 'region_10') {
            $region = Region::create([
                'code' => '1000000000',
                'correspondence_code' => '100000000',
                'name' => 'Northern Mindanao (Region X)',
                'slug' => 'region_10',
            ]);

            $addresses['region_id'] = $region->id;

            $province = $region->provinces()->create([
                'code' => '1004300000',
                'correspondence_code' => '104300000',
                'name' => 'Misamis Oriental',
            ]);

            $addresses['province_id'] = $province->id;
            $query['province_name'] = $province->name;

            $city = $province->cities()->create([
                'code' => '1004305000',
                'correspondence_code' => '104305000',
                'name' => 'City of El Salvador',
            ]);

            $addresses['city_id'] = $city->id;
            $query['city_name'] = $city->name;

            $barangay = $city->barangays()->create([
                'code' => '1004305009',
                'correspondence_code' => '104305009',
                'name' => 'Poblacion',
            ]);

            $addresses['barangay_id'] = $barangay->id;

        }
        
        if ($region === 'region_11') {
            $region = Region::create([
                'code' => '1100000000',
                'correspondence_code' => '110000000',
                'name' => 'Davao Region (Region XI)',
                'slug' => 'region_11',
            ]);

            $addresses['region_id'] = $region->id;

            $province = $region->provinces()->create([
                'code' => '1102300000',
                'correspondence_code' => '112300000',
                'name' => 'Davao del Norte',
            ]);

            $addresses['province_id'] = $province->id;
            $query['province_name'] = $province->name;

            $city = $province->cities()->create([
                'code' => '1102319000',
                'correspondence_code' => '112319000',
                'name' => 'City of Tagum',
            ]);

            $addresses['city_id'] = $city->id;
            $query['city_name'] = $city->name;

            $barangay = $city->barangays()->create([
                'code' => '1102319013',
                'correspondence_code' => '112319013',
                'name' => 'Magugpo Poblacion',
            ]);

            $addresses['barangay_id'] = $barangay->id;
        }

        $addressQuery = array_filter([
            $query['street_address'],
            $query['city_name'],
            $query['province_name'],
            'Philippines'
        ]);

        $fullAddress = implode(', ', $addressQuery);

        $response = Http::withHeaders([
            'User-Agent' => 'EcommercePortfolioApp/1.0' // Required by Nominatim policy
        ])->get('https://nominatim.openstreetmap.org/search', [
            'q' => $fullAddress,
            'format' => 'json',
            'limit' => 1,
        ]);

        if ($response->successful() && !empty($response->json())) {
            $data = $response->json()[0];
            $addresses['latitude'] = (float) $data['lat'];
            $addresses['longitude'] = (float) $data['lon'];
        }

        return $addresses;
    }
    // public static function luzon($entity = 'customer'): self
    // {
    //     if ($entity === 'customer') {
    //         // 1. Fetch or create the region
    //         $region = Region::firstOrCreate(
    //             ['code' => '0300000000'], // Search by unique key
    //             [
    //                 'correspondence_code' => '030000000',
    //                 'name' => 'Central Luzon (Region III)',
    //                 'slug' => 'region_3',
    //             ]
    //         );

    //         self::$addresses['region_id'] = $region->id;

    //         // 2. Fetch or create the province related to this region
    //         $province = $region->provinces()->firstOrCreate(
    //             ['code' => '0314000000'],
    //             [
    //                 'correspondence_code' => '031400000',
    //                 'name' => 'Bulacan',
    //             ]
    //         );

    //         self::$addresses['province_id'] = $province->id;

    //         // 3. Fetch or create the city
    //         $city = $province->cities()->firstOrCreate(
    //             ['code' => '0314220000'],
    //             [
    //                 'correspondence_code' => '031422000',
    //                 'name' => 'City of San Jose del Monte',
    //             ]
    //         );

    //         self::$addresses['city_id'] = $city->id;

    //         // 4. Fetch or create the barangay
    //         $barangay = $city->barangays()->firstOrCreate(
    //             ['code' => '0314220220'],
    //             [
    //                 'correspondence_code' => '031422022',
    //                 'name' => 'Tungkong Mangga',
    //             ]
    //         );

    //         self::$addresses['barangay_id'] = $barangay->id;
            
    //         self::$addresses['street_address'] = 'Garnet Street, Pleasant Hills, San Manuel';
    //         self::$addresses['latitude'] = '8.4860705';
    //         self::$addresses['longitude'] = '124.656805';
    //         self::$addresses['zip_code'] = '3023';

    //     } else if ($entity === 'vendor') {
    //         // Uses the exact same firstOrCreate checks so it fetches the records created above
    //         $region = Region::firstOrCreate(
    //             ['code' => '0300000000'],
    //             [
    //                 'correspondence_code' => '030000000',
    //                 'name' => 'Central Luzon (Region III)',
    //                 'slug' => 'region_3',
    //             ]
    //         );
    //         self::$addresses['region_id'] = $region->id;

    //         $province = $region->provinces()->firstOrCreate(
    //             ['code' => '0314000000'],
    //             [
    //                 'correspondence_code' => '031400000',
    //                 'name' => 'Bulacan',
    //             ]
    //         );
    //         self::$addresses['province_id'] = $province->id;

    //         $city = $province->cities()->firstOrCreate(
    //             ['code' => '0314220000'],
    //             [
    //                 'correspondence_code' => '031422000',
    //                 'name' => 'City of San Jose del Monte',
    //             ]
    //         );
    //         self::$addresses['city_id'] = $city->id;

    //         $barangay = $city->barangays()->firstOrCreate(
    //             ['code' => '0314220220'],
    //             [
    //                 'correspondence_code' => '031422022',
    //                 'name' => 'Tungkong Mangga',
    //             ]
    //         );
    //         self::$addresses['barangay_id'] = $barangay->id;

    //         self::$addresses['street_address'] = 'B7 L26 Everlasting Street';
    //         self::$addresses['latitude'] = '14.8101978';
    //         self::$addresses['longitude'] = '121.0474088';
    //         self::$addresses['zip_code'] = '3023';
    //     }

    //     return new static();
    // }

    // public static function visayas(): self
    // {
    //     $region = Region::factory()->create([
    //         'code' => '0600000000',
    //         'correspondence_code' => '060000000',
    //         'name' => 'Region VI (Western Visayas)',
    //         'slug' => 'region_6',
    //     ]);

    //     self::$addresses['region_id'] = $region->id;

    //     $province = $region->provinces()->create([
    //         'code' => '0645000000',
    //         'correspondence_code' => '064500000',
    //         'name' => 'Negros Occidental',
    //     ]);

    //     self::$addresses['province_id'] = $province->id;

    //     $city = $province->cities()->create([
    //         'code' => '0645010000',
    //         'correspondence_code' => '064501000',
    //         'name' => 'Bacolod City',
    //     ]);

    //     self::$addresses['city_id'] = $city->id;

    //     $barangay = $city->barangays()->create([
    //         'code' => '0645010050',
    //         'correspondence_code' => '064501005',
    //         'name' => 'Barangay 5 (Poblacion)',
    //     ]);

    //     self::$addresses['barangay_id'] = $barangay->id;

    //     self::$addresses['street_address'] = '';

    //     self::$addresses['latitude'] = '10.6428793';
    //     self::$addresses['longitude'] = '122.9302116';

    //     self::$addresses['zip_code'] = '';

    //     return new static();
    // }

    // public static function mindanao(): self
    // {
    //     $region = Region::factory()->create([
    //         'code' => '1000000000',
    //         'correspondence_code' => '100000000',
    //         'name' => 'Region X (Northern Mindanao)',
    //         'slug' => 'region_10',
    //     ]);

    //     self::$addresses['region_id'] = $region->id;

    //     $province = $region->provinces()->create([
    //         'code' => '1043000000',
    //         'correspondence_code' => '104300000',
    //         'name' => 'Misamis Oriental',
    //     ]);

    //     self::$addresses['province_id'] = $province->id;

    //     $city = $province->cities()->create([
    //         'code' => '1043050000',
    //         'correspondence_code' => '104305000',
    //         'name' => 'Cagayan de Oro City',
    //     ]);

    //     self::$addresses['city_id'] = $city->id;

    //     $barangay = $city->barangays()->create([
    //         'code' => '1043050110',
    //         'correspondence_code' => '104305011',
    //         'name' => 'Macasandig',
    //     ]);

    //     self::$addresses['barangay_id'] = $barangay->id;

    //     self::$addresses['street_address'] = '';

    //     self::$addresses['latitude'] = '8.4860705';
    //     self::$addresses['longitude'] = '124.6450641';

    //     self::$addresses['zip_code'] = '';

    //     return new static();
    // }

    // protected function fallbackToCity(array $customerAddress)
    // {
    //     $fallbackAddress = "{$customerAddress->city->name}, {$customerAddress->province->name}, Philippines";

    //     $response = Http::withHeaders([
    //         'User-Agent' => 'EcommercePortfolioApp/1.0' // Required by Nominatim policy
    //     ])->get('https://nominatim.openstreetmap.org/search', [
    //         'q' => $fallbackAddress,
    //         'format' => 'json',
    //         'limit' => 1,
    //     ]);

    //     if ($response->successful() && !empty($response->json())) {
    //         $data = $response->json()[0];
    //         $customerAddress->latitude = (float) $data['lat'];
    //         $customerAddress->longitude = (float) $data['lon'];
    //         $customerAddress->save();
    //     }

    //     return null;
    // }

    public static function all(): self
    {
        dd(self::$activeRegion);
        return new static();
    }

    public function create(): array
    {
        return [
            'region_id'      => self::$activeRegion->id,
            'province_id'    => self::$activeProvince->id,
            'city_id'        => self::$activeCity->id,
            'barangay_id'    => self::$activeBarangay->id,
            // 'street_address' => self::$addresses['street_address'],
            // 'latitude'       => self::$addresses['latitude'],
            // 'longitude'      => self::$addresses['longitude'],
            // 'zip_code'       => self::$addresses['zip_code'],
        ];
        // return [
        //     'region_id'      => self::$addresses['region_id'],
        //     'province_id'    => self::$addresses['province_id'],
        //     'city_id'        => self::$addresses['city_id'],
        //     'barangay_id'    => self::$addresses['barangay_id'],
        //     'street_address' => self::$addresses['street_address'],
        //     'latitude'       => self::$addresses['latitude'],
        //     'longitude'      => self::$addresses['longitude'],
        //     'zip_code'       => self::$addresses['zip_code'],
        // ];
    }
}