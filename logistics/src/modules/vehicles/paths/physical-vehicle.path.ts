import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const physicalVehicles = {
  index: '/api/v1/physical-vehicles',
  store: '/api/v1/physical-vehicles',
  show: createPath('/api/v1/physical-vehicles/:id'),
  update: createPath('/api/v1/physical-vehicles/:id'),
  available: createPath('/api/v1/physical-vehicles/:id/available'),
  inTransit: createPath('/api/v1/physical-vehicles/:id/in-transit'),
  maintenance: createPath('/api/v1/physical-vehicles/:id/maintenance'),
  delete: createPath('/api/v1/physical-vehicles/:id'),
} as const;