import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { facilityId: id });
  fn.url = path;
  return fn;
}

export const facilities = {
  index: '/facilities',
  store: '/facilities',
  assignCourier: createPath('/facilities/:facilityId/assign-courier'),
} as const;