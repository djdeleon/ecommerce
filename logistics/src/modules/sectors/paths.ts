import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { sectorId: id });
  fn.url = path;
  return fn;
}

export const sectors = {
  store: '/sectors',
  update: createPath('/sectors/:sectorId'),
  delete: createPath('/sectors/:sectorId'),
} as const;