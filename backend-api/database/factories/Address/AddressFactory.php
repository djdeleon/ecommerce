<?php

namespace Database\Factories\Address;

use App\Models\Address\Barangay;
use App\Models\Address\City;
use App\Models\Address\Province;
use App\Models\Address\Region;
use Illuminate\Support\Facades\Http;

class AddressFactory
{
    // protected static array $regions = [];
    // protected static Region $activeRegion;
    // protected static array $provinces = [];
    // protected static Province $activeProvince;
    // protected static array $cities = [];
    // protected static City $activeCity;
    // protected static array $barangays = [];
    // protected static Barangay $activeBarangay;
    protected static array $addresses = [];

    // public static function region($slug = 'region_3'): self
    // {
    //     if (! array_key_exists($slug, self::$regions)) {
    //         // LUZON
    //         if ($slug === 'region_3') {
    //             self::$regions[$slug] = Region::create([
    //                 'code' => '0300000000',
    //                 'correspondence_code' => '030000000',
    //                 'name' => 'Central Luzon (Region III)',
    //                 'slug' => $slug,
    //             ]);

    //             $region = self::$regions[$slug];
    //             self::$addresses['region_id'] = $region->id;

    //             // $province = $region->provinces()->create([
    //             //     'code' => '0314000000',
    //             //     'correspondence_code' => '031400000',
    //             //     'name' => 'Bulacan',
    //             // ]);

    //             // self::$addresses['province_id'] = $province->id;

    //             // $city = $province->cities()->create([
    //             //     'code' => '0314220000',
    //             //     'correspondence_code' => '031422000',
    //             //     'name' => 'City of San Jose del Monte',
    //             // ]);

    //             // self::$addresses['city_id'] = $city->id;

    //             // $barangay = $city->barangays()->create([
    //             //     'code' => '0314220220',
    //             //     'correspondence_code' => '031422022',
    //             //     'name' => 'Tungkong Mangga',
    //             // ]);

    //             // self::$addresses['barangay_id'] = $barangay->id;
                
    //             self::$addresses['street_address'] = 'Garnet Street, Pleasant Hills, San Manuel';
    //             self::$addresses['latitude'] = '8.4860705';
    //             self::$addresses['longitude'] = '124.656805';
    //             self::$addresses['zip_code'] = '3023';
    //         }
    
    //         // VISAYAS
    //         if (! array_key_exists($slug, self::$regions)) {
    //             if ($slug === 'region_6') {
    //                 self::$regions[$slug] = Region::create([
    //                     'code' => '0600000000',
    //                     'correspondence_code' => '060000000',
    //                     'name' => 'Region VI (Western Visayas)',
    //                     'slug' => $slug,
    //                 ]);
    //             }
    //         }
    
    //         // MINDANAO
    //         if (! array_key_exists($slug, self::$regions)) {
    //             if ($slug === 'region_10') {
    //                 self::$regions[$slug] = Region::create([
    //                     'code' => '1000000000',
    //                     'correspondence_code' => '100000000',
    //                     'name' => 'Region X (Northern Mindanao)',
    //                     'slug' => 'region_10',
    //                 ]);
    //             }
    //         }
    //     }

    //     self::$activeRegion = self::$regions[$slug];

    //     return new static();
    // }

    // public function province($name = 'bulacan'): self
    // {
    //     if (self::$activeRegion->slug === 'region_3') {
    //         if (! array_key_exists('bulacan', self::$provinces) && $name === 'bulacan') {
    //             self::$provinces[$name] = self::$activeRegion->provinces()->create([
    //                 'code' => '0314000000',
    //                 'correspondence_code' => '031400000',
    //                 'name' => 'Bulacan',
    //             ]);
    //         } else if (! array_key_exists('pampanga', self::$provinces) && $name === 'pampanga') {
    //             self::$provinces[$name] = self::$activeRegion->provinces()->create([
    //                 'code' => '0354000000',
    //                 'correspondence_code' => '035400000',
    //                 'name' => 'Pampanga',
    //             ]);
    //         } else if (! array_key_exists('nueve_ecija', self::$provinces) && $name === 'nueve_ecija') {
    //             self::$provinces[$name] = self::$activeRegion->provinces()->create([
    //                 'code' => '0349000000',
    //                 'correspondence_code' => '034900000',
    //                 'name' => 'Nueva Ecija',
    //             ]);
    //         }
    //     }

