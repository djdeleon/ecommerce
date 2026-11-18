import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const vehicleProfiles = {
  index: '/api/v1/vehicle-profiles',
  store: '/api/v1/vehicle-profiles',
  show: createPath('/api/v1/vehicle-profiles/:id'),
  update: createPath('/api/v1/vehicle-profiles/:id'),
  delete: createPath('/api/v1/vehicle-profiles/:id'),
} as const;