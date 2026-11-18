import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const facilities = {
  index: '/api/v1/facilities',
  show: createPath('/api/v1/facilities/:id'),
  store: '/api/v1/facilities',
  update: createPath('/api/v1/facilities/:id'),
  delete: createPath('/api/v1/facilities/:id'),
  assignCourier: createPath('/api/v1/facilities/:id/assign-courier'),
  couriers: '/api/v1/facilities/couriers',
} as const;