import { FacilityType } from "@prisma/client";
import { Type, Static } from "@sinclair/typebox";

export const FACILITY_PATHS = {
  index: '/facilities',
  store: '/facilities',
  assignCourier: '/facilities/:facilityId/assign-courier',
} as const;

export const FacilityTypeEnum = Type.Union([
  Type.Literal('MegaGateway'),
  Type.Literal('DistributionCenter'),
  Type.Literal('LocalBranch'),
]);

export const StoreSchema = {
  url: FACILITY_PATHS.store,
  body: Type.Object({
    name: Type.String({
      minLength: 3,
      maxLength: 100,
      description: "Official name of the logistics facility or hub",
      examples: ["Bulacan Mega Gateway"]
    }),
    type: FacilityTypeEnum,
    address: Type.String({
      minLength: 5,
      description: "Physical street address of the facility"
    }),
    longitude: Type.Number({
      minimum: -180,
      maximum: 180,
      description: "Geographic longitude coordinate",
      examples: [120.9842]
    }),
    latitude: Type.Number({
      minimum: -90,
      maximum: 90,
      description: "Geographic latitude coordinate",
      examples: [14.5995]
    }),
    parentId: Type.Optional(Type.Integer({
      minimum: 1,
      description: "ID of the parent facility in the logistics network hierarchy"
    }))
  }),
  response: {
    201: Type.Object({
      message: Type.String(),
      data: Type.Object({
        id: Type.Number(),
        name: Type.String(),
        type: Type.String(),
        code: Type.String(),
        address: Type.String(),
        parent_id: Type.Union([Type.Number(), Type.Null()]),
      })
    }),
    401: Type.Object({
      error: Type.String()
    })
  }
}

export const IndexSchema = {
  url: FACILITY_PATHS.index,
}

export const AssignSchema = {
  url: FACILITY_PATHS.assignCourier,
  body: Type.Object({
    courierId: Type.Integer({
      minimum: 1,
      description: "ID of the courier being assigned"
    })
  }),
  params: Type.Object({
    facilityId: Type.String({
      pattern: "^[0-9]+$",
      description: "Numeric ID of the facility"
    })
  }),
  response: {
    200: Type.Object({
      message: Type.String(),
      data: Type.Any()
    }),
    400: Type.Object({
      error: Type.String()
    }),
    404: Type.Object({
      error: Type.String()
    })
  }
}

const CreateFacilityDataSchema = Type.Omit(StoreSchema.body, [
  'parentId',
])

export type StoreBody = Static<typeof StoreSchema.body>
export type AssignBody = Static<typeof AssignSchema.body>
export type AssignParams = Static<typeof AssignSchema.params>
export type CreateFacilityData = Static<typeof CreateFacilityDataSchema>