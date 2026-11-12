import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string, paramKey: string) => {
  const fn = (id: string | number) => compilePath(path, { [paramKey]: id });
  fn.url = path;
  return fn;
}

export const vehicles = {
  vehicleProfiles: {
    store: '/vehicle-profiles',
    update: createPath('/vehicle-profiles/:vehicleProfileId', 'vehicleProfileId'),
    delete: createPath('/vehicle-profiles/:vehicleProfileId', 'vehicleProfileId'),
  },
  physicalVehicles: {
    store: '/physical-vehicles',
    update: createPath('/physical-vehicles/:physicalVehicleId', 'physicalVehicleId'),
    delete: createPath('/physical-vehicles/:physicalVehicleId', 'physicalVehicleId'),
  },
} as const;