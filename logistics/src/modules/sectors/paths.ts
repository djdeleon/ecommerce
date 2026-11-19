import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const sectors = {
  index: '/api/v1/sectors',
  store: '/api/v1/sectors',
  show: createPath('/api/v1/sectors/:id'),
  update: createPath('/api/v1/sectors/:id'),
  delete: createPath('/api/v1/sectors/:id'),
} as const;