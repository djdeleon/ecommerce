import { API_ROUTES } from "#commons/constants/routes.js";
import { createFacility } from "#factory";
import { BoundaryType, Facility, FacilityType, ShipmentStatus } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createClient } from "../factory/client.factory.js";
import { generateTrackingNumbers } from "../../src/modules/tracking-numbers/service.js";
import { calculateDigest, decryptSecret } from "#commons/utils/crypto.js";
import { createDistributionCenter, createLocalBranch, createMegaGateway, createSector } from "../factory/facility.factory.js";
import { seedGeographicAreas, seedGeographyBoundaries, seedGeoJSONData } from "#commons/utils/spatial-seeder.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

describe('Parcel Domain', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
    await seedGeographicAreas(app.prisma);
  }, 60000)

  const expectedKey = process.env.LOGISTICS_KEY

  test.only('a Laravel vendor can book a parcel', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    const client = await createClient({
      apiKey: 'apk_99faa7f6c27c0c382d94182c5f3727d9',
      apiSecret: '6fbe5fdbbf51a044cec3a396:f2a52895dd162b6c9c4832a86bf3c360:d963793640fd69acdcde62bf362369eafd24aeb712e68730eba681b3e94a8b3b3c9d74727fe2581ba55e6f021151ed453a4cf50b7a255a77064e1da7fc6aadd2'
    })
    // console.log(client)

    const trackingNumbers = await generateTrackingNumbers({
      clientId: client.id,
      size: 5
    })
    const trackingNumber = trackingNumbers[0].trackingNumber

    const regions = await app.prisma.region.findMany({ take: 2 })
    const provinces = await app.prisma.province.findMany({ take: 2 })
    const cities = await app.prisma.city.findMany({ take: 2 })
    const barangays = await app.prisma.barangay.findMany({ take: 2 })

    console.log(regions)
    console.log(provinces)
    console.log(cities)
    console.log(barangays)

    await app.prisma.megaGateway.createMany({
      data: [
        { id: 1, name: "NCR Sorting Gateway Clark", coverageCode: "NCR", code: "GW-NCR-01", address: "123 ABC St." },
        { id: 2, name: "North Luzon Expressway Gateway Bocaue", coverageCode: "R03", code: "GW-NL-01", address: "123 ABC St." },
        { id: 3, name: "South Luzon Expressway Gateway Calamba", coverageCode: "R4A", code: "GW-SL-01", address: "123 ABC St." },
      ],
      skipDuplicates: true
    });

    await app.prisma.distributionCenter.createMany({
      data: [
        { id: 1, name: "Caloocan District Central DC", coverageCode: "NCR-CAL", code: "DC-NCR-CAL-01", megaGatewayId: 1, address: "456 DEF St." },
        { id: 2, name: "Bulacan Provincial DC (Marilao)", coverageCode: "R03-BUL", code: "DC-R03-BUL-01", megaGatewayId: 2, address: "456 DEF St." },
        { id: 3, name: "Cavite Provincial DC (Dasmariñas)", coverageCode: "R4A-CAV", code: "DC-R4A-CAV-01", megaGatewayId: 3, address: "456 DEF St." },
        { id: 4, name: "Urdaneta DC", coverageCode: "R01-PAN", code: "DC-01-PAN-01", megaGatewayId: 1, address: "456 DEF St." },
      ],
      skipDuplicates: true
    });

    // await app.prisma.localBranch.createMany({
    //   data: [
    //     {
    //       id: 1,
    //       name: "Caloocan South Branch Delivery Hub",
    //       coverageCode: "NCR-CAL-CAL",
    //       code: "BR-CAL-01",
    //       distributionCenterId: 1,
    //       address: "789 GHI St."
    //     },
    //     {
    //       id: 2,
    //       name: "San Jose Del Monte Delivery Hub",
    //       coverageCode: "R03-BUL-SJD",
    //       code: "BR-BUL-SJD-01",
    //       distributionCenterId: 2,
    //       address: "789 GHI St."
    //     },
    //     {
    //       id: 3,
    //       name: "Dasmariñas City Delivery Hub",
    //       coverageCode: "R4A-CAV-DAS",
    //       code: "BR-CAV-DAS-01",
    //       distributionCenterId: 3,
    //       address: "789 GHI St."
    //     }
    //   ],
    //   skipDuplicates: true
    // });

    const megaGateways = await app.prisma.megaGateway.findMany()
    const distributionCenters = await app.prisma.distributionCenter.findMany()
    const localBranches = await app.prisma.localBranch.findMany()

    console.log(megaGateways)
    console.log(distributionCenters)
    console.log(localBranches)

    /**
     * PROCEED TO THE FIRST-MILE
     * - Focus first on the Seller's Location
     * - - Get the barangay psgc code (this will be passed by Laravel - I am going to require psgc code for modern Geolocation)
     * - - - what if the barangay is not covered by the service? who is going to pick up the orders?
     * - - - - I think this is where we fallback to coordinates
     * - - We need to know the Local Branch that is serving the Seller's location area
     * - - - remember that the Local Branch has a Polygon
     * - - - - THIS IS THE FIRST CONDITION, if Seller/Customer's Location Coordinates doesn't have any local branch that will cater them, then failed the booking.
     * - - - - - If we gonna use Coordianates, the Sector Model should store Polygon as well.
     * - - - - - - cos after we find the nearest available local branch, we can look up and look down
     * - - - - - - - look down: the local branch has sectors relationship that we can query, this is where we identify which rider sector is going to pickup the orders
     * - - - - - - - look up: for getting the lineage.
     * 
     * - So for both Seller/Customer's Location we gonna handle two things
     * - 1. Coordinates (modern web)
     * - 2. Barangay PSGC Code 
     * - both are required to the payload
     * 
     * TODO:
     * - since we are now okay with the above plan, 
     * - proceed to building the seeder to build the coordinates adn barangay psgc code for Parcel Creation
     * - - this is still part of Sorting Code Cache and Routing Pipeline Cache
     */

    // REVISION: Do not add polygon on the Local Branch, the Sector dictates the territory for it.
    const sanCarlosBranch = await createLocalBranch(app.prisma, {
      name: "San Carlos Delivery Hub",
      address: "Pangasinan, San Carlos",
      lng: 120.3476767,
      lat: 15.9277316,
      distributionCenterId: 4
    })

    const sectorA = await createSector(app.prisma, {
      code: "R01-PAN-SNC-01",
      localBranchId: sanCarlosBranch.id,
      zone: {
        type: "Polygon",
        coordinates: [
          [
            [
              120.30409324098218,
              15.958397210495892
            ],
            [
              120.28557648500009,
              15.95228737900004
            ],
            [
              120.28075509700011,
              15.94484213000004
            ],
            [
              120.26828207843643,
              15.934159191794594
            ],
            [
              120.24441390400011,
              15.920369924000056
            ],
            [
              120.24744781100003,
              15.90992245600006
            ],
            [
              120.2563294946107,
              15.893409908987213
            ],
            [
              120.27325518900011,
              15.88267908000006
            ],
            [
              120.2801784400001,
              15.870480029000078
            ],
            [
              120.29376016433476,
              15.869492238136615
            ],
            [
              120.30694515200003,
              15.86591431200003
            ],
            [
              120.31844656368108,
              15.872847075252706
            ],
            [
              120.31859288137272,
              15.884933719795917
            ],
            [
              120.3175338983464,
              15.884864091546348
            ],
            [
              120.31805182150667,
              15.885442327604345
            ],
            [
              120.31857269576193,
              15.88708957211666
            ],
            [
              120.31858092624428,
              15.88745442204696
            ],
            [
              120.31828098819962,
              15.88806957663471
            ],
            [
              120.31850886975818,
              15.888375616236459
            ],
            [
              120.32350841447574,
              15.889451751955292
            ],
            [
              120.32814015674536,
              15.891229182838124
            ],
            [
              120.3201150498264,
              15.90360416108281
            ],
            [
              120.32971439621326,
              15.910715039881845
            ],
            [
              120.32982007276897,
              15.910217955145145
            ],
            [
              120.33627529624057,
              15.914593234630345
            ],
            [
              120.32574150472584,
              15.934675287067108
            ],
            [
              120.32271557878899,
              15.93869157596538
            ],
            [
              120.3224825834609,
              15.93820971940787
            ],
            [
              120.32161950915079,
              15.939482253726172
            ],
            [
              120.32011803646454,
              15.93978499938852
            ],
            [
              120.31529633505055,
              15.946472809383907
            ],
            [
              120.31411989300011,
              15.958695808000073
            ],
            [
              120.30625970609199,
              15.953648891420432
            ],
            [
              120.30409324098218,
              15.958397210495892
            ]
          ]
        ]
      }
    })

    const sectorB = await createSector(app.prisma, {
      code: "R01-PAN-SNC-02",
      localBranchId: sanCarlosBranch.id,
      zone: {
        type: "Polygon",
        coordinates: [
          [
            [
              120.32207831101358,
              15.969438181408018
            ],
            [
              120.30403146800998,
              15.962963536993787
            ],
            [
              120.30409749529349,
              15.958082727093716
            ],
            [
              120.30625970609199,
              15.953648891420432
            ],
            [
              120.31411989300011,
              15.958695808000073
            ],
            [
              120.31527623400007,
              15.94650069000005
            ],
            [
              120.32013440775148,
              15.939762292039577
            ],
            [
              120.32161950915079,
              15.939482253726172
            ],
            [
              120.32243358218528,
              15.938286457862102
            ],
            [
              120.32271557878899,
              15.93869157596538
            ],
            [
              120.32595637759925,
              15.934390087906895
            ],
            [
              120.33624424700008,
              15.914604991000033
            ],
            [
              120.34287404849425,
              15.911430967954672
            ],
            [
              120.34023081537892,
              15.907600401326803
            ],
            [
              120.34456664229128,
              15.904755532252006
            ],
            [
              120.34541141251887,
              15.905218012839265
            ],
            [
              120.34759758900009,
              15.910613157000057
            ],
            [
              120.35666097285922,
              15.915208580480147
            ],
            [
              120.35592907477537,
              15.91714979708517
            ],
            [
              120.36852156929407,
              15.917558960267574
            ],
            [
              120.37615319274758,
              15.916026507708127
            ],
            [
              120.38188905978132,
              15.913109091032274
            ],
            [
              120.38434322400008,
              15.912631877000024
            ],
            [
              120.3881452447077,
              15.913577876845588
            ],
            [
              120.39200472308606,
              15.914046621267925
            ],
            [
              120.38826202413512,
              15.931540488406887
            ],
            [
              120.38899873990641,
              15.945872420619724
            ],
            [
              120.38678401627679,
              15.962542536942355
            ],
            [
              120.34102140400012,
              15.96842011900003
            ],
            [
              120.33712052966101,
              15.969447245524249
            ],
            [
              120.32207831101358,
              15.969438181408018
            ]
          ]
        ]
      }
    })

    const sectorC = await createSector(app.prisma, {
      code: "R01-PAN-SNC-03",
      localBranchId: sanCarlosBranch.id,
      zone: {
        type: "Polygon",
        coordinates: [
          [
            [
              120.3919859292503,
              15.91404433870411
            ],
            [
              120.39210875300012,
              15.914112814000077
            ],
            [
              120.39665242400008,
              15.904680659000064
            ],
            [
              120.39490411100007,
              15.891644894000024
            ],
            [
              120.39290506400005,
              15.891472074000035
            ],
            [
              120.38367631241746,
              15.893145745001966
            ],
            [
              120.36821811100003,
              15.878778386000022
            ],
            [
              120.3662262360001,
              15.861526010000034
            ],
            [
              120.33903532800002,
              15.839226475000032
            ],
            [
              120.31290708400002,
              15.839998678000029
            ],
            [
              120.31007447557361,
              15.833626547905912
            ],
            [
              120.2948256730001,
              15.831232249000038
            ],
            [
              120.29541849400005,
              15.846556006000071
            ],
            [
              120.29674236441858,
              15.847710839136187
            ],
            [
              120.29375670229147,
              15.869517524215334
            ],
            [
              120.30694515200003,
              15.86591431200003
            ],
            [
              120.31844656368108,
              15.872847075252706
            ],
            [
              120.31859615716576,
              15.884933935179667
            ],
            [
              120.3175338983464,
              15.884864091546348
            ],
            [
              120.31804976160021,
              15.885435813230508
            ],
            [
              120.31858233609206,
              15.887120059284637
            ],
            [
              120.3185809782572,
              15.887454315371642
            ],
            [
              120.31828098819962,
              15.88806957663471
            ],
            [
              120.31850886975818,
              15.888375616236459
            ],
            [
              120.32363034472507,
              15.889477997044382
            ],
            [
              120.32821673962715,
              15.891258920409008
            ],
            [
              120.3201150498264,
              15.90360416108281
            ],
            [
              120.32971439621326,
              15.910715039881845
            ],
            [
              120.32982007276897,
              15.910217955145145
            ],
            [
              120.33012997540466,
              15.910591989925988
            ],
            [
              120.33068769401591,
              15.911265124435054
            ],
            [
              120.3362420840087,
              15.91460915075287
            ],
            [
              120.34283495113725,
              15.911449685847247
            ],
            [
              120.34023081537892,
              15.907600401326803
            ],
            [
              120.3442241968321,
              15.904874996637874
            ],
            [
              120.34475886135,
              15.904688475349412
            ],
            [
              120.34534512225194,
              15.905054418751764
            ],
            [
              120.34759310804132,
              15.910602098689482
            ],
            [
              120.35664719381703,
              15.91520159406812
            ],
            [
              120.35592907477537,
              15.91714979708517
            ],
            [
              120.3685828238912,
              15.917546660163312
            ],
            [
              120.3761148615133,
              15.916034204733332
            ],
            [
              120.38194992968458,
              15.913097254834941
            ],
            [
              120.38434322400008,
              15.912631877000024
            ],
            [
              120.38811819812739,
              15.91357114725026
            ],
            [
              120.3919859292503,
              15.91404433870411
            ]
          ]
        ]
      }
    })

    const sectorD = await createSector(app.prisma, {
      code: "R01-PAN-CAL-04",
      localBranchId: sanCarlosBranch.id,
      zone: {
        type: "Polygon",
        coordinates: [
          [
            [
              120.32237,
              15.9716165
            ],
            [
              120.31803611357275,
              16.008610139372134
            ],
            [
              120.35261655139743,
              16.025337208237783
            ],
            [
              120.36023527300006,
              16.034818965000056
            ],
            [
              120.37409249575605,
              16.039065186856913
            ],
            [
              120.37980742500008,
              16.02983303800005
            ],
            [
              120.38627515298701,
              16.0222280323575
            ],
            [
              120.38634597358728,
              16.022097069762335
            ],
            [
              120.3862644840001,
              16.012032158000068
            ],
            [
              120.379883844,
              16.005880508000075
            ],
            [
              120.3812057728702,
              15.998766505091899
            ],
            [
              120.38224877200003,
              15.992782780000027
            ],
            [
              120.37815191256558,
              15.991700633847879
            ],
            [
              120.37729671700004,
              15.992815188000066
            ],
            [
              120.36338111400005,
              15.991005443000063
            ],
            [
              120.36343656824222,
              15.987813716688063
            ],
            [
              120.36005494000005,
              15.986920492000024
            ],
            [
              120.3587295530001,
              15.997724779000066
            ],
            [
              120.35537557700002,
              15.98749927700004
            ],
            [
              120.3414060545223,
              15.985755048391928
            ],
            [
              120.3489468570001,
              15.971463350000022
            ],
            [
              120.33437655000012,
              15.970586666000031
            ],
            [
              120.32237,
              15.9716165
            ]
          ]
        ]
      }
    })

    const sectorE = await createSector(app.prisma, {
      code: "R01-PAN-CAL-05",
      localBranchId: sanCarlosBranch.id,
      zone: {
        type: "Polygon",
        coordinates: [
          [
            [
              120.38677263049243,
              15.962543999290734
            ],
            [
              120.39020911600005,
              15.952747079000062
            ],
            [
              120.39993229200002,
              15.950792334000027
            ],
            [
              120.39170013400008,
              15.974043589000075
            ],
            [
              120.37729671700004,
              15.992815188000066
            ],
            [
              120.36338111400005,
              15.991005443000063
            ],
            [
              120.36343655935856,
              15.98781422799664
            ],
            [
              120.36005494000005,
              15.986920492000024
            ],
            [
              120.3587295530001,
              15.997724779000066
            ],
            [
              120.35537557700002,
              15.98749927700004
            ],
            [
              120.3414060545223,
              15.985755048391928
            ],
            [
              120.3489468570001,
              15.971463350000022
            ],
            [
              120.3343713110849,
              15.970587115355842
            ],
            [
              120.34963675936218,
              15.967313594359556
            ],
            [
              120.38677263049243,
              15.962543999290734
            ]
          ]
        ]
      }
    })

    const sanCarlosBranchSectors = await app.prisma.localBranch.findUnique({
      where: { id: sanCarlosBranch.id },
      include: { sectors: true }
    })

    console.log(sanCarlosBranchSectors)

    // Caingal
    const sellerCoordinates = {
      lng: 120.345477,
      lat: 15.9097319
    }

    const [matchingSector] = await app.prisma.$queryRaw<any[]>`
      SELECT id FROM "sectors"
      WHERE ST_Contains(
        "zone", 
        ST_SetSRID(ST_MakePoint(${sellerCoordinates.lng}, ${sellerCoordinates.lat}), 4326)
      );
    `;

    console.log(matchingSector.id)

    // this sector can point to the city if you store the city code as a prefix of the sector's code, and bubble up from there
    const matchingSectorData = await app.prisma.sector.findUniqueOrThrow({
      where: { id: matchingSector.id },
      include: { localBranch: true }
    })

    const firstMileLocalBranch = matchingSector.localBranch

    console.log(matchingSectorData)

    // The Macro Branch Zone (Entire SJDM City)
    // const kaypianBranchPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [
    //     [
    //       [
    //         121.1680136760001,
    //         14.83310651000005
    //       ],
    //       [
    //         121.15052962900006,
    //         14.801784266000027
    //       ],
    //       [
    //         121.13733236200005,
    //         14.803775250000058
    //       ],
    //       [
    //         121.10657054500007,
    //         14.770127148000029
    //       ],
    //       [
    //         121.0914569040001,
    //         14.767226754000035
    //       ],
    //       [
    //         121.055420507,
    //         14.782563240000059
    //       ],
    //       [
    //         121.028329718,
    //         14.781832778000023
    //       ],
    //       [
    //         121.012888857,
    //         14.803602033000061
    //       ],
    //       [
    //         121.02512299600005,
    //         14.81822879400005
    //       ],
    //       [
    //         121.03060976300003,
    //         14.850823265000031
    //       ],
    //       [
    //         121.06561705000001,
    //         14.868571576000022
    //       ],
    //       [
    //         121.08536895700001,
    //         14.847401575000049
    //       ],
    //       [
    //         121.09825754100007,
    //         14.856426861000045
    //       ],
    //       [
    //         121.11241333200007,
    //         14.852993601000037
    //       ],
    //       [
    //         121.12823692900008,
    //         14.844872093000049
    //       ],
    //       [
    //         121.14202500300007,
    //         14.82236043000006
    //       ],
    //       [
    //         121.15405209100004,
    //         14.839274394000029
    //       ],
    //       [
    //         121.1680136760001,
    //         14.83310651000005
    //       ]
    //     ]
    //   ]
    // });
    // const [kaypianBranchZone] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${sanCarlosBranch.id},
    //     ${BoundaryType.BranchZone},
    //     "KYP-BZ",
    //     NULL,
    //     ST_GeomFromGeoJSON(${kaypianBranchPolygon})
    //   )
    //   RETURNING *;
    // `

    process.exit(0)
    // await seedGeoJSONData(app.prisma, '/app/src/assets/geojson/sample-facilities-dynamic-seeding.geojson')

    // const regionProvince = await app.prisma.region.findUnique({
    //   where: { id: 100000000 },
    //   include: { provinces: true }
    // })
    // console.log(regionProvince)

    // const provinceRegion = await app.prisma.province.findUnique({
    //   where: { id: 102800000 },
    //   include: { region: true }
    // })
    // console.log(provinceRegion)

    // await seedGeoJSONData(app.prisma, '/app/src/assets/geojson/sample-facilities-dynamic-seeding.geojson')

    // const megaGateways = await app.prisma.megaGateway.findMany() 
    // const distributionCenters = await app.prisma.distributionCenter.findMany() 
    // const localBranches = await app.prisma.localBranch.findMany() 

    // console.log(megaGateways)
    // console.log(distributionCenters)
    // console.log(localBranches)
    // process.exit(0)

    /**
     * Case 1
     */
    // Root Node (tier 1)
    // const centralGateway = await createFacility({
    //   name: "Marilao Sorting Center",
    //   type: FacilityType.MegaGateway,
    //   sortingCode: "MRL-MG",
    //   address: "Marilao City",
    //   longitude: 120.9484459,
    //   latitude: 14.7576008
    // })

    // console.log({
    //   centralGateway
    // })

    // // Branch Node (tier 2)
    // const sjdmHub = await createFacility({
    //   name: "SJDM Distribution Center",
    //   type: FacilityType.RegionalHub,
    //   sortingCode: "BUL-RH",
    //   address: "San Jose Del Monte, Bulacan",
    //   parentId: centralGateway.id,
    //   longitude: 121.0467399,
    //   latitude: 14.8100738
    // })

    // console.log({
    //   sjdmHub
    // })

    // // Branch Node (tier 3)
    // const kaypianBranch = await createFacility({
    //   name: "Kaypian Delivery Hub",
    //   type: FacilityType.LocalBranch,
    //   sortingCode: "KYN-01",
    //   address: "Kaypian, Bulacan",
    //   parentId: sjdmHub.id,
    //   longitude: 121.06238154,
    //   latitude: 14.8219282
    // })

    // // The Macro Branch Zone (Entire SJDM City)
    // const kaypianBranchPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [
    //     [
    //       [
    //         121.1680136760001,
    //         14.83310651000005
    //       ],
    //       [
    //         121.15052962900006,
    //         14.801784266000027
    //       ],
    //       [
    //         121.13733236200005,
    //         14.803775250000058
    //       ],
    //       [
    //         121.10657054500007,
    //         14.770127148000029
    //       ],
    //       [
    //         121.0914569040001,
    //         14.767226754000035
    //       ],
    //       [
    //         121.055420507,
    //         14.782563240000059
    //       ],
    //       [
    //         121.028329718,
    //         14.781832778000023
    //       ],
    //       [
    //         121.012888857,
    //         14.803602033000061
    //       ],
    //       [
    //         121.02512299600005,
    //         14.81822879400005
    //       ],
    //       [
    //         121.03060976300003,
    //         14.850823265000031
    //       ],
    //       [
    //         121.06561705000001,
    //         14.868571576000022
    //       ],
    //       [
    //         121.08536895700001,
    //         14.847401575000049
    //       ],
    //       [
    //         121.09825754100007,
    //         14.856426861000045
    //       ],
    //       [
    //         121.11241333200007,
    //         14.852993601000037
    //       ],
    //       [
    //         121.12823692900008,
    //         14.844872093000049
    //       ],
    //       [
    //         121.14202500300007,
    //         14.82236043000006
    //       ],
    //       [
    //         121.15405209100004,
    //         14.839274394000029
    //       ],
    //       [
    //         121.1680136760001,
    //         14.83310651000005
    //       ]
    //     ]
    //   ]
    // });
    // const [kaypianBranchZone] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.BranchZone},
    //     "KYP-BZ",
    //     NULL,
    //     ST_GeomFromGeoJSON(${kaypianBranchPolygon})
    //   )
    //   RETURNING *;
    // `

    // const clusterSJDMNorthPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // North SJDM City
    //     [
    //       [
    //         121.06543098796949,
    //         14.868477244588881
    //       ],
    //       [
    //         121.0852756151943,
    //         14.847501618308286
    //       ],
    //       [
    //         121.09811653869646,
    //         14.85632812353465
    //       ],
    //       [
    //         121.11273378229362,
    //         14.852829128938305
    //       ],
    //       [
    //         121.12777942495221,
    //         14.845106908306887
    //       ],
    //       [
    //         121.14202500300007,
    //         14.82236043000006
    //       ],
    //       [
    //         121.1542473691985,
    //         14.839188124906956
    //       ],
    //       [
    //         121.16779968195503,
    //         14.832723144884735
    //       ],
    //       [
    //         121.1595442,
    //         14.8181538
    //       ],
    //       [
    //         121.1184474461339,
    //         14.818875270012782
    //       ],
    //       [
    //         121.07092539239054,
    //         14.824979859514452
    //       ],
    //       [
    //         121.03289466253382,
    //         14.851772812690472
    //       ],
    //       [
    //         121.06543098796949,
    //         14.868477244588881
    //       ]
    //     ]
    //   ]
    // });
    // const [clusterSJDMNorth] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.ClusterZone},
    //     "KYP-NTH-CZ",
    //     ${kaypianBranchZone.id},
    //     ST_GeomFromGeoJSON(${clusterSJDMNorthPolygon})
    //   )
    //   RETURNING *;
    // `

    // const sector01SJDMNorthPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Sector 01 North SJDM City
    //     [
    //       [
    //         121.07278107113355,
    //         14.860708260277207
    //       ],
    //       [
    //         121.06579038291919,
    //         14.828597514732811
    //       ],
    //       [
    //         121.03257705900279,
    //         14.851611443701481
    //       ],
    //       [
    //         121.06543098796949,
    //         14.868477244588881
    //       ],
    //       [
    //         121.07278107113355,
    //         14.860708260277207
    //       ]
    //     ]
    //   ]
    // });
    // await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.SectorZone},
    //     "01",
    //     ${clusterSJDMNorth.id},
    //     ST_GeomFromGeoJSON(${sector01SJDMNorthPolygon})
    //   )
    //   RETURNING *;
    // `

    // const sector02SJDMNorthPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Sector 02 North SJDM City
    //     [
    //       [
    //         121.07262406109002,
    //         14.860874218748382
    //       ],
    //       [
    //         121.06572724198868,
    //         14.828641265875975
    //       ],
    //       [
    //         121.0707669641401,
    //         14.825091473483248
    //       ],
    //       [
    //         121.10852806824383,
    //         14.820206450580192
    //       ],
    //       [
    //         121.11084598191611,
    //         14.853281020108891
    //       ],
    //       [
    //         121.0980474673318,
    //         14.85628064573751
    //       ],
    //       [
    //         121.08537621691276,
    //         14.847570769222047
    //       ],
    //       [
    //         121.07262406109002,
    //         14.860874218748382
    //       ]
    //     ]
    //   ]
    // });
    // await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.SectorZone},
    //     "02",
    //     ${clusterSJDMNorth.id},
    //     ST_GeomFromGeoJSON(${sector02SJDMNorthPolygon})
    //   )
    //   RETURNING *;
    // `

    // const sector03SJDMNorthPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Sector 03 North SJDM City
    //     [
    //       [
    //         121.11057732813104,
    //         14.853343985289234
    //       ],
    //       [
    //         121.11084598191611,
    //         14.853281020108891
    //       ],
    //       [
    //         121.12787591754031,
    //         14.844952834772304
    //       ],
    //       [
    //         121.1419438151391,
    //         14.822490065871067
    //       ],
    //       [
    //         121.15402303886806,
    //         14.838879267988597
    //       ],
    //       [
    //         121.16758393308965,
    //         14.832826065480624
    //       ],
    //       [
    //         121.1595442,
    //         14.8181538
    //       ],
    //       [
    //         121.11868815678774,
    //         14.818892075208705
    //       ],
    //       [
    //         121.10854846619492,
    //         14.820497511226412
    //       ],
    //       [
    //         121.11057732813104,
    //         14.853343985289234
    //       ]
    //     ]
    //   ]
    // });
    // await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.SectorZone},
    //     "03",
    //     ${clusterSJDMNorth.id},
    //     ST_GeomFromGeoJSON(${sector03SJDMNorthPolygon})
    //   )
    //   RETURNING *;
    // `

    // const clusterSJDMCentralPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Central SJDM City
    //     [
    //       [
    //         121.03289466253382,
    //         14.851772812690472
    //       ],
    //       [
    //         121.03057085420173,
    //         14.85059212493191
    //       ],
    //       [
    //         121.02517767436726,
    //         14.818553614145383
    //       ],
    //       [
    //         121.0225012,
    //         14.8157537
    //       ],
    //       [
    //         121.06887848436145,
    //         14.800947099792111
    //       ],
    //       [
    //         121.1099905,
    //         14.7740394
    //       ],
    //       [
    //         121.13723358383773,
    //         14.80366720379196
    //       ],
    //       [
    //         121.14992495329696,
    //         14.801875489406365
    //       ],
    //       [
    //         121.1595442,
    //         14.8181538
    //       ],
    //       [
    //         121.11887625048537,
    //         14.818867742180245
    //       ],
    //       [
    //         121.0707669641401,
    //         14.825091473483248
    //       ],
    //       [
    //         121.03289466253382,
    //         14.851772812690472
    //       ]
    //     ]
    //   ]
    // });
    // const [clusterSJDMCentral] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.ClusterZone},
    //     "KYP-CTL-CZ",
    //     ${kaypianBranchZone.id},
    //     ST_GeomFromGeoJSON(${clusterSJDMCentralPolygon})
    //   )
    //   RETURNING *;
    // `

    // const sector01SJDMCentralPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Sector 01 Central SJDM City
    //     [
    //       [
    //         121.03257705900279,
    //         14.851611443701481
    //       ],
    //       [
    //         121.03057085420173,
    //         14.85059212493191
    //       ],
    //       [
    //         121.0251086,
    //         14.8183097
    //       ],
    //       [
    //         121.0225012,
    //         14.8157537
    //       ],
    //       [
    //         121.04479447103716,
    //         14.808636259724693
    //       ],
    //       [
    //         121.06338513187231,
    //         14.83026414336908
    //       ],
    //       [
    //         121.03257705900279,
    //         14.851611443701481
    //       ]
    //     ]
    //   ]
    // });
    // await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.SectorZone},
    //     "01",
    //     ${clusterSJDMCentral.id},
    //     ST_GeomFromGeoJSON(${sector01SJDMCentralPolygon})
    //   )
    //   RETURNING *;
    // `

    // const sector02SJDMCentralPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Sector 02 Central SJDM City
    //     [
    //       [
    //         121.0225012,
    //         14.8157537
    //       ],
    //       [
    //         121.012888857,
    //         14.803602033000061
    //       ],
    //       [
    //         121.028329718,
    //         14.781832778000023
    //       ],
    //       [
    //         121.05510112071669,
    //         14.782554628233775
    //       ],
    //       [
    //         121.09120679452646,
    //         14.767333196396061
    //       ],
    //       [
    //         121.10554905907955,
    //         14.769931119019656
    //       ],
    //       [
    //         121.10984560568355,
    //         14.774134232926773
    //       ],
    //       [
    //         121.06853454033921,
    //         14.801056908757886
    //       ],
    //       [
    //         121.0225012,
    //         14.8157537
    //       ]
    //     ]
    //   ]
    // });
    // await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.SectorZone},
    //     "02",
    //     ${clusterSJDMCentral.id},
    //     ST_GeomFromGeoJSON(${sector02SJDMCentralPolygon})
    //   )
    //   RETURNING *;
    // `

    // const sector03SJDMCentralPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Sector 03 Central SJDM City
    //     [
    //       [
    //         121.0862836,
    //         14.7895118
    //       ],
    //       [
    //         121.110066,
    //         14.7739736
    //       ],
    //       [
    //         121.13735702516237,
    //         14.80364977686275
    //       ],
    //       [
    //         121.15054417188524,
    //         14.801810319224334
    //       ],
    //       [
    //         121.159631,
    //         14.8181387
    //       ],
    //       [
    //         121.11872337692763,
    //         14.818891438775166
    //       ],
    //       [
    //         121.114948,
    //         14.8193125
    //       ],
    //       [
    //         121.0862836,
    //         14.7895118
    //       ]
    //     ]
    //   ]
    // });
    // await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.SectorZone},
    //     "03",
    //     ${clusterSJDMCentral.id},
    //     ST_GeomFromGeoJSON(${sector03SJDMCentralPolygon})
    //   )
    //   RETURNING *;
    // `

    // const clusterSJDMSouthPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // South SJDM City
    //     [
    //       [
    //         121.0225012,
    //         14.8157537
    //       ],
    //       [
    //         121.01295171844554,
    //         14.80351340796563
    //       ],
    //       [
    //         121.02832628908354,
    //         14.781837612248362
    //       ],
    //       [
    //         121.055275002286,
    //         14.782481323232764
    //       ],
    //       [
    //         121.09120679452646,
    //         14.767333196396061
    //       ],
    //       [
    //         121.10660085524343,
    //         14.770160302158652
    //       ],
    //       [
    //         121.1100158895064,
    //         14.77400633962559
    //       ],
    //       [
    //         121.06960955455321,
    //         14.800461558612557
    //       ],
    //       [
    //         121.0225012,
    //         14.8157537
    //       ]
    //     ]
    //   ]
    // });
    // const [clusterSJDMSouth] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.ClusterZone},
    //     "KYP-STH-CZ",
    //     ${kaypianBranchZone.id},
    //     ST_GeomFromGeoJSON(${clusterSJDMSouthPolygon})
    //   )
    //   RETURNING *;
    // `

    // const sector01SJDMSouthPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Sector 01 South SJDM City
    //     [
    //       [
    //         121.02241247598154,
    //         14.815639975721872
    //       ],
    //       [
    //         121.01295171844554,
    //         14.80351340796563
    //       ],
    //       [
    //         121.02832628908354,
    //         14.781837612248362
    //       ],
    //       [
    //         121.04042505481803,
    //         14.782126609661429
    //       ],
    //       [
    //         121.04155327163551,
    //         14.809569086337794
    //       ],
    //       [
    //         121.02241247598154,
    //         14.815639975721872
    //       ]
    //     ]
    //   ]
    // });
    // await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.SectorZone},
    //     "01",
    //     ${clusterSJDMSouth.id},
    //     ST_GeomFromGeoJSON(${sector01SJDMSouthPolygon})
    //   )
    //   RETURNING *;
    // `

    // const sector02SJDMSouthPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Sector 02 South SJDM City
    //     [
    //       [
    //         121.04155327163551,
    //         14.809569086337794
    //       ],
    //       [
    //         121.04043238594579,
    //         14.782304930263898
    //       ],
    //       [
    //         121.05528972615888,
    //         14.782475115941672
    //       ],
    //       [
    //         121.07145579474732,
    //         14.775659823907537
    //       ],
    //       [
    //         121.0765913744855,
    //         14.79589035522452
    //       ],
    //       [
    //         121.06942999182334,
    //         14.800519847607772
    //       ],
    //       [
    //         121.04155327163551,
    //         14.809569086337794
    //       ]
    //     ]
    //   ]
    // });
    // await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.SectorZone},
    //     "02",
    //     ${clusterSJDMSouth.id},
    //     ST_GeomFromGeoJSON(${sector02SJDMSouthPolygon})
    //   )
    //   RETURNING *;
    // `

    // const sector03SJDMSouthPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [ // Sector 03 South SJDM City
    //     [
    //       [
    //         121.07652680454622,
    //         14.79563599559125
    //       ],
    //       [
    //         121.07139979198737,
    //         14.775683433553981
    //       ],
    //       [
    //         121.09126499366796,
    //         14.767343884617405
    //       ],
    //       [
    //         121.10660085524343,
    //         14.770160302158652
    //       ],
    //       [
    //         121.10994567935398,
    //         14.773927268419875
    //       ],
    //       [
    //         121.07652680454622,
    //         14.79563599559125
    //       ]
    //     ]
    //   ]
    // });
    // await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${kaypianBranch.id},
    //     ${BoundaryType.SectorZone},
    //     "03",
    //     ${clusterSJDMSouth.id},
    //     ST_GeomFromGeoJSON(${sector03SJDMSouthPolygon})
    //   )
    //   RETURNING *;
    // `

    // console.log({
    //   kaypianBranch
    // })

    // Muzon Regional Hub is a hybrid hub acting as Delivery Hub as well to cover Muzon Barangays

    // DO THE RIDER/COURIER ASSIGNMENT HERE FOR THE DESTINATION BOUNDARY

    // Branch Node (tier 2)
    // const caloocanHub = await createFacility({
    //   name: "Caloocan Distribution Center",
    //   type: FacilityType.RegionalHub,
    //   sortingCode: "CLN-RH",
    //   address: "Caloocan, Metro Manila",
    //   parentId: centralGateway.id,
    //   longitude: 120.995979,
    //   latitude: 14.6496587
    // })

    // console.log({
    //   caloocanHub
    // })

    // // Branch Node (tier 3)
    // const qcBranch = await createFacility({
    //   name: "Quezon City Delivery Hub",
    //   type: FacilityType.LocalBranch,
    //   sortingCode: "QZN-01",
    //   address: "Quezon City, Metro Manila",
    //   parentId: caloocanHub.id,
    //   longitude: 121.048687,
    //   latitude: 14.6510811
    // })
    // const qcBranchPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [
    //     [
    //       [
    //         120.9841094,
    //         14.5624805
    //       ],
    //       [
    //         121.0383272800022,
    //         14.556842779721467
    //       ],
    //       [
    //         121.1078211,
    //         14.5795852
    //       ],
    //       [
    //         121.10409330187632,
    //         14.59359003813978
    //       ],
    //       [
    //         121.10996109254046,
    //         14.592431912788914
    //       ],
    //       [
    //         121.10187866500007,
    //         14.620657343000062
    //       ],
    //       [
    //         121.10853608200011,
    //         14.636495850000074
    //       ],
    //       [
    //         121.12903522714268,
    //         14.634436665824285
    //       ],
    //       [
    //         121.13465444939033,
    //         14.654980358382991
    //       ],
    //       [
    //         121.13107957900002,
    //         14.667950382000072
    //       ],
    //       [
    //         121.1067630428171,
    //         14.675752272260084
    //       ],
    //       [
    //         121.11157953923843,
    //         14.69581841704392
    //       ],
    //       [
    //         121.12004824514857,
    //         14.698731995062111
    //       ],
    //       [
    //         121.11599242800003,
    //         14.709234545000072
    //       ],
    //       [
    //         121.12365457738574,
    //         14.707364403657564
    //       ],
    //       [
    //         121.13137552894861,
    //         14.723415988714855
    //       ],
    //       [
    //         121.11805757700006,
    //         14.729549361000068
    //       ],
    //       [
    //         121.11780633624237,
    //         14.746233260723812
    //       ],
    //       [
    //         121.13483406520267,
    //         14.776485751262804
    //       ],
    //       [
    //         121.12091808438402,
    //         14.77579867968816
    //       ],
    //       [
    //         121.10476306202695,
    //         14.762700101011376
    //       ],
    //       [
    //         121.03060207100009,
    //         14.784248399000035
    //       ],
    //       [
    //         121.02402399100004,
    //         14.763034879000031
    //       ],
    //       [
    //         121.0025716340001,
    //         14.75341491000006
    //       ],
    //       [
    //         120.98906775853649,
    //         14.757167407361719
    //       ],
    //       [
    //         120.97860381814924,
    //         14.73497849563638
    //       ],
    //       [
    //         120.98300082079027,
    //         14.725425502012511
    //       ],
    //       [
    //         120.95969521966009,
    //         14.719907264641426
    //       ],
    //       [
    //         120.94917662657527,
    //         14.734189661381365
    //       ],
    //       [
    //         120.92673470917975,
    //         14.735830909287108
    //       ],
    //       [
    //         120.95312750500011,
    //         14.694240067000067
    //       ],
    //       [
    //         120.94533687500007,
    //         14.688489937000043
    //       ],
    //       [
    //         120.91841488700004,
    //         14.712960826000028
    //       ],
    //       [
    //         120.90639543200007,
    //         14.700714606000076
    //       ],
    //       [
    //         120.94807706269482,
    //         14.652556320325763
    //       ],
    //       [
    //         120.95448357388601,
    //         14.636833141442004
    //       ],
    //       [
    //         120.947163068,
    //         14.636824238000031
    //       ],
    //       [
    //         120.95787814000005,
    //         14.633648272000073
    //       ],
    //       [
    //         120.94256790800011,
    //         14.63176068200005
    //       ],
    //       [
    //         120.9589317096556,
    //         14.629147610514208
    //       ],
    //       [
    //         120.95361062041202,
    //         14.625779839154529
    //       ],
    //       [
    //         120.96044633465574,
    //         14.600846054001089
    //       ],
    //       [
    //         120.95629576729141,
    //         14.600773126724796
    //       ],
    //       [
    //         120.94398653000007,
    //         14.617861197000025
    //       ],
    //       [
    //         120.94754185592555,
    //         14.608292172340615
    //       ],
    //       [
    //         120.95373529911376,
    //         14.601144936262088
    //       ],
    //       [
    //         120.93279649300007,
    //         14.602898354000047
    //       ],
    //       [
    //         120.9433715880001,
    //         14.594770830000073
    //       ],
    //       [
    //         120.9665435386094,
    //         14.596403190216652
    //       ],
    //       [
    //         120.96719552684509,
    //         14.5952164898043
    //       ],
    //       [
    //         120.95386802400003,
    //         14.591119100000071
    //       ],
    //       [
    //         120.95561495688376,
    //         14.572926586967327
    //       ],
    //       [
    //         120.96308363636219,
    //         14.593760757811287
    //       ],
    //       [
    //         120.96554305304318,
    //         14.587966916376782
    //       ],
    //       [
    //         120.96194519000005,
    //         14.583232450000025
    //       ],
    //       [
    //         120.97279532979277,
    //         14.583088404154111
    //       ],
    //       [
    //         120.9841094,
    //         14.5624805
    //       ]
    //     ]
    //   ]
    // });
    // const [qcBranchZone] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "type",
    //     "code",
    //     "parent_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${qcBranch.id},
    //     ${BoundaryType.BranchZone},
    //     "QC-BZ",
    //     NULL,
    //     ST_GeomFromGeoJSON(${qcBranchPolygon})
    //   )
    //   RETURNING *;
    // `

    // // Branch Node (tier 3)
    // const mandaluyongDeliveryHub = await createFacility({
    //   name: "Mandaluyong Delivery Hub",
    //   type: FacilityType.LocalBranch,
    //   sortingCode: "MDG-01",
    //   address: "Mandaluyong, NCR",
    //   parentId: sjdmHub.id,
    //   longitude: 121.0331957,
    //   latitude: 14.5771869
    // })
    // const mandaluyongBranchPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [
    //     [
    //       [
    //         120.99848164361534,
    //         14.763618502184212
    //       ],
    //       [
    //         120.98283314361534,
    //         14.756830202184211
    //       ],
    //       [
    //         120.98055464361533,
    //         14.747754402184212
    //       ],
    //       [
    //         121.00127984361534,
    //         14.735434002184212
    //       ],
    //       [
    //         121.01237524361534,
    //         14.748627402184212
    //       ],
    //       [
    //         120.99848164361534,
    //         14.763618502184212
    //       ]
    //     ]
    //   ]
    // });
    // const [originBoundary] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${mandaluyongDeliveryHub.id},
    //     ST_GeomFromGeoJSON(${mandaluyongBranchPolygon})
    //   )
    //   RETURNING *;
    // `

    // console.log({
    //   mandaluyongDeliveryHub
    // })

    /**
     * Case 1 (w/ Delivery Sectors)
     */
    // const sjdmDCServiceCoveragePolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [
    //     [
    //       [
    //         121.02526187924202,
    //         14.82152318118088
    //       ],
    //       [
    //         121.02123813543058,
    //         14.81637095466899
    //       ],
    //       [
    //         121.01336976000005,
    //         14.80172258500005
    //       ],
    //       [
    //         121.02418557331049,
    //         14.784967916107192
    //       ],
    //       [
    //         121.028329718,
    //         14.781832778000023
    //       ],
    //       [
    //         121.03493844364738,
    //         14.783792803033451
    //       ],
    //       [
    //         121.05764048040868,
    //         14.783413843056106
    //       ],
    //       [
    //         121.06289775502319,
    //         14.774921924275082
    //       ],
    //       [
    //         121.0666948920001,
    //         14.773695643000053
    //       ],
    //       [
    //         121.0661757,
    //         14.7803853
    //       ],
    //       [
    //         121.0686838,
    //         14.7837579
    //       ],
    //       [
    //         121.06910406161204,
    //         14.79695308369803
    //       ],
    //       [
    //         121.06834000037519,
    //         14.800434638944713
    //       ],
    //       [
    //         121.06757249352022,
    //         14.80874543744992
    //       ],
    //       [
    //         121.06506866071982,
    //         14.813058787405517
    //       ],
    //       [
    //         121.05890574152508,
    //         14.812146496026473
    //       ],
    //       [
    //         121.05641880700011,
    //         14.811132788000066
    //       ],
    //       [
    //         121.05072907200008,
    //         14.811658144000035
    //       ],
    //       [
    //         121.02526187924202,
    //         14.82152318118088
    //       ]
    //     ]
    //   ]
    // });
    // const [sjdmDC] = await app.prisma.$queryRaw<Facility[]>`
    //   INSERT INTO "facilities" (
    //     "name", 
    //     "type", 
    //     "sorting_code", 
    //     "address", 
    //     "service_coverage", 
    //     "location",
    //     "updated_at"
    //   ) VALUES (
    //     'SJDM Distribution Center',
    //     'regional_hub'::facility_type,
    //     'SJDM-DC',
    //     'Muzon Crossroads, San Jose Del Monte City, Bulacan',
    //     ST_GeomFromGeoJSON(${sjdmDCServiceCoveragePolygon}),
    //     ST_SetSRID(ST_MakePoint(121.0347284, 14.8018923), 4326),
    //     NOW()
    //   )
    //   RETURNING *;
    // `;

    // const sjdmDCServiceCoverage01Polygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [
    //     [
    //       [
    //         121.02525545794062,
    //         14.82151495898759
    //       ],
    //       [
    //         121.02130852700009,
    //         14.81650200100006
    //       ],
    //       [
    //         121.01337416342412,
    //         14.801722371282688
    //       ],
    //       [
    //         121.0241643920001,
    //         14.784913935000077
    //       ],
    //       [
    //         121.028329718,
    //         14.781832778000023
    //       ],
    //       [
    //         121.03504305900003,
    //         14.783823830000074
    //       ],
    //       [
    //         121.04173483057514,
    //         14.79586162432721
    //       ],
    //       [
    //         121.04379990000007,
    //         14.80325934800004
    //       ],
    //       [
    //         121.04917797410572,
    //         14.803653975014095
    //       ],
    //       [
    //         121.0505357576552,
    //         14.805456291019832
    //       ],
    //       [
    //         121.05072907200008,
    //         14.811658144000035
    //       ],
    //       [
    //         121.02525545794062,
    //         14.82151495898759
    //       ]
    //     ]
    //   ]
    // });
    // const [sjdmDCServiceCoverage01] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_sectors" (
    //     "facility_id",
    //     "code",
    //     "sector_zone"
    //   ) VALUES (
    //     ${sjdmDC.id},
    //     '01',
    //     ST_GeomFromGeoJSON(${sjdmDCServiceCoverage01Polygon})
    //   )
    //   RETURNING *;
    // `

    // const sjdmDCServiceCoverage02Polygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [
    //     [
    //       [
    //         121.05072868854361,
    //         14.81164584206446
    //       ],
    //       [
    //         121.0505357576552,
    //         14.805456291019832
    //       ],
    //       [
    //         121.04917875177391,
    //         14.803655007287478
    //       ],
    //       [
    //         121.0438034564389,
    //         14.803259608960898
    //       ],
    //       [
    //         121.03504114345542,
    //         14.783823261885193
    //       ],
    //       [
    //         121.0577740330001,
    //         14.78341142000005
    //       ],
    //       [
    //         121.06289722200006,
    //         14.774850638000032
    //       ],
    //       [
    //         121.06669132801264,
    //         14.773814530366852
    //       ],
    //       [
    //         121.06649071833527,
    //         14.780506460849756
    //       ],
    //       [
    //         121.0685260003975,
    //         14.783759217280167
    //       ],
    //       [
    //         121.0690191731952,
    //         14.797330650840998
    //       ],
    //       [
    //         121.06828311800007,
    //         14.800547068000071
    //       ],
    //       [
    //         121.06736892765753,
    //         14.808955708992226
    //       ],
    //       [
    //         121.06509991135265,
    //         14.813133827917706
    //       ],
    //       [
    //         121.0587167860001,
    //         14.812217600000054
    //       ],
    //       [
    //         121.05641880700011,
    //         14.811132788000066
    //       ],
    //       [
    //         121.05072868854361,
    //         14.81164584206446
    //       ]
    //     ]
    //   ]
    // });
    // const [sjdmDCServiceCoverage02] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_sectors" (
    //     "facility_id",
    //     "code",
    //     "sector_zone"
    //   ) VALUES (
    //     ${sjdmDC.id},
    //     '02',
    //     ST_GeomFromGeoJSON(${sjdmDCServiceCoverage02Polygon})
    //   )
    //   RETURNING *;
    // `

    // const sjdmBranchPolygons = await app.prisma.facility.findFirstOrThrow({
    //   where: { id: sjdmDC.id },
    //   include: { deliverySectors: true }
    // })

    // console.log({
    //   sjdmBranchPolygons,
    //   sectors: sjdmBranchPolygons.deliverySectors,
    // })

    /**
     * We can use the Seller's Location and Customer's Location to identify the Common Ancestor Node
     */

    // At this point I can now assign a courier (truck) to collect the parcels for 'pickup' in a specific sector (it can be multiple sectors)
    // // we can add shedule collection
    // we can also assign a courier (rider) to 'deliver' the parcels


    const warehouseLocation = {
      region: 'Central Luzon',
      province: 'Bulacan',
      city: 'City of San Jose Del Monte',
      barangay: 'San Manuel',
      full_address: 'Bulacan, City of San Jose Del Monte, San Manuel, Garnet Street',
      coordinates: {
        longitude: '121.0638427',
        latitude: '14.7919694',
      },
    }

    const customerLocation = {
      region: 'Metro Manila',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Pinyahan',
      full_address: 'Bignay, Quezon City, Metro Manila',
      coordinates: {
        longitude: '120.9987172',
        latitude: '14.7505621',
      },
    }




    // // The branch that will pick up the parcel from the warehouse at Diliman QC
    // const originFacilityAuroraBoulevard = await createFacility({
    //   name: "Aurora Boulevard Local Branch " + randomSuffix,
    //   type: FacilityType.LocalBranch,
    //   longitude: 121.0586245,
    //   latitude: 14.6257263,
    //   // parentId remember a local branch should have a lineage
    // })
    // console.log(originFacilityAuroraBoulevard)
    // const auroraBoulevardPolygon = JSON.stringify({
    //   type: "Polygon",
    //   coordinates: [
    //     [
    //       [
    //         121.0577246,
    //         14.6605988
    //       ],
    //       [
    //         121.0206009,
    //         14.6643069
    //       ],
    //       [
    //         121.0150172,
    //         14.6354914
    //       ],
    //       [
    //         121.0456469,
    //         14.6141561
    //       ],
    //       [
    //         121.0796352,
    //         14.6145305
    //       ],
    //       [
    //         121.0866494,
    //         14.6403207
    //       ],
    //       [
    //         121.0577246,
    //         14.6605988
    //       ]
    //     ]
    //   ]
    // });
    // const [originBoundary] = await app.prisma.$queryRaw<any[]>`
    //   INSERT INTO "delivery_boundaries" (
    //     "facility_id",
    //     "delivery_area"
    //   ) VALUES (
    //     ${originFacilityAuroraBoulevard.id},
    //     ST_GeomFromGeoJSON(${auroraBoulevardPolygon})
    //   )
    //   RETURNING *;
    // `
    // console.log(originBoundary)

    // const destinationFacilityGumaoc = await createFacility({
    //   name: "Gumaoc Local Branch" + randomSuffix,
    //   type: FacilityType.LocalBranch,
    //   longitude: 121.0642626,
    //   latitude: 14.7998613,
    // })
    // console.log(destinationFacilityGumaoc)

    const rawBodyString = JSON.stringify({
      merchant_details: {
        name: 'Gadget Hub PH',
        contact_number: '+639171234567',
        pickup_address: {
          region: 'Central Luzon',
          province: 'Bulacan',
          city: 'City of San Jose Del Monte',
          barangay: 'San Manuel',
          full_address: 'Bulacan, City of San Jose Del Monte, San Manuel, Garnet Street',
          coordinates: {
            longitude: warehouseLocation.coordinates.longitude,
            latitude: warehouseLocation.coordinates.latitude,
          },
        },
      },
      customer_details: {
        name: 'John Doe',
        contact_number: '+639646875348',
        email: 'johndoe@email.com',
        delivery_address: {
          region: 'Metro Manila',
          province: 'Metro Manila',
          city: 'Quezon City',
          barangay: 'Pinyahan',
          full_address: 'Garnet Street, Barangay Pinyahan, Diliman, Quezon City, Metro Manila',
          coordinates: {
            longitude: customerLocation.coordinates.longitude,
            latitude: customerLocation.coordinates.latitude,
          },
        },
      },
      parcel_info: {
        weight_grams: 1200,
        length_cm: 20.0,
        width_cm: 15.0,
        height_cm: 10.0,
        item_description: 'Wireless Mechanical Keyboard',
        declared_value: 1250.00,
      },
      order_info: {
        order_id: '1',
        tracking_number: trackingNumber,
        service_type: 'Standard Delivery',
        payment_method: 'online',
        cod_amount: 1250.00,
        currency: 'PHP',
      },
    })
    const plainTextSecret = decryptSecret(client.apiSecret)
    const signature = calculateDigest(rawBodyString, plainTextSecret)

    // console.log({ rawBodyString })
    // console.log({ signature })

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.parcels.store,
      headers: {
        'x-api-key': client.apiKey,
        'x-signature': signature,
        'content-type': 'application/json',
      },
      body: rawBodyString
    })

    const data = response.json().data
    console.log(response.json())

    const trackingNumberData = await app.prisma.trackingNumberPool.findFirstOrThrow({
      where: { trackingNumber: data.tracking_number },
      include: {
        parcel: true
      }
    })

    expect(trackingNumberData.isAssigned).toBe(true)
    expect(trackingNumberData.clientId).toBe(client.id)

    const parcel = trackingNumberData.parcel
    expect((parcel as any).status).toBe(ShipmentStatus.PendingPickup)

    expect(response.statusCode).toBe(201)
    expect(await app.prisma.parcel.count()).toBe(1)
    expect(await app.prisma.trackingLog.count()).toBe(1)

    const responseWaybill = await app.inject({
      method: 'GET',
      url: API_ROUTES.parcels.waybill(trackingNumberData.trackingNumber)
    })

    console.dir({
      responseWaybill: responseWaybill.body
    })
  }, 60000)

  // test.only('a Laravel vendor can download a waybill', async () => {
  //   const response = app.inject({
  //     method: 'GET',
  //     url: API_ROUTES.parcels.waybill
  //   })
  // })

  // test('a Laravel vendor can set the parcel to ready_for_pickup', async () => {
  //   const parcel = await createParcel()
  //   createTrackingLog(parcel.id)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/ jnt / parcels / ${ parcel.externalOrderId } / ready -for-pickup`,
  //     headers: {
  //       authorization: `Bearer ${ expectedKey } `
  //     },
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.ReadyForPickup)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(2)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  // })

  // test('a ready_for_pickup parcel can be picked up by available courier wtih assigned facility with webhook dispatch', async () => {
  //   const parcel = await createParcel({
  //     externalOrderId: '1'
  //   })
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/ jnt / parcels / ${ parcel.id }/picked-up`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.PickedUp)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(3)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  // })

  // test('a picked_up parcel can be set to in_transit', async () => {
  //   const parcel = await createParcel()
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
  //   await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/in-transit`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.InTransit)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(4)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  //   expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
  // })

  // test('an in_transit parcel can be set to arrived_at_hub', async () => {
  //   const parcel = await createParcel()
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
  //   await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
  //   await createTrackingLog(parcel.id, ShipmentStatus.InTransit)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/arrived-at-hub`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.ArrivedAtHub)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(5)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  //   expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
  //   expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
  // })

  // test('an arrived_at_hub parcel can be set to out_for_delivery', async () => {
  //   const parcel = await createParcel()
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
  //   await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
  //   await createTrackingLog(parcel.id, ShipmentStatus.InTransit)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ArrivedAtHub)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/out-for-delivery`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.OutForDelivery)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(6)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  //   expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
  //   expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
  //   expect(parcelTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
  // })

  // test('an out_for_delivery parcel can be set to delivered', async () => {
  //   const parcel = await createParcel()
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
  //   await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
  //   await createTrackingLog(parcel.id, ShipmentStatus.InTransit)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ArrivedAtHub)
  //   await createTrackingLog(parcel.id, ShipmentStatus.OutForDelivery)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/delivered`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.Delivered)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(7)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  //   expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
  //   expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
  //   expect(parcelTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
  //   expect(parcelTrackingLogs[6].status).toBe(ShipmentStatus.Delivered)
  // })

  // test('a Laravel vendor can set the parcel to rejected', async () => {
  //   const parcel = await createParcel()
  //   createTrackingLog(parcel.id)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/rejected`,
  //     headers: {
  //       authorization: `Bearer ${expectedKey}`
  //     },
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.Rejected)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(2)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.Rejected)
  // })

  // test('a parcel can have a facility', async () => {
  //   const parcel = await createParcel()
  //   const facility = await createFacility()

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/assign-facility`,
  //     headers: {
  //       authorization: `Bearer ${expectedKey}`
  //     },
  //     body: {
  //       facilityId: facility.id
  //     }
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.currentFacility.id).toBe(facility.id)
  // })

  // test('a parcel can have a courier', async () => {
  //   const parcel = await createParcel()
  //   const courier = await createCourier()

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/assign-courier`,
  //     headers: {
  //       authorization: `Bearer ${expectedKey}`
  //     },
  //     body: {
  //       courierId: courier.id
  //     }
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.assignedCourier.id).toBe(courier.id)
  // })
})