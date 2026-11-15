import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const facilities = {
  index: '/facilities',
  couriers: '/facilities/couriers',
  show: createPath('/facilities/:id'),
  store: '/facilities',
  assignCourier: createPath('/facilities/:id/assign-courier'),
} as const;