    //     self::$activeProvince = self::$provinces[$name];

    //     return new static();
    // }

    // public function city($name = 'san_jose_del_monte'): static
    // {
    //     if (self::$activeRegion->slug === 'region_3' && self::$activeProvince->name === 'Bulacan') {
    //         if (! array_key_exists('malolos', self::$cities) && $name === 'malolos') {
    //             self::$cities[$name] = self::$activeProvince->cities()->create([
    //                 'code' => '0301410000',
    //                 'correspondence_code' => '031410000',
    //                 'name' => 'City of Malolos',
    //             ]);
    //         } else if (! array_key_exists('meycauayan', self::$cities) && $name === 'meycauayan') {
    //             self::$cities[$name] = self::$activeProvince->cities()->create([
    //                 'code' => '0301412000',
    //                 'correspondence_code' => '031412000',
    //                 'name' => 'City of Meycauayan',
    //             ]);
    //         } else if (! array_key_exists('san_jose_del_monte', self::$cities) && $name === 'san_jose_del_monte') {
    //             self::$cities[$name] = self::$activeProvince->cities()->create([
    //                 'code' => '0301420000',
    //                 'correspondence_code' => '031420000',
    //                 'name' => 'City of San Jose del Monte',
    //             ]);
    //         }
    //     }

    //     self::$activeCity = self::$cities[$name];

    //     return new static();
    // }

    // public function barangay($name = 'muzon_proper'): self
    // {
    //     if (self::$activeRegion->slug === 'region_3' && self::$activeProvince->name === 'Bulacan' && self::$activeCity->name = 'City of San Jose del Monte') {
    //         if (! array_key_exists('Muzon Proper', self::$barangays) && $name === 'muzon_proper') {
    //             self::$barangays[$name] = self::$activeCity->barangays()->create([
    //                 'code' => '0301420007',
    //                 'correspondence_code' => '031420007',
    //                 'name' => 'Muzon Proper',
    //             ]);
    //         } else if (! array_key_exists('Muzon Proper', self::$barangays) && $name === 'poblacion') {
    //             self::$barangays[$name] = self::$activeCity->barangays()->create([
    //                 'code' => '0301420008',
    //                 'correspondence_code' => '031420008',
    //                 'name' => 'Poblacion',
    //             ]);
    //         } else if (! array_key_exists('Muzon Proper', self::$barangays) && $name === 'santo_cristo') {
    //             self::$barangays[$name] = self::$activeCity->barangays()->create([
    //                 'code' => '0301420009',
    //                 'correspondence_code' => '031420009',
    //                 'name' => 'Santo Cristo',
    //             ]);
    //         }
    //     }

    //     self::$activeBarangay = self::$barangays[$name];

    //     return new static();
    // }

    public static function luzon($region = 'region_1', $province = 1): array
    {
        $addresses = [];

        if ($region === 'region_1') {
            $region = Region::firstOrCreate([
                'code' => '0100000000',
                'correspondence_code' => '010000000',
                'name' => 'Ilocos Region (Region I)',
                'slug' => 'region_1',
                'zone' => 'metro_manila',
            ]);

            $addresses['region_id'] = $region->id;

            // --- PROVINCE 1: PANGASINAN ---
            if ($province === 1) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0105500000',
                    'correspondence_code' => '015500000',
                    'name' => 'Pangasinan',
                ]);

