import { compilePath } from "#commons/utils/path-compiler.js";
import { CLIENT_PATHS } from "../../modules/clients/schema.js";
import { COURIER_PATHS } from "../../modules/couriers/schema.js";
import { FACILITY_PATHS } from "../../modules/facilities/schema.js";
import { TRACKING_NUMBER_PATHS } from "../../modules/tracking-numbers/schema.js";
import { USER_PATHS } from "../../modules/users/schemas.js";

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
}