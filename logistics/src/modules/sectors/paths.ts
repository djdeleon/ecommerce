import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const sectors = {
  store: '/sectors',
  update: createPath('/sectors/:id'),
  delete: createPath('/sectors/:id'),
} as const;