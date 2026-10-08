import { compilePath } from "#commons/utils/path-compiler.js";
import { CLIENT_PATHS } from "../../modules/clients/schema.js";
import { COURIER_PATHS } from "../../modules/couriers/schema.js";
import { FACILITY_PATHS } from "../../modules/facilities/schema.js";
import { NETWORK_LEG_PATHS } from "../../modules/network-legs/schema.js";
import { PARCEL_PATHS } from "../../modules/parcels/schema.js";
import { SECTOR_PATHS } from "../../modules/sectors/schema.js";
import { FACILITY_CHUTE_PATHS } from "../../modules/sortation/schemas/facility-chute.schema.js";
import { MASTER_BAG_PATHS } from "../../modules/sortation/schemas/master-bag.schema.js";
import { SORTATION_BATCH_PATHS } from "../../modules/sortation/schemas/sorting-batch.schema.js";
import { TRACKING_NUMBER_PATHS } from "../../modules/tracking-numbers/schema.js";
import { USER_PATHS } from "../../modules/users/schemas.js";
import { COURIER_SCHEDULE_PATHS } from "../../modules/vehicles/schemas/courier-schedule.schema.js";
import { DISPATCH_LOG_PATHS } from "../../modules/vehicles/schemas/dispatch-log.schema.js";
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
    },
    courierSchedule: {
      store: COURIER_SCHEDULE_PATHS.store,
      update: (courierScheduleId: string | number) => {
        const staticFullUrl = COURIER_SCHEDULE_PATHS.update
  
        return compilePath(staticFullUrl, { courierScheduleId })
      },
      delete: (courierScheduleId: string | number) => {
        const staticFullUrl = COURIER_SCHEDULE_PATHS.update
  
        return compilePath(staticFullUrl, { courierScheduleId })
      },
    },
    dispatchLog: {
      store: DISPATCH_LOG_PATHS.store,
      update: (dispatchLogId: string | number) => {
        const staticFullUrl = DISPATCH_LOG_PATHS.update
  
        return compilePath(staticFullUrl, { dispatchLogId })
      },
      delete: (dispatchLogId: string | number) => {
        const staticFullUrl = DISPATCH_LOG_PATHS.update
  
        return compilePath(staticFullUrl, { dispatchLogId })
      },
    },
  },
  sectors: {
    store: SECTOR_PATHS.store,
    update: (sectorId: string | number) => {
      const staticFullUrl = SECTOR_PATHS.update

      return compilePath(staticFullUrl, { sectorId })
    },
    delete: (sectorId: string | number) => {
      const staticFullUrl = SECTOR_PATHS.update

      return compilePath(staticFullUrl, { sectorId })
    },
  },
  networkLegs: {
    store: NETWORK_LEG_PATHS.store,
    update: (networkLegId: string | number) => {
      const staticFullUrl = NETWORK_LEG_PATHS.update

      return compilePath(staticFullUrl, { networkLegId })
    },
    delete: (networkLegId: string | number) => {
      const staticFullUrl = NETWORK_LEG_PATHS.update

      return compilePath(staticFullUrl, { networkLegId })
    },
  },
  sortations: {
    sortingBatch: {
      store: SORTATION_BATCH_PATHS.store,
      update: (sortingBatchId: string | number) => {
        const staticFullUrl = SORTATION_BATCH_PATHS.update
  
        return compilePath(staticFullUrl, { sortingBatchId })
      },
      delete: (sortingBatchId: string | number) => {
        const staticFullUrl = SORTATION_BATCH_PATHS.update
  
        return compilePath(staticFullUrl, { sortingBatchId })
      },
    },
    masterBag: {
      store: MASTER_BAG_PATHS.store,
      update: (masterBagId: string | number) => {
        const staticFullUrl = MASTER_BAG_PATHS.update
  
        return compilePath(staticFullUrl, { masterBagId })
      },
      delete: (masterBagId: string | number) => {
        const staticFullUrl = MASTER_BAG_PATHS.update
  
        return compilePath(staticFullUrl, { masterBagId })
      },
    },
    facilityChute: {
      store: FACILITY_CHUTE_PATHS.store,
      update: (facilityChuteId: string | number) => {
        const staticFullUrl = FACILITY_CHUTE_PATHS.update
  
        return compilePath(staticFullUrl, { facilityChuteId })
      },
      delete: (facilityChuteId: string | number) => {
        const staticFullUrl = FACILITY_CHUTE_PATHS.update
  
        return compilePath(staticFullUrl, { facilityChuteId })
      },
    },
  },
}