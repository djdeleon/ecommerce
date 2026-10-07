import { compilePath } from "#commons/utils/path-compiler.js";
import { CLIENT_PATHS } from "../../modules/clients/schema.js";
import { COURIER_PATHS } from "../../modules/couriers/schema.js";
import { FACILITY_PATHS } from "../../modules/facilities/schema.js";
import { PARCEL_PATHS } from "../../modules/parcels/schema.js";
import { TRACKING_NUMBER_PATHS } from "../../modules/tracking-numbers/schema.js";
import { USER_PATHS } from "../../modules/users/schemas.js";
import { PHYSICAL_VEHICLE_PATHS } from "../../modules/vehicles/schemas/physical-vehicle.schema.js";
import { VEHICLE_PROFILE_PATHS } from "../../modules/vehicles/schemas/vehicle-profile.schema.js";

export const API_ROUTES = {
  users: {
    register: USER_PATHS.register,
    login: USER_PATHS.login,
  },
  couriers: {
    index: COURIER_PATHS.index,
    store: COURIER_PATHS.store,
  },
  facilities: {
    index: FACILITY_PATHS.index,
    store: FACILITY_PATHS.store,
    assignCourier: (facilityId: string | number) => {
      const staticFullUrl = FACILITY_PATHS.assignCourier

      return compilePath(staticFullUrl, { facilityId })
    }
  },
  clients: {
    index: CLIENT_PATHS.index,
    store: CLIENT_PATHS.store,
  },
  trackingNumbers: {
    index: TRACKING_NUMBER_PATHS.index,
    store: TRACKING_NUMBER_PATHS.store,
  },
  parcels: {
    store: PARCEL_PATHS.store,
    waybill: (trackingNumber: string) => {
      const staticFullUrl = PARCEL_PATHS.waybill

      return compilePath(staticFullUrl, { trackingNumber })
    }
  },
  vehicles: {
    vehicleProfile: {
      store: VEHICLE_PROFILE_PATHS.store,
      update: (vehicleProfileId: string | number) => {
        const staticFullUrl = VEHICLE_PROFILE_PATHS.update
  
        return compilePath(staticFullUrl, { vehicleProfileId })
      },
      delete: (vehicleProfileId: string | number) => {
        const staticFullUrl = VEHICLE_PROFILE_PATHS.delete
  
        return compilePath(staticFullUrl, { vehicleProfileId })
      },
    },
    physicalVehicle: {
      store: PHYSICAL_VEHICLE_PATHS.store,
      update: (physicalVehicleId: string | number) => {
        const staticFullUrl = PHYSICAL_VEHICLE_PATHS.update
  
        return compilePath(staticFullUrl, { physicalVehicleId })
      },
      delete: (physicalVehicleId: string | number) => {
        const staticFullUrl = PHYSICAL_VEHICLE_PATHS.update
  
        return compilePath(staticFullUrl, { physicalVehicleId })
      },
    }
  }
}