                $addresses['province_id'] = $provinceModel->id;
                
                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0105518000',
                    'correspondence_code' => '015518000',
                    'name' => 'City of Dagupan',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0105518002',
                    'correspondence_code' => '015518002',
                    'name' => 'Bacayao Sur',
                ]);

                $addresses['street_address'] = 'Bacayao Sur';
                $addresses['latitude'] = 16.0224;
                $addresses['longitude'] = 120.3449;
            }

            // --- PROVINCE 2: ILOCOS NORTE ---
            if ($province === 2) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0102800000',
                    'correspondence_code' => '012800000',
                    'name' => 'Ilocos Norte',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0102812000',
                    'correspondence_code' => '012812000',
                    'name' => 'City of Laoag',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0102812001',
                    'correspondence_code' => '012812001',
                    'name' => 'Barangay No. 1, San Lorenzo (Poblacion)',
                ]);

                $addresses['street_address'] = 'Barangay No. 1, San Lorenzo (Poblacion)';
                $addresses['latitude'] = 18.1974;
                $addresses['longitude'] = 120.5926;
            }

            // --- PROVINCE 3: ILOCOS SUR ---
            if ($province === 3) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0102900000',
                    'correspondence_code' => '012900000',
                    'name' => 'Ilocos Sur',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0102934000',
                    'correspondence_code' => '012934000',
                    'name' => 'City of Vigan',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0102934015',
                    'correspondence_code' => '012934015',
                    'name' => 'Poblacion V',
                ]);

                $addresses['street_address'] = 'Poblacion V';
                $addresses['latitude'] = 17.5747;
                $addresses['longitude'] = 120.3875;
            }

            // Bind common relational data keys safely downstream
            $addresses['city_id'] = $city->id;
            $addresses['barangay_id'] = $barangay->id;
        }

        if ($region === 'region_2') {
            $region = Region::firstOrCreate([
                'code' => '0200000000',
                'correspondence_code' => '020000000',
                'name' => 'Cagayan Valley (Region II)',
                'slug' => 'region_2',
                'zone' => 'north_luzon',
            ]);

            $addresses['region_id'] = $region->id;

            // --- PROVINCE 1: CAGAYAN ---
            if ($province === 1) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0201500000',
                    'correspondence_code' => '021500000',
                    'name' => 'Cagayan',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0201529000',
                    'correspondence_code' => '021529000',
                    'name' => 'City of Tuguegarao',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0201529004',
                    'correspondence_code' => '021529004',
                    'name' => 'Centro 01 (Poblacion)',
                ]);

                $addresses['street_address'] = 'Centro 01 (Poblacion)';
                $addresses['latitude'] = 17.6091;
                $addresses['longitude'] = 121.7284;
            }

            // --- PROVINCE 2: ISABELA ---
            if ($province === 2) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0203100000',
                    'correspondence_code' => '023100000',
                    'name' => 'Isabela',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0203114000',
                    'correspondence_code' => '023114000',
                    'name' => 'City of Santiago',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0203114008',
                    'correspondence_code' => '023114008',
                    'name' => 'Centro East (Poblacion)',
                ]);

                $addresses['street_address'] = 'Centro East (Poblacion)';
                $addresses['latitude'] = 16.6912;
                $addresses['longitude'] = 121.5492;
            }

            // --- PROVINCE 3: NUEVA VIZCAYA ---
            if ($province === 3) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0205000000',
                    'correspondence_code' => '025000000',
                    'name' => 'Nueva Vizcaya',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0205002000',
                    'correspondence_code' => '025002000',
                    'name' => 'Bayombong',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0205002015',
                    'correspondence_code' => '025002015',
                    'name' => 'Poblacion',
                ]);

                $addresses['street_address'] = 'Poblacion';
                $addresses['latitude'] = 16.4842;
                $addresses['longitude'] = 121.1497;
            }

            // Bind common data parameters downstream
            $addresses['city_id'] = $city->id;
            $addresses['barangay_id'] = $barangay->id;
        }

        if ($region === 'region_3') {
            $region = Region::firstOrCreate([
                'code' => '0300000000',
                'correspondence_code' => '030000000',
                'name' => 'Central Luzon (Region III)',
                'slug' => 'region_3',
                'zone' => 'north_luzon',
            ]);

            $addresses['region_id'] = $region->id;

            // --- PROVINCE 1: BULACAN ---
            if ($province === 1) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0301400000',
                    'correspondence_code' => '031400000',
                    'name' => 'Bulacan',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0301420000',
                    'correspondence_code' => '031420000',
                    'name' => 'City of San Jose del Monte',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0301420007',
                    'correspondence_code' => '031420007',
                    'name' => 'Muzon Proper',
                ]);

                $addresses['street_address'] = 'Muzon Proper';
                $addresses['latitude'] = 14.8020;
                $addresses['longitude'] = 121.0347;
            }

            // --- PROVINCE 2: PAMPANGA ---
            if ($province === 2) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0305400000',
                    'correspondence_code' => '035400000',
                    'name' => 'Pampanga',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0305416000',
                    'correspondence_code' => '035416000',
                    'name' => 'City of San Fernando',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0305416027',
                    'correspondence_code' => '035416027',
                    'name' => 'San Jose',
                ]);

                $addresses['street_address'] = 'San Jose';
                $addresses['latitude'] = 15.0315;
                $addresses['longitude'] = 120.6865;
            }

            // --- PROVINCE 3: NUEVA ECIJA ---
            if ($province === 3) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0304900000',
                    'correspondence_code' => '034900000',
                    'name' => 'Nueva Ecija',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0304906000',
                    'correspondence_code' => '034906000',
                    'name' => 'City of Cabanatuan',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0304906068',
                    'correspondence_code' => '034906068',
                    'name' => 'Poblacion Broad',
                ]);

                $addresses['street_address'] = 'Poblacion Broad';
                $addresses['latitude'] = 15.4851;
                $addresses['longitude'] = 120.9734;
            }

            // Bind common data parameters downstream
            $addresses['city_id'] = $city->id;
            $addresses['barangay_id'] = $barangay->id;
        }
        
        return $addresses;
    }

    public static function visayas($region = 'region_6', $province = 1): array
    {
        $addresses = [];

        if ($region === 'region_6') {
            $region = Region::firstOrCreate([
                'code' => '0600000000',
                'correspondence_code' => '060000000',
                'name' => 'Western Visayas (Region VI)',
                'slug' => 'region_6',
                'zone' => 'visayas',
            ]);

            $addresses['region_id'] = $region->id;

            // --- PROVINCE 1: ILOILO ---
            if ($province === 1) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0604500000',
                    'correspondence_code' => '064500000',
                    'name' => 'Iloilo',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0604520000',
                    'correspondence_code' => '064520000',
                    'name' => 'City of Iloilo',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0604520015',
                    'correspondence_code' => '064520015',
                    'name' => 'City Proper (Poblacion)',
                ]);

                $addresses['street_address'] = 'City Proper (Poblacion)';
                $addresses['latitude'] = 10.6952;
                $addresses['longitude'] = 122.5647;
            }

            // --- PROVINCE 2: NEGROS OCCIDENTAL ---
            if ($province === 2) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0604600000',
                    'correspondence_code' => '064600000',
                    'name' => 'Negros Occidental',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                // Bacolod City behaves as a highly urbanized city linked to this province scope
                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0604601000',
                    'correspondence_code' => '064601000',
                    'name' => 'City of Bacolod',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0604601001',
                    'correspondence_code' => '064601001',
                    'name' => 'Barangay 1 (Poblacion)',
                ]);

                $addresses['street_address'] = 'Barangay 1 (Poblacion)';
                $addresses['latitude'] = 10.6764;
                $addresses['longitude'] = 122.9509;
            }

            // --- PROVINCE 3: CAPIZ ---
            if ($province === 3) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0601900000',
                    'correspondence_code' => '061900000',
                    'name' => 'Capiz',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0601914000',
                    'correspondence_code' => '061914000',
                    'name' => 'City of Roxas',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0601914022',
                    'correspondence_code' => '061914022',
                    'name' => 'Poblacion I',
                ]);

                $addresses['street_address'] = 'Poblacion I';
                $addresses['latitude'] = 11.5853;
                $addresses['longitude'] = 122.7533;
            }

            // Bind common data parameters downstream
            $addresses['city_id'] = $city->id;
            $addresses['barangay_id'] = $barangay->id;
        }
        
        if ($region === 'region_7') {
            $region = Region::firstOrCreate([
                'code' => '0700000000',
                'correspondence_code' => '070000000',
                'name' => 'Central Visayas (Region VII)',
                'slug' => 'region_7',
                'zone' => 'visayas',
            ]);

            $addresses['region_id'] = $region->id;

            // --- PROVINCE 1: CEBU ---
            if ($province === 1) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0702200000',
                    'correspondence_code' => '072200000',
                    'name' => 'Cebu',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0703060000',
                    'correspondence_code' => '073060000',
                    'name' => 'City of Cebu',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '070306060', 
                    'correspondence_code' => '073060060',
                    'name' => 'Parian',
                ]);

                $addresses['street_address'] = 'Parian';
                $addresses['latitude'] = 10.2998;
                $addresses['longitude'] = 123.9032;
            }

            // --- PROVINCE 2: BOHOL ---
            if ($province === 2) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0701200000',
                    'correspondence_code' => '071200000',
                    'name' => 'Bohol',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0701242000',
                    'correspondence_code' => '071242000',
                    'name' => 'City of Tagbilaran',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0701242011',
                    'correspondence_code' => '071242011',
                    'name' => 'Poblacion I',
                ]);

                $addresses['street_address'] = 'Poblacion I';
                $addresses['latitude'] = 9.6503;
                $addresses['longitude'] = 123.8561;
            }

            // --- PROVINCE 3: NEGROS ORIENTAL ---
            if ($province === 3) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0704600000',
                    'correspondence_code' => '074600000',
                    'name' => 'Negros Oriental',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0704606000',
                    'correspondence_code' => '074606000',
                    'name' => 'City of Dumaguete',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0704606003',
                    'correspondence_code' => '074606003',
                    'name' => 'Poblacion 1',
                ]);

                $addresses['street_address'] = 'Poblacion 1';
                $addresses['latitude'] = 9.3074;
                $addresses['longitude'] = 123.3082;
            }

            // Bind common data parameters downstream
            $addresses['city_id'] = $city->id;
            $addresses['barangay_id'] = $barangay->id;
        }
        
        if ($region === 'region_8') {
            $region = Region::firstOrCreate([
                'code' => '0800000000',
                'correspondence_code' => '080000000',
                'name' => 'Eastern Visayas (Region VIII)',
                'slug' => 'region_8',
                'zone' => 'visayas',
            ]);

            $addresses['region_id'] = $region->id;

            // --- PROVINCE 1: LEYTE ---
            if ($province === 1) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0803700000',
                    'correspondence_code' => '083700000',
                    'name' => 'Leyte',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0803747000',
                    'correspondence_code' => '083747000',
                    'name' => 'City of Tacloban',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0803747043',
                    'correspondence_code' => '083747043',
                    'name' => 'Barangay 52',
                ]);

                $addresses['street_address'] = 'Barangay 52';
                $addresses['latitude'] = 11.2349;
                $addresses['longitude'] = 125.0046;
            }

            // --- PROVINCE 2: SAMAR (WESTERN SAMAR) ---
            if ($province === 2) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0806000000',
                    'correspondence_code' => '086000000',
                    'name' => 'Samar',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0806003000',
                    'correspondence_code' => '086003000',
                    'name' => 'City of Catbalogan',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0806003038',
                    'correspondence_code' => '086003038',
                    'name' => 'Poblacion 1 (Barangay 1)',
                ]);

                $addresses['street_address'] = 'Poblacion 1 (Barangay 1)';
                $addresses['latitude'] = 11.7744;
                $addresses['longitude'] = 124.8811;
            }

            // --- PROVINCE 3: EASTERN SAMAR ---
            if ($province === 3) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0802600000',
                    'correspondence_code' => '082600000',
                    'name' => 'Eastern Samar',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0802604000',
                    'correspondence_code' => '082604000',
                    'name' => 'City of Borongan',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0802604052',
                    'correspondence_code' => '082604052',
                    'name' => 'Poblacion Barangay 1',
                ]);

                $addresses['street_address'] = 'Poblacion Barangay 1';
                $addresses['latitude'] = 11.6083;
                $addresses['longitude'] = 125.4328;
            }

            // Bind common data parameters downstream
            $addresses['city_id'] = $city->id;
            $addresses['barangay_id'] = $barangay->id;
        }

        return $addresses;
    }

    public static function mindanao($region = 'region_9', $province = 1): array
    {
        $addresses = [];

        if ($region === 'region_9') {
            $region = Region::firstOrCreate([
                'code' => '0900000000',
                'correspondence_code' => '090000000',
                'name' => 'Zamboanga Peninsula (Region IX)',
                'slug' => 'region_9',
                'zone' => 'mindanao',
            ]);

            $addresses['region_id'] = $region->id;

            // --- PROVINCE 1: ZAMBOANGA DEL SUR ---
            if ($province === 1) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0907300000',
                    'correspondence_code' => '097300000',
                    'name' => 'Zamboanga del Sur',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0907322000',
                    'correspondence_code' => '097322000',
                    'name' => 'City of Pagadian',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0907322047',
                    'correspondence_code' => '097322047',
                    'name' => 'San Jose',
                ]);

                $addresses['street_address'] = 'San Jose';
                $addresses['latitude'] = 7.8323;
                $addresses['longitude'] = 123.4359;
            }

            // --- PROVINCE 2: ZAMBOANGA DEL NORTE ---
            if ($province === 2) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0907200000',
                    'correspondence_code' => '097200000',
                    'name' => 'Zamboanga del Norte',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0907202000',
                    'correspondence_code' => '097202000',
                    'name' => 'City of Dipolog',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0907202001',
                    'correspondence_code' => '097202001',
                    'name' => 'Biasong (Poblacion)',
                ]);

                $addresses['street_address'] = 'Biasong (Poblacion)';
                $addresses['latitude'] = 8.5839;
                $addresses['longitude'] = 123.3414;
            }

            // --- PROVINCE 3: ZAMBOANGA SIBUGAY ---
            if ($province === 3) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '0908300000',
                    'correspondence_code' => '098300000',
                    'name' => 'Zamboanga Sibugay',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '0908305000',
                    'correspondence_code' => '098305000',
                    'name' => 'Ipil',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '0908305016',
                    'correspondence_code' => '098305016',
                    'name' => 'Poblacion',
                ]);

                $addresses['street_address'] = 'Poblacion';
                $addresses['latitude'] = 7.7844;
                $addresses['longitude'] = 122.5856;
            }

            // Bind common structural parameters cleanly
            $addresses['city_id'] = $city->id;
            $addresses['barangay_id'] = $barangay->id;
        }
        
        if ($region === 'region_10') {
            $region = Region::firstOrCreate([
                'code' => '1000000000',
                'correspondence_code' => '100000000',
                'name' => 'Northern Mindanao (Region X)',
                'slug' => 'region_10',
                'zone' => 'mindanao',
            ]);

            $addresses['region_id'] = $region->id;

            // --- PROVINCE 1: MISAMIS ORIENTAL ---
            if ($province === 1) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '1004300000',
                    'correspondence_code' => '104300000',
                    'name' => 'Misamis Oriental',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '1004305000',
                    'correspondence_code' => '104305000',
                    'name' => 'City of El Salvador',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '1004305009',
                    'correspondence_code' => '104305009',
                    'name' => 'Poblacion',
                ]);

                $addresses['street_address'] = 'Poblacion';
                $addresses['latitude'] = 8.5592;
                $addresses['longitude'] = 124.5262;
            }

            // --- PROVINCE 2: BUKIDNON ---
            if ($province === 2) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '1001300000',
                    'correspondence_code' => '101300000',
                    'name' => 'Bukidnon',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '1001311000',
                    'correspondence_code' => '101311000',
                    'name' => 'City of Malaybalay',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '1001311033',
                    'correspondence_code' => '101311033',
                    'name' => 'Barangay 1 (Poblacion)',
                ]);

                $addresses['street_address'] = 'Barangay 1 (Poblacion)';
                $addresses['latitude'] = 8.1574;
                $addresses['longitude'] = 125.1275;
            }

            // --- PROVINCE 3: MISAMIS OCCIDENTAL ---
            if ($province === 3) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '1004200000',
                    'correspondence_code' => '104200000',
                    'name' => 'Misamis Occidental',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '1004210000',
                    'correspondence_code' => '104210000',
                    'name' => 'City of Ozamiz',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '1004210052',
                    'correspondence_code' => '104210052',
                    'name' => 'Tinago',
                ]);

                $addresses['street_address'] = 'Tinago';
                $addresses['latitude'] = 8.1432;
                $addresses['longitude'] = 123.8447;
            }

            // Bind common relational data parameters downstream
            $addresses['city_id'] = $city->id;
            $addresses['barangay_id'] = $barangay->id;
        }
        
        if ($region === 'region_11') {
            $region = Region::firstOrCreate([
                'code' => '1100000000',
                'correspondence_code' => '110000000',
                'name' => 'Davao Region (Region XI)',
                'slug' => 'region_11',
                'zone' => 'mindanao',
            ]);

            $addresses['region_id'] = $region->id;

            // --- PROVINCE 1: DAVAO DEL NORTE ---
            if ($province === 1) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '1102300000',
                    'correspondence_code' => '112300000',
                    'name' => 'Davao del Norte',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '1102319000',
                    'correspondence_code' => '112319000',
                    'name' => 'City of Tagum',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '1102319013',
                    'correspondence_code' => '112319013',
                    'name' => 'Magugpo Poblacion',
                ]);

                $addresses['street_address'] = 'Magugpo Poblacion';
                $addresses['latitude'] = 7.4487;
                $addresses['longitude'] = 125.8056;
            }

            // --- PROVINCE 2: DAVAO DEL SUR ---
            if ($province === 2) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '1102400000',
                    'correspondence_code' => '112400000',
                    'name' => 'Davao del Sur',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '1102424000',
                    'correspondence_code' => '112424000',
                    'name' => 'City of Davao',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '1102424036', // 👑 Barangay 3-A (Poblacion Core)
                    'correspondence_code' => '112424036',
                    'name' => 'Barangay 3-A (Poblacion)',
                ]);

                $addresses['street_address'] = 'Barangay 3-A (Poblacion)';
                $addresses['latitude'] = 7.0736;
                $addresses['longitude'] = 125.6124;
            }

            // --- PROVINCE 3: DAVAO DE ORO (FORMERLY COMPOSTELA VALLEY) ---
            if ($province === 3) {
                $provinceModel = $region->provinces()->firstOrCreate([
                    'code' => '1108200000',
                    'correspondence_code' => '118200000',
                    'name' => 'Davao de Oro',
                ]);

                $addresses['province_id'] = $provinceModel->id;

                $city = $provinceModel->cities()->firstOrCreate([
                    'code' => '1108205000',
                    'correspondence_code' => '118205000',
                    'name' => 'Nabunturan',
                ]);

                $barangay = $city->barangays()->firstOrCreate([
                    'code' => '1108205018',
                    'correspondence_code' => '118205018',
                    'name' => 'Poblacion',
                ]);

                $addresses['street_address'] = 'Poblacion';
                $addresses['latitude'] = 7.6047;
                $addresses['longitude'] = 125.9628;
            }

            // Bind common relational data parameters downstream
            $addresses['city_id'] = $city->id;
            $addresses['barangay_id'] = $barangay->id;
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

    // public static function all(): self
    // {
    //     dd(self::$activeRegion);
    //     return new static();
    // }

    // public function create(): array
    // {
    //     return [
    //         'region_id'      => self::$activeRegion->id,
    //         'province_id'    => self::$activeProvince->id,
    //         'city_id'        => self::$activeCity->id,
    //         'barangay_id'    => self::$activeBarangay->id,
    //         // 'street_address' => self::$addresses['street_address'],
    //         // 'latitude'       => self::$addresses['latitude'],
    //         // 'longitude'      => self::$addresses['longitude'],
    //         // 'zip_code'       => self::$addresses['zip_code'],
    //     ];
    //     // return [
    //     //     'region_id'      => self::$addresses['region_id'],
    //     //     'province_id'    => self::$addresses['province_id'],
    //     //     'city_id'        => self::$addresses['city_id'],
    //     //     'barangay_id'    => self::$addresses['barangay_id'],
    //     //     'street_address' => self::$addresses['street_address'],
    //     //     'latitude'       => self::$addresses['latitude'],
    //     //     'longitude'      => self::$addresses['longitude'],
    //     //     'zip_code'       => self::$addresses['zip_code'],
    //     // ];
    // }
}